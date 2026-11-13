## Context

The browser bindings use wasm-bindgen and JS-specific dependency features. The native core already provides all six selected operations. PR #44 supplies the shared PII detection API; the PoC branches from that work.

## Goals / Non-Goals

Compare calling contracts and host integration with identical core behavior. Keep experimental crates outside the production workspace. Do not introduce a supported API, a client SDK, a complete operation registry, WebApp migration or release artifacts.

## Decisions

- Use a separate workspace under experiments/wasm-portability with a shared operation module, a buffer-ABI cdylib, a WIT cdylib and focused host harnesses. Share operation results and fixtures rather than duplicate algorithms.
- Build both core modules for wasm32-wasip1 to keep the compiler and host services comparable. Wrap the WIT module using the standard Preview 1 reactor adapter for Wasmtime/component/browser tests. Inspect required imports and generated export layouts.
- The buffer ABI owns reusable input/output buffers, exposes their pointers and lengths, validates UTF-8 and returns an explicit error status. The host serializes calls per instance. It is deliberately experimental, not a public allocation protocol.
- WIT uses typed records/lists/results with generated guest bindings. Plain wazero exercises the generated core module's Canonical ABI directly for this small surface; any handwritten lifting cost is recorded rather than hidden behind a new generator. Wasmtime and jco exercise the component form.
- Native fixtures form the correctness oracle for both approaches. Test binary Base64 output, invalid input recovery, UTF-8 detection spans, nested JSON sampling metadata with 64-bit seeds, UUID v7 time/randomness and timestamp timezone behavior.
- Use identical clean/dense PII bytes at 128 B, 1 KiB, 4 KiB, 20 KiB and 64 KiB. Report warm full-call median/p95, compile/instantiate separately, module/binding sizes, memory growth and source lines. Match timing boundaries; do not infer cross-engine speedups from incompatible measurements.
- Keep tool installation local to the experiment or temporary tool directory. Add only experimental Make targets needed to build/run it. Existing browser exports and WebApp remain on the current path; rebuild and run their relevant checks after feature separation.

## Risks / Trade-offs

- Generated core ABI details need careful lifting and cleanup → inspect generated Rust, test result errors and repeated calls, and request an independent review.
- WASI and browser timezone behavior differ → report the difference explicitly; do not silently change application semantics.
- Feature unification could reintroduce browser imports → build the experiment separately and inspect dependency trees/imports.
- Benchmarks on a shared laptop vary → record exact tooling, sample counts, timing boundaries and raw data; repeat only when needed to resolve anomalies.

## Migration Plan

Keep the experiment off production build paths. Deliver code and a comparison report in a separate draft PR; no publishing or API commitment. Any production adoption needs a later design decision.
