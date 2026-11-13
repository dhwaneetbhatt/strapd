## Context

See proposal.md and results.md. WIT met the latency target and upstream Go generation handled the tested types. The browser's component shims added cost, so the existing wasm-bindgen crate remains dedicated to the WebApp.

## Goals / Non-Goals

Ship a reusable contract and reproducible pair of artifacts for the current browser catalog. Do not ship a Go SDK, generated host bindings, per-client wrapper, replacement browser runtime, benchmark framework or custom buffer protocol.

## Decisions

- Add `crates/wasm-portable`, depending on core without default/browser features. Keep `crates/wasm` and its imports unchanged. Targeted WASI builds avoid accidentally using the browser dependency path.
- Use `strapd:tools@0.1.0`, world `tools`, with named exports matching existing operation names. One flat world keeps core-runtime generation usable; a single Guest implementation keeps forwarding code direct. Version the contract independently from the existing crate/release version. Breaking contract changes require a WIT version change; regenerate consumers for additive exports.
- Use typed byte lists, PII records and sampling metadata instead of packed triples or JSON envelopes. Existing inherently JSON operations (JWT/format conversion) retain JSON text outputs. Use typed timestamp format, unit category and JWT algorithm enums. Random-string character selection is a list of enum values, avoiding unsupported flags in the tested Go generator and excessive flattened ABI arguments. IDs remain newline-delimited core output. Counts for generation are 1..=1024; random range validation precedes core calls to avoid panics/oversized allocations.
- Use wit-bindgen 0.63.0 for Rust. Build wasm32-wasip1 reactor with embedded WIT, then wrap with pinned standard WASI reactor adapter using wasm-tools. Deliver `strapd.wasm`, `strapd.component.wasm`, `tools.wit` and SHA256SUMS as a tarball. No generated binaries checked into Git.
- Add Make targets and reuse existing setup/CI/release workflows. Contract tests exercise the real core module in a core runtime and the component in Wasmtime, validating imports and export coverage as well as errors/reuse. Keep test tooling isolated under ignored target output, not an experimental workspace.
- Retain PoC conclusions and representative measurements in results.md within this change; ship no experimental source or generated output. The integration remains one change in the same PR.

The mobile regression assertion retries its existing viewport checks during the dialog entrance animation; it still fails persistent overflow and changes no application behavior.

## Risks / Trade-offs

- WIT generation is not a supported Go SDK: consumers must select tooling and configure WASI. Gravity's private-field WASI workaround and trap/UTF-8 behavior are documented as PoC evidence, not shipped code.
- Component adapters expose WASI interfaces beyond clocks/randomness: hosts grant no preopened directories or inherited environment by default. Resource limits/fuel belong to hosts; generation count limits do not bound arbitrary input sizes.
- UTF-8 and ownership are Canonical ABI preconditions: use generated bindings, release returned allocations and serialize each instance. Runtime failures are traps, distinct from returned domain errors.
- WASI local timestamps are UTC, unlike browser local time. This is explicit portable behavior; no browser semantics change.
- New tools increase build dependencies: pin versions and adapter hash, validate both artifacts in CI, package without publishing until review.
