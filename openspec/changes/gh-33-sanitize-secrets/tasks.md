## 1. Planning baseline

- [ ] 1.1 Validate and commit proposal, design, specification, and tasks before implementation.

## 2. Shared sanitizer

- [ ] 2.1 Implement category selection, original-span redaction, stable placeholders, identity behavior, and deterministic overlap handling.
- [ ] 2.2 Implement semantic labeled values, authorization/cookie grammars, and recognizable provider credentials.
- [ ] 2.3 Implement database URLs/connection strings, cryptographic containers/JWKs, compact tokens, and signed URL parameters.
- [ ] 2.4 Add core fixtures covering all categories, subsets, ordinary text, escapes, malformed input, Unicode, overlap, and idempotence.

## 3. CLI and WASM

- [ ] 3.1 Add readable sanitizer flags, aliases, exact argument/stdin handler, and coverage help.
- [ ] 3.2 Add CLI contract tests for category selection, aliases, precedence, missing input, errors, and content preservation.
- [ ] 3.3 Add coarse WASM export and typed wrapper; rebuild and verify actual native/WASM fixture parity.

## 4. WebApp and Pipes

- [ ] 4.1 Register the Security tool with shared category metadata, default all selection, sensitive input exclusion, and a versioned Pipes transform.
- [ ] 4.2 Build accessible input/output and category controls using incumbent visual patterns and a short processing delay.
- [ ] 4.3 Add wrapper, component, URL privacy, discovery, and Pipes selection/persistence/export tests.
- [ ] 4.4 Verify real WASM operation and pipe composition in desktop/mobile browsers, keyboard operation, and both themes.

## 5. Performance and documentation

- [ ] 5.1 Add reproducible release core, cold CLI, and actual WASM benchmarks for clean, mixed/dense, and adversarial input.
- [ ] 5.2 Measure first-call/median/p95 latency and input growth; optimize observed bottlenecks and document target results or measured limitations.
- [ ] 5.3 Document examples, aliases, categories, pattern coverage/limits, local operation, and update project context for the feature.

## 6. Verification and completion

- [ ] 6.1 Run formatting, Rust lint/tests, WASM build, WebApp lint/tests/build, and relevant browser checks; resolve failures.
- [ ] 6.2 Audit every specification requirement against code/tests/runtime evidence and record verification.
- [ ] 6.3 Sync/archive the completed change and commit verified implementation, documentation, and final OpenSpec state.
