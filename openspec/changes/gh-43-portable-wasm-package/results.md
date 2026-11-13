# WASM portability PoC results

Decision (2026-11-13): use **WIT** for the portable library; keep the WebApp on
its existing wasm-bindgen bindings. This file records the completed experiment’s findings, not a supported API or SDK.

## Scope and evidence

Compared a custom buffer ABI with WIT over PII detect/mask, binary Base64 decode,
seeded JSON sampling, UUIDv7 and timestamps. Both used the same native core.
69 oracle cases covered Unicode byte offsets, malformed inputs, binary data,
64-bit seeds/timestamps and clock/randomness services. All passed in wazero,
Wasmtime Python and Chromium. A follow-up added six two-string HMAC cases;
all 75 passed through both approaches and generated Go bindings. HMAC also
matched Go's standard library. These are PoC observations, not integration tests.

The original compiled Go consumer still passed its original
69 cases against each extended module without recompilation. This establishes
old-consumer/new-additive-export compatibility, not record-layout or reverse
compatibility. Frozen source SHA256:
`3af9e0dcbeaba6decb899cc45c98e04e4ffe0fed2369e26c6719af10ee941bf3`;
binary: `f0c5c5df8a5975058c0c8aad39eb90b06bd9e9e1f1f1b809d9e7e6a3ccac56de`.

## Latency

Warm full-call milliseconds on one arm64 macOS machine; small differences are
not a universal ranking. Go/Python samples were individual calls; browser
percentiles used ten-call batch means. Native excludes host copying/conversion.

| 64 KiB detection, median / p95 | Clean | Dense (4,011 records) |
| --- | ---: | ---: |
| Native core | 0.159 / 0.179 | 0.216 / 0.224 |
| wazero / buffer | 0.341 / 0.351 | 0.783 / 0.959 |
| wazero / WIT core, manual adapter | 0.358 / 0.377 | 0.782 / 0.930 |
| Wasmtime Python / buffer | 0.269 / 0.279 | 2.243 / 2.341 |
| Wasmtime Python / component | 0.275 / 0.303 | 42.085 / 43.895 |
| Chromium / buffer | 0.210 / 0.230 | 0.300 / 0.310 |
| Chromium / component | 0.290 / 0.300 | 0.480 / 0.500 |
| Chromium / existing bindings | 0.260 / 0.270 | 0.400 / 0.420 |

Go clean detection medians for buffer / WIT were 0.000792 / 0.000833 ms at
128 B, 0.005625 / 0.005875 at 1 KiB, 0.022333 / 0.022792 at 4 KiB and
0.111709 / 0.111833 at 20 KiB.

The Python component's dense slowdown was mostly dynamic list/record conversion:
three profiled calls spent 0.224 of 0.257 seconds there, plus 0.030 seconds
normalizing results. This is a Python binding limitation, not scanner execution
or an inherent WIT overhead. Profiling timings are diagnostic, not benchmarks.

Upstream-generated Go calls measured clean 0.347125 / 0.360916 ms and dense
0.536625 / 0.576375 ms median / p95 at 64 KiB. They include UTF-8 validation and
guest cleanup but return typed structs; manual adapters returned maps. These
figures show viability, not a like-for-like speedup. Linear memory stayed fixed
over 1,000 Detect calls; other methods were not individually stress-tested.

## Maintenance and ecosystem

[Gravity revision ee8d0e55](https://github.com/arcjet/gravity/tree/ee8d0e55be5cb29cd6b3cdfb93d901b9eaaec623)
generated the complete seven-operation interface, including lists of records,
bytes, nested sampling metadata, 64-bit values and two input strings. The actual
generator supports more than its README listed. Its 729 generated lines compiled
and passed all 75 cases without edits or a custom generator. Source SHA256:
`5f4fe1921336d7ee7475e9d6413caf3a84deaa6cfea310f00b119c779796e797`.

It required a 30-line generic WASI setup hook touching private generated factory
fields. Bare factory instantiation failed with missing `wasi_snapshot_preview1`.
Generated methods assumed valid UTF-8 and could panic on host/trap/cleanup errors.
The harness guarded strings. This was a pinned-tool workaround, not a production
Go SDK or a supported upstream extension API. No such wrapper ships with strapd.
Plain wazero loaded the generated **core module**, not a component.

HMAC cost one WIT declaration and four Rust forwarding lines. The buffer path
needed an additional options buffer, JSON key metadata, fixed error validation
and handwritten Go marshalling. Its old calls and malformed-options recovery
worked, but strapd would own that protocol's schema and memory conventions.
WIT provides typed bindings and standard ownership at the required latency.

## Browser, artifacts and semantics

The six-operation WIT core was 177,867 bytes; its component was 201,233 bytes.
The component's browser JS was 309,066 bytes plus 61,990 bytes across ten WASI
shim files, versus 42,484 bytes of existing binding JS. Existing WASM was
698,356 bytes but exposed the full 52-operation catalog, so WASM sizes are not
a feature-equivalent comparison. Outputs were unbundled/unminified. Browser
startup included fetching and JS loading, unlike core compile/instantiate tests.

Both PoC core modules imported six Preview 1 functions: random_get, clock_time_get,
environ_get/environ_sizes_get, fd_write and proc_exit; no JavaScript imports.
The component adapter exposed broader WASI interfaces. No filesystem permissions
were required. UUID tests checked real clock values and unique version-7 IDs.

In Asia/Kolkata, browser timestamp zero was `1970-01-01T05:30:00+05:30`;
WASI was `1970-01-01T00:00:00+00:00`. Browser Base64 decoded arbitrary bytes
to lossy text. The portable contract should preserve binary bytes and explicitly
document UTC without changing browser behavior.

## Validation and limits

PoC baseline checks passed: 760 Rust tests, 339 WebApp tests, 15 browser tests,
99 CLI smoke cases (one unavailable clipboard skip), 13 no-default-feature PII
and allocation tests, lint/build/format checks and independent ownership review.
Maintenance follow-up checked all 75 host cases and rebuilt browser WASM.

Versions: Rust 1.97.1, Go 1.26.2, wazero 1.12.0, Wasmtime/adapter 50.0.1,
wit-bindgen 0.63.0, wasm-tools 1.263.0, jco 1.41.0, preview2-shim 0.31.1,
Node 24.22.3, Python 3.14.7, Chromium 156 and wasm-pack 0.15.0.

Not tested: other engines/languages, Safari/Firefox, direct wasip2 compilation,
concurrent calls, production traffic or a full-catalog generated Go SDK. No
release or artifact publication occurred. Integration has its own tests and
contract; PoC signatures, numeric operations and buffer limits are discarded.
