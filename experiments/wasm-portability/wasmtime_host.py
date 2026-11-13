"""Experimental Wasmtime host: buffer ABI and generated component interface."""
import json
import re
import time
from pathlib import Path

import wasmtime
import wasmtime.component as component

BUILD = Path("build")
NAMES = [None, "detect", "mask", "decode", "sample", "uuid", "timestamp"]


def normalize(value):
    if isinstance(value, bytes):
        return list(value)
    if isinstance(value, list):
        return [normalize(item) for item in value]
    if hasattr(value, "__dict__"):
        return {key.replace("-", "_"): normalize(item) for key, item in vars(value).items()}
    return value


def verify(case, value, error):
    assert error == case["error"], (case["name"], value, error)
    if case["operation"] == 5 and not error:
        ids = value.split("\n")
        assert len(ids) == len(set(ids)) == case["option"]
        for identifier in ids:
            assert re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", identifier)
            millis = int(identifier[:13].replace("-", ""), 16)
            assert abs(time.time() * 1000 - millis) < 5000
    else:
        assert value == case["expected"], (case["name"], case["operation"], value, case["expected"])


class Buffer:
    def __init__(self, engine):
        start = time.perf_counter()
        module = wasmtime.Module.from_file(engine, str(BUILD / "buffer.wasm"))
        self.compile_ms = (time.perf_counter() - start) * 1000
        assert all(item.module == "wasi_snapshot_preview1" for item in module.imports)
        linker = wasmtime.Linker(engine)
        linker.define_wasi()
        self.store = wasmtime.Store(engine)
        self.store.set_wasi(wasmtime.WasiConfig())
        start = time.perf_counter()
        self.exports = linker.instantiate(self.store, module).exports(self.store)
        self.instantiate_ms = (time.perf_counter() - start) * 1000
        self.memory = self.exports["memory"]

    def invoke(self, case, encoded=None):
        data = case["input"].encode() if encoded is None else encoded
        pointer = self.exports["input_resize"](self.store, len(data))
        assert pointer
        self.memory.write(self.store, data, pointer)
        seed = int(case["seed"])
        if seed >= 2**63:
            seed -= 2**64
        status = self.exports["call"](self.store, case["operation"], case["option"], seed, int(case["timestamp"]))
        pointer = self.exports["output_ptr"](self.store)
        length = self.exports["output_len"](self.store)
        out = bytes(self.memory.read(self.store, pointer, pointer + length))
        if status:
            return out.decode(), True
        operation = case["operation"]
        if operation == 1:
            integers = [int.from_bytes(out[i:i + 4], "little") for i in range(0, len(out), 4)]
            return [dict(zip(["category", "start", "end"], integers[i:i + 3])) for i in range(0, len(integers), 3)], False
        if operation == 3:
            return list(out), False
        if operation == 4:
            return json.loads(out), False
        return out.decode(), False


class Typed:
    def __init__(self, engine):
        start = time.perf_counter()
        module = component.Component.from_file(engine, str(BUILD / "component.wasm"))
        self.compile_ms = (time.perf_counter() - start) * 1000
        linker = component.Linker(engine)
        linker.add_wasip2()
        self.store = wasmtime.Store(engine)
        self.store.set_wasi(wasmtime.WasiConfig())
        start = time.perf_counter()
        instance = linker.instantiate(self.store, module)
        self.instantiate_ms = (time.perf_counter() - start) * 1000
        self.functions = {name: instance.get_func(self.store, name) for name in NAMES[1:]}

    def invoke(self, case, encoded=None):
        operation = case["operation"]
        args = [case["input"]] if operation <= 4 else []
        if operation in [1, 2, 5]:
            args.append(case["option"])
        elif operation == 4:
            args.extend([case["option"], int(case["seed"])])
        elif operation == 6:
            args.append(int(case["timestamp"]))
        function = self.functions[NAMES[operation]]
        value = function(self.store, *args)
        try:
            if isinstance(value, component.Variant):
                return normalize(value.payload), value.tag == "err"
            # Results with disjoint success/error Python types are untagged.
            error = operation in [3, 4] and isinstance(value, str)
            return normalize(value), error
        finally:
            function.post_return(self.store)


def main():
    cases = json.loads((BUILD / "cases.json").read_text())
    engine = wasmtime.Engine()
    rows = ["engine,interface,fixture,bytes,operation,median_ms,p95_ms"]
    startup = {}
    for kind, host in [("buffer", Buffer(engine)), ("component", Typed(engine))]:
        for case in cases:
            verify(case, *host.invoke(case))
        if kind == "buffer":
            assert host.invoke(cases[0], b"\xff")[1]
            verify(cases[0], *host.invoke(cases[0]))
        for case in cases:
            if not case["name"].startswith(("clean-", "dense-")):
                continue
            for _ in range(20):
                host.invoke(case)
            samples = []
            for _ in range(201):
                start = time.perf_counter_ns()
                host.invoke(case)
                samples.append((time.perf_counter_ns() - start) / 1e6)
            samples.sort()
            rows.append(f"wasmtime-python,{kind},{case['name'].split('-')[0]},{len(case['input'].encode())},{case['operation']},{samples[100]:.6f},{samples[190]:.6f}")
        # Reuse after errors, large outputs and alternating operations exercises post-return cleanup.
        for _ in range(20):
            for case in cases:
                verify(case, *host.invoke(case))
        startup[kind] = {"compile_ms": host.compile_ms, "instantiate_ms": host.instantiate_ms, "checks": len(cases)}
        print(f"Wasmtime {kind}: {len(cases)} oracle cases and 20 reuse rounds passed")
    (BUILD / "wasmtime.csv").write_text("\n".join(rows) + "\n")
    (BUILD / "wasmtime-startup.json").write_text(json.dumps(startup, indent=2) + "\n")


if __name__ == "__main__":
    main()
