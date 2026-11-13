## Why

Issue #43 surfaced demand for embedding strapd without JavaScript. Compare portable calling interfaces with actual hosts before choosing a public API, crate layout or distribution format.

## What Changes

- Add a disposable experiment comparing a buffer ABI with WIT-generated bindings over the same core operations: PII detect/mask, Base64 decode, JSON sample, UUID v7 and timestamp formatting.
- Verify native parity and exercise wazero, Wasmtime and a browser, including errors, binary results, Unicode offsets, memory reuse, clocks and randomness.
- Measure full warm calls, compilation/instantiation, artifact size and handwritten integration effort; preserve raw measurements and limitations.
- Separate browser-only dependency features from the shared core without changing existing native or browser behavior.

## Capabilities

### New Capabilities

None. This is experimental tooling, not a supported library interface; specs are explicitly skipped.

### Modified Capabilities

None.

## Impact

Experiment files under experiments/wasm-portability and dependency feature declarations in the core/browser manifests. Existing application APIs, CLI behavior, WebApp integration and release workflows remain unchanged. No publication or production packaging decision. The PoC is a separate branch and PR using the detection API merged in PR #44.
