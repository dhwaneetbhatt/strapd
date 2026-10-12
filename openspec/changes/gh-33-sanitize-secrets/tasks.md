## 1. Planning baseline

- [x] 1.1 Validate and commit proposal, design, specification, and tasks before implementation.

## 2. Shared sanitizer

- [x] 2.1 Implement category selection, original-span redaction, stable placeholders, identity behavior, and deterministic overlap handling.
- [x] 2.2 Implement semantic labeled values, authorization/cookie grammars, and recognizable provider credentials.
- [x] 2.3 Implement database URLs/connection strings, cryptographic containers/JWKs, compact tokens, and signed URL parameters.
- [x] 2.4 Add core fixtures covering all categories, subsets, ordinary text, escapes, malformed input, Unicode, overlap, and idempotence.

## 3. CLI and WASM

- [x] 3.1 Add readable sanitizer flags, aliases, exact argument/stdin handler, and coverage help.
- [x] 3.2 Add CLI contract tests for category selection, aliases, precedence, missing input, errors, and content preservation.
- [x] 3.3 Add coarse WASM export and typed wrapper; rebuild and verify actual native/WASM fixture parity.

## 4. WebApp and Pipes

- [x] 4.1 Register the Security tool with shared category metadata, default all selection, sensitive input exclusion, and a versioned Pipes transform.
- [x] 4.2 Build accessible input/output and category controls using incumbent visual patterns and a short processing delay.
- [x] 4.3 Add wrapper, component, URL privacy, discovery, and Pipes selection/persistence/export tests.
- [x] 4.4 Verify real WASM operation and pipe composition in desktop/mobile browsers, keyboard operation, and both themes.

## 5. Performance and documentation

- [x] 5.1 Use temporary local harnesses to measure release core, cold CLI, and actual WASM on clean, mixed/dense, and adversarial input; keep harnesses and raw data out of the repository.
- [x] 5.2 Measure first-call/median/p95 latency and input growth; optimize observed bottlenecks and document target results or measured limitations.
- [x] 5.3 Document examples, aliases, categories, pattern coverage/limits, local operation, and update project context for the feature.

## 6. Verification and completion

- [x] 6.1 Run formatting, Rust lint/tests, WASM build, WebApp lint/tests/build, and relevant browser checks; resolve failures.
- [x] 6.2 Audit every specification requirement against code/tests/runtime evidence and record verification.
- [x] 6.3 Commit verified implementation, documentation, and current OpenSpec state; keep the change active for user testing. Archive only after the user's explicit request.

## 7. Local configuration follow-up

- [x] 7.1 Audit the user-provided configuration locally, report keys/counts without exposing values, and record semantic-label refinements before code changes.
- [x] 7.2 Cover access-key, application-secret, webhook-secret, and scoped-secret labels with generic public labels and synthetic values; preserve category isolation and public metadata.
- [x] 7.3 Rebuild CLI/WASM, rerun the real configuration and regression checks, and record results without committing its contents or temporary audit scripts.
- [x] 7.4 Update the local wasm-pack installation to 0.15.0 to match the existing pipeline and verify the rebuilt module.
