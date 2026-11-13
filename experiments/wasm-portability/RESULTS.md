# PoC results — 2026-11-13

Both approaches work over the selected surface. This experiment does not select
a production interface or publish an artifact. WIT/core and buffer calling
costs are close in plain wazero on this machine; integration effort and result
lifting costs differ considerably between hosts.

## Correctness and compatibility

| Host | Buffer ABI | WIT path |
| --- | --- | --- |
| wazero 1.12.0 | Preview 1 module; 69 oracle cases pass | Generated Preview 1 core module; 69 cases pass through a handwritten Canonical ABI adapter |
| Wasmtime 50.0.1 Python | Preview 1 module; 69 cases pass | Actual component with runtime-provided WASIp2; 69 cases pass |
| Chromium 156 | Preview 1 module; 69 cases pass with a small exercised-import shim | Actual component transpiled by jco; 69 cases pass with preview2-shim |

Plain wazero is **not** loading the component file. The Go adapter handles only
these exact generated signatures/layouts and explicitly validates UTF-8. A
production interface would need a documented/generated host binding strategy.
WIT metadata is present in the core module, but does not automatically provide
native Go host bindings.

Both core modules import exactly six WASI functions: random_get,
environ_get/environ_sizes_get, clock_time_get, fd_write and proc_exit.
There are no JavaScript imports. The standard component adapter exposes a
broader set of WASI interfaces, including filesystem/stdio interfaces; the six
operations do not themselves require filesystem access.

The existing browser API was also checked. Binary Base64 decoding currently
returns lossy text instead of bytes, and UUID count validation differs; those
existing differences were handled explicitly, not changed by the experiment.

## Warm latency

Measurements are from one arm64 macOS development machine, collected serially
after compilation and regression tests completed. See README for timing
boundaries and fixture construction. All values below are milliseconds;
small differences on this shared machine are not evidence of a universal winner.

Clean input in wazero, full-call **median**:

| Bytes | Buffer detect | WIT-core detect | Buffer mask | WIT-core mask |
| --- | ---: | ---: | ---: | ---: |
| 128 | 0.000792 | 0.000833 | 0.000833 | 0.000875 |
| 1024 | 0.005625 | 0.005875 | 0.005708 | 0.005917 |
| 4096 | 0.022333 | 0.022792 | 0.022416 | 0.022875 |
| 20480 | 0.111709 | 0.111833 | 0.112583 | 0.113000 |
| 65536 | 0.340708 | 0.357958 | 0.356416 | 0.363542 |

64 KiB **detection**, median / p95:

| Host/interface | Clean | Dense (4,011 records) |
| --- | ---: | ---: |
| Native core | 0.159 / 0.179 | 0.216 / 0.224 |
| wazero / buffer | 0.341 / 0.351 | 0.783 / 0.959 |
| wazero / WIT core | 0.358 / 0.377 | 0.782 / 0.930 |
| Wasmtime Python / buffer | 0.269 / 0.279 | 2.243 / 2.341 |
| Wasmtime Python / component | 0.275 / 0.303 | 42.085 / 43.895 |
| Chromium / buffer | 0.210 / 0.230 | 0.300 / 0.310 |
| Chromium / component | 0.290 / 0.300 | 0.480 / 0.500 |
| Chromium / existing wasm-bindgen | 0.260 / 0.270 | 0.400 / 0.420 |

Native core excludes encoding/copying/host objects. Browser p95 is a percentile
of ten-call batch means; Go/Python p95 is an individual-call sample percentile.
Compare interfaces within each host, not engine rankings across different
language bindings. Full detection/masking matrices at all five sizes are in
[native.csv](results/native.csv), [wazero.csv](results/wazero.csv),
[wasmtime.csv](results/wasmtime.csv) and [browser.csv](results/browser.csv).

The Python component's dense-record result is an important limitation of this
particular integration. A separate cProfile run over three 4,011-record calls
spent 0.224 of 0.257 profiled seconds in the component binding's list/record
conversion, including repeated record-field introspection; normalizing the
result added another 0.030 seconds. Profiling adds overhead, so these are an
attribution diagnostic, not benchmark samples. The raw profile is retained in
[python-component-profile.txt](results/python-component-profile.txt). This is
not evidence that executing the same scanner or the Canonical ABI inherently
costs 42 ms: the Go and browser results demonstrate otherwise.

## Artifact and browser integration cost

Raw / gzip bytes (gzip is a separate size calculation; the local harness served
uncompressed files):

| Artifact | Raw | Gzip |
| --- | ---: | ---: |
| buffer.wasm | 183,035 | 63,146 |
| wit-core.wasm | 177,867 | 62,385 |
| component.wasm | 201,233 | 70,016 |
| js/component.js | 309,066 | 49,772 |
| baseline/strapd_wasm.js | 42,484 | 4,583 |
| baseline/strapd_wasm_bg.wasm | 698,356 | 273,460 |

The component browser package additionally loads two WASM files totalling
189,200 bytes and 10 WASI shim JS files totalling 61,990 bytes.
These are generated/unbundled, unminified outputs; no JS tree-shaking or
component-specific size optimization was attempted. The existing browser
baseline includes its full 52-operation module, while the PoC modules expose
six operations, so their total WASM sizes are not a like-for-like feature
comparison. Exact assets, gzip sizes and hashes are in
[metadata.json](results/metadata.json) and the actual loaded-file list in
[browser-assets.json](results/browser-assets.json).

The handwritten guest wrapper is 63 lines for buffer versus 53 Rust + 26 WIT
lines for the typed interface. The Go host is 288 lines including both adapters,
oracle verification, timing and memory checks. Source line counts include
formatting and are descriptive rather than a maintainability score. Shared
operation mappings and fixture/benchmark code are counted separately in metadata.
The browser buffer shim only implements the exercised WASI subset; it is not a
replacement for a general WASI browser implementation.

## Startup and memory

These are single observed compile/instantiate times, not cold-start distributions:

| Host/interface | Compile ms | Instantiate ms |
| --- | ---: | ---: |
| wazero / buffer | 41.577 | 0.038 |
| wazero / wit-core | 32.594 | 0.123 |
| Wasmtime Python / buffer | 26.782 | 0.334 |
| Wasmtime Python / component | 17.996 | 1.340 |

Browser component/existing-binding startup includes fetching and JS module
loading, unlike the buffer compile/instantiate fields. Those values are kept
in [browser-startup.json](results/browser-startup.json) with distinct field
names and are not treated as an equivalent cold-start comparison.

After warmup, 1,000 repeated large calls left wazero linear memory unchanged
at 1,703,936 bytes for buffer and 1,507,328 bytes for WIT-core. Browser buffer
memory also stayed fixed across the corresponding reuse check. Runtime/component
APIs hide their memory; repeated mixed operations/errors passed there, but an
equivalent direct heap-size check was not available through those APIs.

## Semantics that a production design must decide

In a browser context configured for Asia/Kolkata, timestamp zero produces:

- Existing browser binding: `1970-01-01T05:30:00+05:30`.
- Both WASI paths: `1970-01-01T00:00:00+00:00`.

This matches the current Chrono backend difference; WASI does not give this
implementation the browser's local timezone. No WebApp behavior was changed.
Also decide byte-vs-text decoding, stable error representation, category/type
evolution, allocation ownership, instance serialization and supported host
bindings before choosing an API. The experiment's operation numbers and buffer
limits are disposable conventions.

## Validation and limits

- All 69 oracle cases pass for each experimental host/interface combination;
  Unicode offsets, 64-bit values, binary output, errors and UUID host services
  are covered. Reuse/recovery checks pass.
- Independent read-only review checked ownership, generated result layouts,
  post-return cleanup, clocks/randomness and timing boundaries. The missing
  UTF-8 check in the manual Go WIT bridge and mismatched Python encoding timing
  boundary were fixed before the final serial measurements.
- Production checks: 760 Rust tests, 339 WebApp tests, 15 browser tests;
  CLI smoke 99 passed / 1 unavailable-clipboard skip / 0 failed.
  The no-default-feature PII/allocation subset passes 13 tests.
- Root and experiment Rust formatting/clippy, WebApp lint/build and browser
  WASM rebuild pass. The production default feature behavior is preserved.
- macOS sandbox restrictions initially prevented wasm-opt/Chromium from
  running. Rebuilding first and running those checks outside the sandbox passed.
  Initial tests started before a successful WASM rebuild were discarded and
  rerun. UTC was used for existing timezone-sensitive Rust/CLI assertions.

Toolchain: Rust 1.97.1; Node 24.22.3; Python 3.14.7; Go 1.26.2;
wazero 1.12.0; Wasmtime Python/reactor adapter 50.0.1; wit-bindgen 0.63.0;
wasm-tools 1.263.0; jco 1.41.0; preview2-shim 0.31.1; wasm-pack 0.15.0;
Chromium 156.0.8078.4 (Playwright revision 1248). Manifests/lockfiles pin the
experiment's dependencies; core dependency versions were seeded from the root
lockfile so the comparison does not silently upgrade UUID/JSON dependencies.

Not tested: other engines/languages, Safari/Firefox, native Wasmtime Rust/C host
bindings, automatic Go host code generation, a direct wasm32-wasip2 build,
parallel calls or production traffic. No NER/coverage change, SDK, full operation
catalog, application migration or release was added. Neither path is adopted.
