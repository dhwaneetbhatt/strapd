package main

import (
	"context"
	cryptorand "crypto/rand"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/tetratelabs/wazero"
	"github.com/tetratelabs/wazero/api"
	"github.com/tetratelabs/wazero/imports/wasi_snapshot_preview1"
)

type testCase struct {
	Name      string `json:"name"`
	Operation uint32 `json:"operation"`
	Input     string `json:"input"`
	Option    uint32 `json:"option"`
	Seed      string `json:"seed"`
	Timestamp string `json:"timestamp"`
	Expected  any    `json:"expected"`
	Error     bool   `json:"error"`
}

type guest struct {
	module    api.Module
	ctx       context.Context
	typed     bool
	functions map[string]api.Function
}

var names = []string{"", "detect", "mask", "decode", "sample", "uuid", "timestamp"}

func check(err error) {
	if err != nil {
		panic(err)
	}
}
func (g *guest) call(name string, args ...uint64) uint32 {
	fn, ok := g.functions[name]
	if !ok {
		fn = g.module.ExportedFunction(name)
		if fn == nil {
			panic("missing export: " + name)
		}
		g.functions[name] = fn
	}
	result, err := fn.Call(g.ctx, args...)
	check(err)
	if len(result) == 0 {
		return 0
	}
	return uint32(result[0])
}
func (g *guest) read(pointer, length uint32) []byte {
	bytes, ok := g.module.Memory().Read(pointer, length)
	if !ok {
		panic("invalid guest span")
	}
	return bytes
}
func (g *guest) u32(pointer uint32) uint32  { return binary.LittleEndian.Uint32(g.read(pointer, 4)) }
func (g *guest) text(pointer uint32) string { return string(g.read(g.u32(pointer), g.u32(pointer+4))) }
func integers(bytes []byte) []int {
	out := make([]int, len(bytes))
	for i, value := range bytes {
		out[i] = int(value)
	}
	return out
}
func (g *guest) detections(pointer, count uint32) []map[string]uint32 {
	out := make([]map[string]uint32, 0, count)
	for i := uint32(0); i < count; i++ {
		p := pointer + i*12
		out = append(out, map[string]uint32{"category": g.u32(p), "start": g.u32(p + 4), "end": g.u32(p + 8)})
	}
	return out
}

func (g *guest) invoke(c testCase, input []byte) (any, bool) {
	if g.typed && c.Operation <= 4 && !utf8.Valid(input) {
		return "Invalid UTF-8", true
	}
	seed, err := strconv.ParseUint(c.Seed, 10, 64)
	check(err)
	timestamp, err := strconv.ParseInt(c.Timestamp, 10, 64)
	check(err)
	if !g.typed {
		p := g.call("input_resize", uint64(len(input)))
		if p == 0 || !g.module.Memory().Write(p, input) {
			panic("input write failed")
		}
		status := g.call("call", uint64(c.Operation), uint64(c.Option), seed, uint64(timestamp))
		pointer, length := g.call("output_ptr"), g.call("output_len")
		bytes := g.read(pointer, length)
		if status != 0 {
			return string(bytes), true
		}
		switch c.Operation {
		case 1:
			return g.detections(pointer, length/12), false
		case 3:
			return integers(bytes), false
		case 4:
			var result any
			check(json.Unmarshal(bytes, &result))
			return result, false
		default:
			return string(bytes), false
		}
	}
	args := []uint64{}
	if c.Operation <= 4 {
		p := g.call("cabi_realloc", 0, 0, 1, uint64(len(input)))
		if !g.module.Memory().Write(p, input) {
			panic("input write failed")
		}
		args = append(args, uint64(p), uint64(len(input)))
	}
	switch c.Operation {
	case 1, 2, 5:
		args = append(args, uint64(c.Option))
	case 4:
		args = append(args, uint64(c.Option), seed)
	case 6:
		args = append(args, uint64(timestamp))
	}
	name := names[c.Operation]
	ret := g.call(name, args...)
	defer g.call("cabi_post_"+name, uint64(ret))
	if c.Operation >= 3 && g.read(ret, 1)[0] != 0 {
		return g.text(ret + 4), true
	}
	switch c.Operation {
	case 1:
		return g.detections(g.u32(ret), g.u32(ret+4)), false
	case 2:
		return g.text(ret), false
	case 3:
		return integers(g.read(g.u32(ret+4), g.u32(ret+8))), false
	case 4:
		arrays := make([]map[string]any, 0, g.u32(ret+28))
		for i := uint32(0); i < g.u32(ret+28); i++ {
			p := g.u32(ret+24) + i*12
			arrays = append(arrays, map[string]any{"path": g.text(p), "omitted": g.u32(p + 8)})
		}
		return map[string]any{"output": g.text(ret + 4), "filtered_nulls": g.u32(ret + 12), "filtered_empty_arrays": g.u32(ret + 16), "omitted_total": g.u32(ret + 20), "arrays": arrays}, false
	default:
		return g.text(ret + 4), false
	}
}

func verify(c testCase, value any, failed bool) {
	if failed != c.Error {
		panic(fmt.Sprintf("%s: unexpected error status: %v", c.Name, value))
	}
	if c.Operation == 5 && !failed {
		ids := strings.Split(value.(string), "\n")
		if len(ids) != int(c.Option) {
			panic("UUID count")
		}
		seen := map[string]bool{}
		for _, id := range ids {
			if len(id) != 36 || id[14] != '7' || !strings.ContainsRune("89ab", rune(id[19])) || seen[id] {
				panic("invalid or duplicate UUID v7")
			}
			millis, err := strconv.ParseInt(strings.ReplaceAll(id[:13], "-", ""), 16, 64)
			check(err)
			if delta := time.Now().UnixMilli() - millis; delta < -5000 || delta > 5000 {
				panic("UUID clock missing or incorrect")
			}
			seen[id] = true
		}
		return
	}
	bytes, err := json.Marshal(value)
	check(err)
	var normalized any
	check(json.Unmarshal(bytes, &normalized))
	if !reflect.DeepEqual(normalized, c.Expected) {
		panic(fmt.Sprintf("%s op %d: got %s expected %v", c.Name, c.Operation, bytes, c.Expected))
	}
}

func main() {
	ctx := context.Background()
	data, err := os.ReadFile("../build/cases.json")
	check(err)
	var cases []testCase
	check(json.Unmarshal(data, &cases))
	csv := "engine,interface,fixture,bytes,operation,median_ms,p95_ms\n"
	startup := map[string]any{}
	for _, kind := range []string{"buffer", "wit-core"} {
		runtime := wazero.NewRuntime(ctx)
		_, err := wasi_snapshot_preview1.Instantiate(ctx, runtime)
		check(err)
		bytes, err := os.ReadFile("../build/" + kind + ".wasm")
		check(err)
		start := time.Now()
		compiled, err := runtime.CompileModule(ctx, bytes)
		check(err)
		compileTime := time.Since(start).Seconds() * 1000
		for _, imp := range compiled.ImportedFunctions() {
			mod, name, _ := imp.Import()
			if mod != "wasi_snapshot_preview1" {
				panic("unexpected host import: " + mod + "." + name)
			}
		}
		start = time.Now()
		module, err := runtime.InstantiateModule(ctx, compiled, wazero.NewModuleConfig().WithStartFunctions("_initialize").WithSysWalltime().WithSysNanotime().WithRandSource(cryptorand.Reader))
		check(err)
		instantiateTime := time.Since(start).Seconds() * 1000
		g := guest{module, ctx, kind == "wit-core", map[string]api.Function{}}
		for _, c := range cases {
			value, failed := g.invoke(c, []byte(c.Input))
			verify(c, value, failed)
		}
		_, invalidUTF8 := g.invoke(cases[0], []byte{255})
		if !invalidUTF8 {
			panic("invalid UTF-8 accepted")
		}
		value, failed := g.invoke(cases[0], []byte(cases[0].Input))
		verify(cases[0], value, failed)
		if !g.typed {
			c := cases[0]
			_, failed := g.invoke(c, []byte{255})
			if !failed {
				panic("invalid UTF-8 accepted")
			}
			value, failed := g.invoke(c, []byte(c.Input))
			verify(c, value, failed)
			c.Operation = 99
			_, failed = g.invoke(c, []byte{})
			if !failed {
				panic("unknown operation accepted")
			}
			if g.call("input_resize", 8*1024*1024+1) != 0 {
				panic("oversized input accepted")
			}
		}
		for _, c := range cases {
			if !strings.HasPrefix(c.Name, "clean-") && !strings.HasPrefix(c.Name, "dense-") {
				continue
			}
			for i := 0; i < 20; i++ {
				_, _ = g.invoke(c, []byte(c.Input))
			}
			input := []byte(c.Input)
			samples := make([]float64, 201)
			for i := range samples {
				start := time.Now()
				_, _ = g.invoke(c, input)
				samples[i] = time.Since(start).Seconds() * 1000
			}
			sort.Float64s(samples)
			fixture := strings.Split(c.Name, "-")[0]
			csv += fmt.Sprintf("wazero,%s,%s,%d,%d,%.6f,%.6f\n", kind, fixture, len(input), c.Operation, samples[100], samples[190])
		}
		c := cases[18]
		for i := 0; i < 100; i++ {
			_, _ = g.invoke(c, []byte(c.Input))
		}
		before := module.Memory().Size()
		for i := 0; i < 1000; i++ {
			value, failed := g.invoke(c, []byte(c.Input))
			verify(c, value, failed)
		}
		after := module.Memory().Size()
		if after != before {
			panic(fmt.Sprintf("unbounded memory: %s %d -> %d", kind, before, after))
		}
		startup[kind] = map[string]any{"compile_ms": compileTime, "instantiate_ms": instantiateTime, "memory_bytes": after, "checks": len(cases), "module_bytes": len(bytes)}
		fmt.Printf("wazero %s: %d cases and 1000 reuse calls passed; memory %d bytes\n", kind, len(cases), after)
		check(runtime.Close(ctx))
	}
	check(os.WriteFile("../build/wazero.csv", []byte(csv), 0644))
	bytes, err := json.MarshalIndent(startup, "", "  ")
	check(err)
	check(os.WriteFile("../build/wazero-startup.json", bytes, 0644))
}
