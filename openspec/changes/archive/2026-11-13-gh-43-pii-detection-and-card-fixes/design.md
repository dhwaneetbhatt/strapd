## Context

The scanner already computes disjoint spans, while masking avoids canonical allocations. Numeric parsing is bounded to 19 stored digits and one forward scan. See proposal.md for motivation.

## Goals / Non-Goals

Preserve one scan, resolved-span parity, category bit values, borrowed clean sanitizer output and empty allocation-free detection. No NER, confidence scores, new UI, external verification or new dependencies.

## Decisions

- Share scan-and-resolution between detection and sanitization; expose owned public matches without canonical identities. Detection disables pseudonym canonicalization.
- Gate unlabelled Luhn cards with a constant-size issuer/length check from issue #43. Labelled plausible 13–19 digit cards bypass checksum and issuer requirements.
- Treat a leading single colon as its own token in the existing colon handler; preserve IPv6 (`::`) and internal colons without adding a clean-input branch. Add `card` as an exact semantic key, never a substring.
- Allow a six-digit middle group only after four digits so Amex/Diners parse without merging arbitrary adjacent long numbers. Extend grouped card shape to 4-6-4.
- Keep existing ASCII email recognition. Optional Unicode alphanumeric support was prototyped but is deferred to keep this latency-sensitive patch focused. An independent scanner experiment isolated and fixed clean-input overhead from a misplaced JSON colon check. UTF-8 surrounding text and byte offsets remain supported.
- Keep packed browser detection exports alongside the public Rust API.
- Reuse the archived GH-34 fixture construction and timings with disposable harnesses; retain the methodology and results, not permanent benchmark scripts. Keep relevant detection regressions in the existing PII browser suite and false-positive tests in Rust. Fix the pre-commit hook to call the existing rust-lint target.

## Risks / Trade-offs

- Narrower issuer coverage intentionally preserves unsupported standalone numbers → document exact coverage; labelled values still protected.
- Numeric colon changes could break IPv6 → test compressed addresses, ports, malformed tokens and compact JSON.
- Unicode support expands token-boundary semantics → defer it from this focused fix and keep the established ASCII contract.
- Timing varies on a shared machine → report distributions and environment; never infer Presidio speedups from these measurements.

## Migration Plan

Run focused regressions, full required checks, real WASM/CLI parity, allocation and performance checks, and an independent correctness review. Resolve findings and retain the tested changes and evidence for review in PR #44. Sync the completed requirements and archive the change. Version bumps, tags and release publication remain subject to user review. Rollback by using the preceding release tag.
