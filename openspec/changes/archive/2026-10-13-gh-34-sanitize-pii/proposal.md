## Why

Developers and AI agents need a fast, local way to remove personally identifiable information from logs, requests, and other developer text before that content leaves its original context. Issue #34 extends the sanitizer pattern shipped in #33 to common global identifiers and Indian identifiers while retaining enough pseudonymous structure for an agent to reason about repeated entities.

## What Changes

- Add shared Rust detection for IPv4 and IPv6 addresses, email addresses, phone numbers, payment card numbers, Aadhaar numbers, and PAN numbers.
- Add default masking with stable category placeholders and opt-in deterministic, invocation-local pseudonymization that maps equivalent repeated values consistently.
- Add `strapd sanitize pii [input]` with positional and stdin input, category selection, and `--pseudonymize` / `-p`.
- Expose the same modes and categories through WASM, a visible Security tool, and a composable Pipes transform without persisting raw input.
- Document deterministic coverage, checksum and formatting rules, false-positive trade-offs, and offline-only behavior.
- Measure native core, fresh CLI, and actual WASM performance across clean, mixed, dense, and adversarial inputs, targeting sub-millisecond latency for typical core workloads.

## Capabilities

### New Capabilities

- `pii-sanitization`: Shared local PII detection, masking, pseudonymization, category controls, CLI/WebApp/Pipes behavior, Indian identifier coverage, and measured latency requirements.

### Modified Capabilities

None. The new operation uses the existing CLI input and Pipes contracts without changing their requirements.

## Impact

The Rust core gains a PII sanitizer and reusable span-rendering support, the CLI gains a sibling `sanitize pii` operation, and WASM gains a coarse binding. The WebApp gains shared category metadata, a Security tool, mode controls, and a versioned Pipes transform. Documentation and tests cover all interfaces. No server, identifier verification service, or network access is introduced; additional runtime dependencies require benchmark-backed justification.
