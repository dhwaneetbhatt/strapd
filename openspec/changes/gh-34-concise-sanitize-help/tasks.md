## 1. Help copy

- [x] 1.1 Shorten PII and secrets help, retaining category defaults, input forms, pseudonym scope and docs pointers.
- [x] 1.2 Update CLI help tests to check concise guidance for both commands.

## 2. Verification

- [x] 2.1 Inspect rendered help and run Rust formatting, lint and tests.
- [x] 2.2 Validate the OpenSpec change and record verification results.

## Verification

- `make rust-fmt-check` and `make rust-lint` pass.
- `TZ=UTC RUST_TEST_THREADS=1 make rust-test`: 740 passed, no failures.
- Inspected PII short/long help and secrets long help, including both secrets aliases.
- Both long descriptions contain fewer than 30 words; tests check usage, docs pointers and flags.
- Strict OpenSpec validation and whitespace checks pass.
- Core and WASM behavior are unchanged; no WASM rebuild or benchmark rerun is needed.
- Optional design artifact omitted because this is a CLI copy-only change.
