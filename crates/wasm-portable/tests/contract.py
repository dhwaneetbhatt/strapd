"""Contract checks against the distributed core module and component."""
import hashlib
import hmac
import json
import re
import struct
import sys
import time
from pathlib import Path

import wasmtime
import wasmtime.component as component


class Component:
    def __init__(self, engine, directory):
        module = component.Component.from_file(engine, str(directory / "strapd.component.wasm"))
        linker = component.Linker(engine)
        linker.add_wasip2()
        self.store = wasmtime.Store(engine)
        self.store.set_wasi(wasmtime.WasiConfig())
        self.instance = linker.instantiate(self.store, module)
        self.called = set()

    def call(self, name, *args):
        self.called.add(name)
        function = self.instance.get_func(self.store, name)
        assert function is not None, name
        value = function(self.store, *args)
        try:
            return value
        finally:
            function.post_return(self.store)

    def ok(self, name, *args):
        value = self.call(name, *args)
        if isinstance(value, component.Variant):
            assert value.tag == "ok", (name, value)
            return value.payload
        return value

    def error(self, name, *args):
        value = self.call(name, *args)
        if isinstance(value, component.Variant):
            assert value.tag == "err", (name, value)
            value = value.payload
        # Disjoint byte-list/record/string results are untagged by this binding.
        assert isinstance(value, str) and value and not value.startswith("Error:"), (name, value)
        return value


class Core:
    def __init__(self, engine, directory):
        module = wasmtime.Module.from_file(engine, str(directory / "strapd.wasm"))
        assert module.imports and all(i.module == "wasi_snapshot_preview1" for i in module.imports)
        linker = wasmtime.Linker(engine)
        linker.define_wasi()
        self.store = wasmtime.Store(engine)
        self.store.set_wasi(wasmtime.WasiConfig())
        self.exports = linker.instantiate(self.store, module).exports(self.store)
        self.memory = self.exports["memory"]

    def call(self, name, *inputs, kind="string"):
        # Inputs transfer to the guest; copy output before generated post-return.
        args = []
        for value in inputs:
            if isinstance(value, str):
                data = value.encode("utf-8")
                pointer = self.exports["cabi_realloc"](self.store, 0, 0, 1, len(data))
                self.memory.write(self.store, data, pointer)
                args.extend((pointer, len(data)))
            else:
                args.append(value)
        result = self.exports[name](self.store, *args)
        try:
            if kind == "result":
                tag = self.memory.read(self.store, result, result + 1)[0]
                pointer, length = self.words(result + 4)
                data = bytes(self.memory.read(self.store, pointer, pointer + length))
                return tag, data
            if kind == "detect":
                pointer, length = self.words(result)
                data = self.memory.read(self.store, pointer, pointer + length * 12)
                return [struct.unpack_from("<B3xII", data, i * 12) for i in range(length)]
            if kind == "diff":
                added, removed = self.words(result + 8)
                return {"hunks": self.read_list(result, 24, self.diff_hunk),
                        "added": added, "removed": removed}
            return self.read_string(result)
        finally:
            self.exports["cabi_post_" + name](self.store, result)

    def words(self, pointer):
        return struct.unpack("<II", self.memory.read(self.store, pointer, pointer + 8))

    def read_string(self, address):
        pointer, length = self.words(address)
        return bytes(self.memory.read(self.store, pointer, pointer + length)).decode()

    def read_list(self, address, stride, read_item):
        pointer, length = self.words(address)
        return [read_item(pointer + i * stride) for i in range(length)]

    def diff_hunk(self, address):
        from_start, from_count = self.words(address)
        to_start, to_count = self.words(address + 8)
        return {"from-start": from_start, "from-count": from_count,
                "to-start": to_start, "to-count": to_count,
                "lines": self.read_list(address + 16, 32, self.diff_line)}

    def diff_line(self, address):
        # Each option<u32> is a byte discriminant, three padding bytes and a u32.
        data = self.memory.read(self.store, address, address + 32)
        kind, from_tag, from_line, to_tag, to_line = struct.unpack_from("<B3xB3xIB3xI", data)
        assert from_tag in (0, 1) and to_tag in (0, 1) and data[28] in (0, 1)
        return {"kind": ("context", "removed", "added")[kind],
                "from-line": from_line if from_tag else None,
                "to-line": to_line if to_tag else None,
                "segments": self.read_list(address + 20, 12, self.diff_segment),
                "missing-newline": bool(data[28])}

    def diff_segment(self, address):
        emphasized = self.memory.read(self.store, address + 8, address + 9)[0]
        assert emphasized in (0, 1)
        return {"text": self.read_string(address), "emphasized": bool(emphasized)}


def record_value(value):
    if isinstance(value, component.Record):
        return {name: record_value(field) for name, field in vars(value).items()}
    if isinstance(value, list):
        return [record_value(item) for item in value]
    return value


def verify_diff(host, core):
    fixture = json.loads((Path(__file__).parent / "fixtures" / "text-diff.json").read_text(encoding="utf-8"))
    original, changed = fixture["from"], fixture["to"]
    labels = fixture["from-label"], fixture["to-label"]

    def structured(original, changed, context):
        args = original, changed, context
        diff = record_value(host.ok("text-diff", *args))
        assert diff == core.call("text-diff", *args, kind="diff")
        return diff

    args = original, changed, fixture["context"]
    assert structured(*args) == fixture["structured"]
    assert host.ok("text-diff-unified", *args, *labels) == fixture["unified"]
    assert core.call("text-diff-unified", *args, *labels) == fixture["unified"]
    assert structured(original, original, 3) == {"hunks": [], "added": 0, "removed": 0}

    full = structured(original, changed, 4)
    assert full == structured(original, changed, 2**32 - 1)
    hunk, = full["hunks"]
    assert (hunk["from-start"], hunk["from-count"], hunk["to-start"], hunk["to-count"]) == (1, 4, 1, 4)
    assert hunk["lines"][1:] == fixture["structured"]["hunks"][0]["lines"]

    unchanged = "ordinary unchanged line\n"
    half_lines = (5 * 1024**2 + len(unchanged) - 1) // len(unchanged)
    padding = unchanged * half_lines
    original = padding + "clé = 30;\n" + padding
    changed = padding + "clé = 60;\n" + padding
    diff = structured(original, changed, 3)
    assert diff["added"] == diff["removed"] == 1
    hunk, = diff["hunks"]
    assert hunk["from-start"] == hunk["to-start"] == half_lines - 2
    assert hunk["from-count"] == hunk["to-count"] == 7
    lines = hunk["lines"]
    assert [line["kind"] for line in lines] == ["context"] * 3 + ["removed", "added"] + ["context"] * 3
    assert lines[3]["from-line"] == lines[4]["to-line"] == half_lines + 1


def verify_component(host):
    ok = host.ok
    data = b"\x00\xff\x80\n"
    assert ok("base64-encode", data) == "AP+ACg=="
    assert bytes(ok("base64-decode", "AP+ACg==")) == data
    assert ok("hex-encode", data) == data.hex()
    assert bytes(ok("hex-decode", data.hex())) == data
    assert ok("url-decode", ok("url-encode", "🙂 /?")) == "🙂 /?"
    for name, expected in (("uppercase", "HELLO"), ("lowercase", "hello"), ("capitalcase", "Hello")):
        assert ok("string-to-" + name, "hELLO") == expected
    for name, expected in (("lines", 2), ("words", 3), ("chars", 5), ("bytes", 8)):
        assert ok("string-count-" + name, "🙂 a\nb") == expected
    assert ok("string-reverse", "a🙂") == "🙂a"
    assert ok("string-replace", "🙂🙂", "🙂", "x") == "xx"
    assert ok("string-slugify", "Hello World", "_") == "hello_world"
    trims = [
        (True, False, False, "a  "),
        (False, True, False, "  a"),
        (False, False, False, "a"),
        (False, False, True, "a b"),
    ]
    for left, right, all_spaces, expected in trims:
        text = "  a  b  " if all_spaces else "  a  "
        assert ok("string-trim", text, left, right, all_spaces) == expected
    assert json.loads(ok("json-beautify", '{"b":2,"a":1}', True, 2)) == {"a": 1, "b": 2}
    assert ok("json-minify", '{"b": 2, "a": 1}', True) == '{"a":1,"b":2}'
    for seed in (0, 2**63, 2**64 - 1):
        sampled = ok("json-sample", "[null,[],1,2,3]", 1, seed)
        assert len(json.loads(sampled.output)) == 1
        assert getattr(sampled, "filtered-nulls") == getattr(sampled, "filtered-empty-arrays") == 1
        assert getattr(sampled, "omitted-total") == sampled.arrays[0].omitted == 2
    assert "<a>1</a>" in ok("xml-beautify", "<r><a>1</a></r>", 2)
    assert "<a>1</a>" in ok("xml-minify", "<r>\n <a>1</a>\n</r>")
    assert json.loads(ok("yaml-to-json", ok("json-to-yaml", '{"a":1}'))) == {"a": 1}
    for root in (None, "root"):
        result = json.loads(ok("xml-to-json", ok("json-to-xml", '{"a":1}', root)))
        assert result == ({root: {"a": "1"}} if root else {"a": "1"})
    for name, version in (("uuid-generate-v4", "4"), ("uuid-generate-v7", "7")):
        ids = ok(name, 2).splitlines()
        assert len(set(ids)) == 2
        pattern = r"[0-9a-f]{8}-[0-9a-f]{4}-" + version + r"[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
        assert all(re.fullmatch(pattern, value) for value in ids)
        if version == "7":
            assert abs(int(ids[0].replace("-", "")[:12], 16) - time.time() * 1000) < 5000
        for count in (0, 1025, 2**32 - 1):
            host.error(name, count)
    assert len(set(ok("ulid-generate", 2).splitlines())) == 2
    host.error("ulid-generate", 0)
    assert ok("random-string", 2, 3, [], "🙂") == ["🙂🙂🙂"] * 2
    assert len(ok("random-string", 2, 8, ["lowercase", "uppercase", "digits", "symbols"], None)) == 2
    host.error("random-string", 0, 8, ["lowercase"], None)
    host.error("random-string", 1, 0, ["lowercase"], None)
    host.error("random-string", 1, 8, [], None)
    assert ok("random-number", -(2**63), -(2**63), 2) == [-(2**63)] * 2
    assert ok("random-number", 2**63 - 1, 2**63 - 1, 1) == [2**63 - 1]
    host.error("random-number", 2, 1, 1)
    host.error("random-number", 1, 2, 0)
    assert abs(ok("datetime-now", False) - time.time()) < 5
    assert abs(ok("datetime-now", True) - time.time() * 1000) < 5000
    for name in ("datetime-from-timestamp", "datetime-from-timestamp-millis"):
        assert ok(name, 0, "iso") == "1970-01-01T00:00:00+00:00"
        assert "1970-01-01" in ok(name, 0, "human")
        host.error(name, 2**63 - 1, "iso")
    for algorithm in ("md5", "sha1", "sha256", "sha512"):
        assert ok("hash-" + algorithm, "🙂") == hashlib.new(algorithm, "🙂".encode()).hexdigest()
    for algorithm in ("sha256", "sha512"):
        for body, key in (("", ""), ("🙂\x00\n", "🔑\\\""), ("x" * 65536, "k" * 2048)):
            expected = hmac.new(key.encode(), body.encode(), algorithm).hexdigest()
            assert ok("hmac-" + algorithm, body, key) == expected
    for algorithm in ("hs256", "hs384", "hs512"):
        token = ok("jwt-sign", '{"sub":"tester"}', "secret", algorithm, None)
        assert json.loads(ok("jwt-header", token))["alg"] == algorithm.upper()
        assert json.loads(ok("jwt-payload", token))["sub"] == "tester"
        for name in ("jwt-decode", "jwt-decode-with-analysis"):
            assert isinstance(json.loads(ok(name, token)), dict)
        assert isinstance(json.loads(ok("jwt-verify", token, "secret")), dict)
        host.error("jwt-verify", token, "wrong-key")
    assert ok("jwt-sign", "{}", "secret", "hs256", 60)
    assert "1" in ok("convert", 1024.0, "byte", "kb")
    assert "kb" in ok("convert-all", 1.0, "byte")
    for category in ("bytes", "time", "length", "temperature"):
        units = ok("get-units-in-category", category)
        assert units and all(unit.category == category for unit in units)
    host.error("convert", 1.0, "bad", "byte")
    host.error("convert-all", 1.0, "bad")
    text = "🙂 dev@example.com"
    found = ok("detect-pii", text, 255)
    assert [(item.category, item.start, item.end) for item in found] == [(2, 5, 20)]
    assert ok("detect-pii", text, 0) == []
    assert "dev@example.com" not in ok("sanitize-pii", text, 255, False)
    assert "dev@example.com" not in ok("sanitize-pii", text, 255, True)
    assert "secret-value" not in ok("sanitize-secrets", "password=secret-value", 255)
    invalid = [
        ("base64-decode", ["!bad"]),
        ("hex-decode", ["gg"]),
        ("url-decode", ["%FF"]),
        ("json-beautify", ["{", False, 2]),
        ("json-minify", ["{", False]),
        ("json-sample", ["{", 1, 0]),
        ("json-sample", ["[]", 0, 0]),
        ("json-to-yaml", ["{"]),
        ("yaml-to-json", ["[invalid"]),
        ("json-to-xml", ["{", None]),
        ("jwt-decode", ["bad"]),
        ("jwt-sign", ["bad", "do-not-leak", "hs256", None]),
    ]
    for name, args in invalid:
        assert "do-not-leak" not in host.error(name, *args)
    assert bytes(ok("base64-decode", "")) == b""
    assert ok("json-minify", "[]", False) == "[]"


def main():
    directory = Path(sys.argv[1])
    engine = wasmtime.Engine()
    host = Component(engine, directory)
    verify_component(host)
    core = Core(engine, directory)
    verify_diff(host, core)
    wit = (directory / "tools.wit").read_text()
    assert wit.startswith("package strapd:tools@0.2.0;")
    expected = set(re.findall(r"export ([\w-]+): func", wit))
    assert host.called == expected, (expected - host.called, host.called - expected)
    assert expected <= set(core.exports)
    text = "🙂 dev@example.com"
    assert core.call("detect-pii", text, 255, kind="detect") == [(2, 5, 20)]
    assert core.call("base64-decode", "AP+ACg==", kind="result") == (0, b"\x00\xff\x80\n")
    assert core.call("base64-decode", "!", kind="result")[0] == 1
    expected_hmac = hmac.new(b"key", "🙂\0".encode(), "sha256").hexdigest().encode()
    assert core.call("hmac-sha256", "🙂\0", "key", kind="result") == (0, expected_hmac)
    clean = "ordinary text without personal information. " * 1600
    assert host.ok("detect-pii", clean, 255) == []
    assert host.ok("sanitize-pii", clean, 255, False) == clean
    assert core.call("detect-pii", clean, 255, kind="detect") == []
    large = "dev@example.com " * 4096
    core.call("detect-pii", large, 255, kind="detect")
    memory = core.memory.data_len(core.store)
    for _ in range(1000):
        assert len(core.call("detect-pii", large, 255, kind="detect")) == 4096
        assert core.call("base64-decode", "!", kind="result")[0] == 1
        assert core.call("base64-decode", "aGk=", kind="result") == (0, b"hi")
    assert core.memory.data_len(core.store) == memory
    for _ in range(10):
        assert len(host.ok("detect-pii", large, 255)) == 4096
        host.error("base64-decode", "!")
        assert bytes(host.ok("base64-decode", "aGk=")) == b"hi"
    print(f"Portable WASM: all {len(expected)} component exports; core ABI/imports; errors, binary, Unicode, 64-bit values, clocks/randomness, diff parity and reuse passed")


if __name__ == "__main__":
    main()
