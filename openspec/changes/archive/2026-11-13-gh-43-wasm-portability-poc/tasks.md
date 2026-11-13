## 1. Experiment setup

- [x] 1.1 Isolate browser dependency features and create the standalone experimental workspace/build commands.
- [x] 1.2 Add shared operation mappings, deterministic correctness fixtures and native timing baseline.

## 2. Calling interfaces

- [x] 2.1 Implement the reusable buffer ABI with error/reuse checks.
- [x] 2.2 Generate typed WIT bindings and build both core-module and component forms.

## 3. Host verification and measurements

- [x] 3.1 Exercise both core interfaces in plain wazero; verify parity, failures, host services and memory behavior, and record compile/instantiate/warm timings.
- [x] 3.2 Exercise buffer/module and typed/component calls in Wasmtime, documenting binding costs and limitations.
- [x] 3.3 Exercise both approaches in a browser and compare with the existing browser bindings without migrating the WebApp.

## 4. Review and delivery

- [x] 4.1 Run production regressions affected by dependency separation, experiment checks and an independent correctness review.
- [x] 4.2 Record reproducible commands, raw results, sizes, handwritten code and trade-offs without selecting a production API.
- [x] 4.3 Push the experiment as draft PR #45; publish nothing.
