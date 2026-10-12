## Context

See proposal.md for motivation and specs/pii-sanitization/spec.md for observable behavior. The shipped secret sanitizer already supplies exact CLI input handling, a thin WASM adapter, sensitive WebApp input exclusion, category-driven controls, and Pipes persistence patterns. Its Rust matcher collects original byte ranges and renders once, but its eight-bit secret category set is full and its replacement text is static. PII adds dynamic pseudonyms, format-equivalence rules, checksum validation, and a stricter hot-path latency goal without changing the secret-sanitization API.

## Goals / Non-Goals

**Goals:** A single bounded scan for enabled PII classes; exact original-span preservation; invocation-local relationship-preserving pseudonyms; explicit validation and label-fallback rules; identical native/WASM behavior; measured sub-millisecond typical core latency.

**Non-Goals:** Server-backed identity verification, exhaustive RFC mailbox parsing, phone-number ownership or country inference, globally stable pseudonyms, format-preserving synthetic identities, image/card OCR, names or postal addresses, biometric data, Indian identifiers beyond Aadhaar and PAN, and a maintained general-purpose PII-detection framework.

## Decisions

### Keep PII categories and public APIs separate from secret categories

Define a six-bit PII category model and a mask-or-pseudonymize mode alongside, not inside, the existing eight-bit secret category type. `sanitize::pii` owns its detectors while a small private span-resolution/rendering primitive can be shared after regression coverage establishes that secret output is unchanged. CLI, WASM, and TypeScript receive separate PII category masks.

Alternative: widen and combine every category in one public mask. That couples unrelated commands, changes the shipped binding contract, and makes defaults and UI configuration harder to explain.

### Scan once and dispatch only plausible candidates

Traverse the original UTF-8 bytes monotonically. Cheap ASCII boundary and byte-class checks dispatch plausible starts to bounded detectors: digit-led candidates cover IPv4, phones, cards, and Aadhaar; alphabetic runs cover PAN and email local parts; colon/bracket contexts cover IPv6. Enabled-category checks occur before detector work. Successful detectors return original byte ranges, category, precedence, and lazily derived canonical identity. Clean input returns borrowed data and allocates no output string.

Avoid a catalogue of independently compiled regular expressions or one full input pass per category. Small standard-library parsers, fixed tables, and direct Luhn and Verhoeff implementations keep initialization, code size, and WASM behavior predictable. Add a dependency only after equivalent fixtures show a material correctness benefit and release measurements show the latency and size cost.

### Resolve spans before assigning pseudonyms

Sort candidate spans by start, enclosing length, and explicit specificity, then resolve intersections once. Enclosing syntactic values and checksum-validated Aadhaar or payment-card candidates take precedence over phone-like subsets. Assign pseudonym ordinals only to surviving matches in source order, using a category-scoped map from canonical identity to one-based ordinal. Hash-map iteration never determines output order. Mask mode uses static category placeholders; pseudonym mode renders generated tokens. Both modes recognize their own complete markers as stable values and never rescan replacement text.

Alternative: assign ordinals during detection. Rejected overlaps would consume numbers and detector order could change externally visible output.

### Canonicalize only unambiguous equivalence

IP identity uses parsed address bytes, so equivalent IPv6 spellings match. Email preserves the local part and folds the ASCII domain. Phone identity removes presentation punctuation while retaining an explicit leading international prefix and extension; it never infers a country. Payment-card and Aadhaar identity uses normalized digits, and PAN uses uppercase ASCII. Canonical values live only for the invocation and are dropped with the result.

Alternative: hash normalized values into stable tokens. Unkeyed hashes expose cross-document linkability and dictionary attacks, while keyed hashes require key lifecycle and configuration outside issue #34.

### Combine strict standalone recognition with semantic label fallback

Standalone phone candidates require an explicit international prefix or strong formatting; plain local digits require phone-like labels. Standalone cards require plausible grouping and Luhn. Standalone Aadhaar requires exact compact or 4-4-4 formatting and Verhoeff. Standalone PAN restricts the documented holder type and nonzero numeric series. Semantic labels allow plausible but checksum-invalid or mistyped values to be protected where context is stronger than validation. Label matching uses ASCII semantic segments and metadata exclusions rather than innocent substring matching.

All IP addresses, including private, loopback, and unspecified forms, are recognized because network topology can itself be sensitive and category controls provide the explicit opt-out. Parsers preserve adjacent brackets, ports, and CIDR prefix lengths.

### Reuse the shipped interface pattern with mode as configuration

Add `Pii` beside `Secrets` under the existing CLI `sanitize` subcommand. Declarative booleans resolve omission to all and reject `--all` conflicts; the shared exact-text helper preserves positional/stdin precedence. WASM accepts input, category bits, and a compact mode value through one synchronous export.

The WebApp registers a separate Security tool with shared category metadata, a mask/pseudonymize control, sensitive text exclusion, read-only output, and the established responsive layout. Its Pipes contract freezes the mode plus six booleans. Tool operation treats output beginning with `Error:` as ordinary content and introduces no processing delay; UI scheduling remains independently testable.

### Treat performance evidence as a completion artifact

Use optimized release builds and temporary local harnesses with deterministic exact-size inputs. Measure native core calls, alternating paired fresh CLI subprocesses against a comparable text command, and the real generated WASM module in a browser. Cover 4 KiB, 64 KiB, 256 KiB, and 1 MiB clean, mixed, dense, and adversarial fixtures; validate match counts and full or hashed output outside timed regions. Report first-call, median, p95, throughput, iteration count, toolchain, hardware/OS, and whether targets passed.

Measure masking and pseudonymization, all categories and representative single categories. Create disposable harnesses and raw timing data outside the repository, preferably under a temporary directory, and remove them after the summarized results are recorded; temporary performance scripts SHALL NOT be committed. Commit only the reproducible methodology, validated measurements, target comparison, and limitations in `openspec/changes/gh-34-sanitize-pii/verification.md`. Optimize observed passes, allocation, candidate expansion, or canonicalization costs before accepting a documented limitation. Do not conflate the core target, added CLI cost, and total process startup.

## Risks / Trade-offs

- [Phone recognition either misses plain numbers or masks unrelated IDs] → Require strong syntax for standalone matches and use semantic labels for ambiguous local forms.
- [Valid IP-looking versions or topology constants are masked] → Document syntactic matching and make IP selection independently configurable.
- [Checksums reject mistyped sensitive identifiers] → Allow bounded plausible values in explicit Aadhaar and payment-card fields while keeping standalone matching strict.
- [PAN-shaped random tokens produce false positives] → Enforce token boundaries, documented holder types, and a nonzero numeric sequence; document that no online issuance check occurs.
- [Pseudonyms imply identity outside one input] → Use ordinal markers, avoid hashes and persistence, and state invocation-local scope in help and UI copy.
- [Detector overlap changes ordinal numbering] → Resolve all spans before numbering and regression-test every overlapping category pair.
- [Adversarial delimiter or numeric runs cause nonlinear scans] → Maintain monotonic scanner progress, cap candidate work, and benchmark growing near-match fixtures.
- [Shared renderer refactoring regresses secret sanitization] → Preserve existing public types and golden fixtures; isolate dynamic replacement support behind private interfaces.
- [Sub-millisecond claims vary by machine] → Tie targets and results to a fully reported reference environment and publish first-call, distribution, and throughput rather than a single best sample.

## Migration Plan

Add the capability without changing existing commands or pipe contracts. Introduce and test shared private rendering support before connecting PII detectors, then add CLI/WASM and rebuild generated WASM before WebApp and Pipes verification. Existing saved Pipes remain compatible because the PII tool has a new tool identifier and versioned defaults. Rollback removes the additive tool and export while leaving secret sanitization intact. Keep the OpenSpec change active for user testing and archive only after explicit approval.
