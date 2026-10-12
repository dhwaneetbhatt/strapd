## Why

Developers need to share logs, requests, and configuration without exposing credentials. Issue #33 adds deterministic, local secret redaction through strapd's shared Rust core so CLI pipelines, the WebApp, and Pipes produce consistent results with negligible processing overhead.

## What Changes

- Add configurable redaction for API keys, authorization credentials, cookies, database credentials, cryptographic keys, passwords, tokens, and signed URL credentials.
- Add `strapd sanitize secrets [input]`, with stdin support, readable category flags, explicit `--all`, and documented `redact` aliases. No category flags selects all; supplied categories select only their union.
- Expose the same category selection and redaction through WASM, a visible Security tool, and a composable Pipes transform.
- Preserve surrounding text, use stable descriptive placeholders, and keep raw WebApp input out of shareable URLs.
- Document deterministic pattern coverage and limits, and add correctness, parity, browser, and performance verification.

## Capabilities

### New Capabilities

- `secret-sanitization`: Shared deterministic redaction, category selection, CLI/WebApp/Pipes behavior, and latency requirements.

### Modified Capabilities

None. The new tool uses the existing CLI input and Pipes contracts.

## Impact

Rust core gains a sanitization module, CLI gains declarative arguments and a thin handler, and WASM gains one coarse export. The WebApp gains a wrapper, registered Security tool, category controls, and pipe configuration. Documentation and tests cover all interfaces. No server, network verification, or additional runtime service is introduced. Existing base64/JSON dependencies support structural token and key recognition; additional matching dependencies require measured justification.
