## Why

Issue #43 identifies gaps in request-time PII detection: matches are private, numeric JSON values and grouped cards escape detection, and checksum-only cards flag unrelated identifiers. Fix these without losing the allocation-free clean-input path or latency advantage.

## What Changes

- Expose resolved category and UTF-8 byte ranges through a public Rust detection API and packed browser WASM detections.
- Require plausible card issuer prefixes and brand lengths for unlabelled cards; preserve labelled fallback.
- Recognize numeric compact JSON, Amex 4-6-5 and Diners 4-6-4 groups.
- Defer optional Unicode email support to keep the latency-sensitive scanner fix focused.
- Add regression, parity, allocation, false-positive and latency evidence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pii-sanitization`: Public resolved detection spans, browser WASM detection, tighter card recognition, compact JSON and grouped-card coverage.

## Impact

Shared PII scanner and classification, Rust/CLI/WASM tests, browser WASM adapter, existing test suites, pre-commit hook target, usage and performance documentation. Existing CLI, WebApp and Pipes inherit core fixes. No new dependencies or network processing. Unlabelled checksum-valid numbers outside supported issuer ranges intentionally stop matching as cards.
