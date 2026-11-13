## Context

The scanner already computes disjoint spans, while masking avoids canonical allocations. Numeric parsing is bounded to 19 stored digits and one forward scan. The browser WASM adapter depends on wasm-bindgen; non-JavaScript hosts need a generic public memory ABI, which is deferred from this PII fix. See proposal.md for motivation.

## Goals / Non-Goals

Preserve one scan, resolved-span parity, category bit values, borrowed clean sanitizer output and empty allocation-free detection. No NER, confidence scores, new UI, external verification or new dependencies.

## Decisions

- Share scan-and-resolution between detection and sanitization; expose owned public matches without canonical identities. Detection disables pseudonym canonicalization.
- Gate unlabelled Luhn cards with a constant-size issuer/length check from issue #43. Labelled plausible 13–19 digit cards bypass checksum and issuer requirements.
- Treat a leading single colon as its own token in the existing colon handler; preserve IPv6 (`::`) and internal colons without adding a clean-input branch. Add `card` as an exact semantic key, never a substring.
- Allow a six-digit middle group only after four digits so Amex/Diners parse without merging arbitrary adjacent long numbers. Extend grouped card shape to 4-6-4.
- Keep existing ASCII email recognition. Optional Unicode alphanumeric support was prototyped but is deferred to keep this latency-sensitive patch focused. An independent scanner experiment isolated and fixed clean-input overhead from a misplaced JSON colon check. UTF-8 surrounding text and byte offsets remain supported.
- Keep packed browser detection exports alongside the public Rust API. Remove the PII-only adapter: a generic portable strapd package must expose all core operations through one consistent host interface, rather than client-specific artifacts.
- Reuse the archived GH-34 fixture construction and timings with disposable harnesses; retain the methodology and results, not permanent benchmark scripts. Keep relevant detection regressions in the existing PII browser suite and false-positive tests in Rust. Fix the pre-commit hook to call the existing rust-lint target.

## Risks / Trade-offs

- Narrower issuer coverage intentionally preserves unsupported standalone numbers → document exact coverage; labelled values still protected.
- Numeric colon changes could break IPv6 → test compressed addresses, ports, malformed tokens and compact JSON.
- Unicode support expands token-boundary semantics → defer it from this focused fix and keep the established ASCII contract.
- Portable WASM needs a stable shared memory ABI and host services → design and validate that package separately; the browser module still requires JavaScript glue.
- Timing varies on a shared machine → report distributions and environment; never infer Presidio speedups from these measurements.

## Migration Plan

Run focused regressions, full required checks, real WASM/CLI parity, allocation and performance checks, and an independent correctness review. Resolve findings and stop with tested changes and evidence for user review. Per the user’s later instruction, do not bump versions, archive, commit, tag, push or publish until review approval. Rollback by using the preceding release tag.
