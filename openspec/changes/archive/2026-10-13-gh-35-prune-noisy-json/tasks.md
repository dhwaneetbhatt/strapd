## 1. Prototype and synthetic verification

- [x] 1.1 Build a small core-only prototype that parses JSON, recursively drops named keys and empty values, samples retained arrays, and returns typed counts with final-output paths.
- [x] 1.2 Add a synthetic corpus covering root values, cascading empty containers, nested arrays, exact key matching, escaped path segments, sampling at 2N and 2N+1, retained and omitted nested branches, and invalid input.
- [x] 1.3 Run the corpus against the prototype and record exact output and statistics, including any defects or unresolved edge cases.
- [x] 1.4 Benchmark the prototype in release mode on small JSON, wide objects, deep nesting, and large arrays; record latency or throughput plus allocations and peak memory where measurable.

## 2. Prototype review checkpoint

- [x] 2.1 Obtain an independent correctness review of core semantics and statistics, resolve findings, and rerun affected synthetic cases.
- [x] 2.2 Present the prototype behavior, synthetic-case results, and benchmark evidence for user review; proceed to the full solution only after the prototype is accepted.

## 3. Optimized core implementation

- [x] 3.1 Convert the accepted prototype into the production core API, preserving raw JSON output and typed statistics without a CLI response wrapper.
- [x] 3.2 Profile and optimize parse, traversal, mutation, path construction, and serialization to avoid avoidable copies, parses, and allocations; compare the same corpus and benchmarks with the prototype.
- [x] 3.3 Add focused core tests for the final contract and stress cases, including deep input handling and equivalent results after optimization.

## 4. CLI implementation and performance checkpoint

- [x] 4.1 Add `strapd json prune` options for positional input or stdin, drop keys, opt-in sampling with default N=3, and `--output raw|json` with raw as default.
- [x] 4.2 Build the `data`/`metadata` JSON response only at the CLI edge and verify typed data, exact metadata fields, raw output, stderr errors, and unsupported output options on other commands.
- [x] 4.3 Measure the release CLI executable end to end for positional input and stdin in raw and JSON response modes across the synthetic workloads; record startup-inclusive latency, throughput, and memory evidence alongside the prototype baseline.
- [x] 4.4 Present CLI correctness and end-to-end performance evidence for user review; proceed to WASM, WebApp, and Pipes only after this checkpoint is accepted.

## 5. WASM, WebApp, and Pipes integration

- [x] 5.1 Add WASM access to the shared operation and its typed statistics without constructing the CLI response shape; rebuild the WASM package.
- [x] 5.2 Add a visible JSON Prune tool with equivalent key and sampling controls, raw JSON output, and a separate summary of omissions.
- [x] 5.3 Register the tool with a versioned Pipes transform contract so saved configuration is validated and only raw JSON is forwarded downstream.
- [x] 5.4 Verify CLI, WebApp, and Pipes equivalence on the synthetic corpus, including invalid input and nested sampling paths.

## 6. Documentation and final verification

- [x] 6.1 Document pruning order, cascading removal, root behavior, key matching, sampling threshold, path/count semantics, local processing, and CLI raw/JSON examples in user documentation.
- [x] 6.2 Run Rust and WebApp formatting, lint, tests, WASM build, and production WebApp build; fix regressions.
- [x] 6.3 Re-run release benchmarks after integration, document before/after throughput and memory evidence, and request a final independent core correctness review before sign-off.
- [x] 6.4 Validate the OpenSpec change, reconcile any spec or design drift, and archive the change after implementation is complete.
