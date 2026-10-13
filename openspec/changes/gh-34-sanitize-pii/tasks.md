## 1. Planning baseline

- [x] 1.1 Validate and commit the proposal, design, specification, tasks, and Node.js tool-version update before production implementation.

## 2. Shared sanitizer foundation

- [x] 2.1 Refactor private span resolution and rendering to support static and generated replacements without changing secret-sanitization output or public APIs.
- [x] 2.2 Add separate PII category and replacement-mode types with all, none, category inclusion, stable mask placeholders, and stable-marker recognition.
- [x] 2.3 Implement deterministic overlap resolution, category-scoped canonical identity mapping, first-occurrence pseudonym numbering, idempotence, and borrowed clean-input behavior.
- [x] 2.4 Add focused regression tests proving the shared rendering refactor leaves all existing secret sanitizer behavior unchanged.

## 3. Global PII detectors

- [x] 3.1 Implement bounded IPv4 and IPv6 recognition with semantic boundaries, parsed canonical identity, and preservation of brackets, ports, and CIDR prefixes.
- [x] 3.2 Implement common ASCII email recognition with safe local/domain boundaries and domain-folded canonical identity.
- [x] 3.3 Implement E.164, strongly formatted, labelled local, and extension-aware phone recognition without country inference.
- [x] 3.4 Implement payment-card recognition with normalized grouping, Luhn validation, semantic label fallback, and deterministic precedence over phone candidates.
- [x] 3.5 Add global-detector fixtures covering canonical equivalence, boundaries, punctuation, Unicode surroundings, false positives, category isolation, overlaps, repeated values, and malformed near-matches.

## 4. Indian identifier detectors

- [x] 4.1 Implement Aadhaar compact and consistent 4-4-4 recognition, Verhoeff validation, semantic UID/Aadhaar label fallback, masked-display preservation, and digit canonicalization.
- [x] 4.2 Implement case-insensitive PAN recognition with documented holder types, nonzero numeric series, semantic label fallback, token boundaries, and uppercase canonicalization.
- [x] 4.3 Add Aadhaar and PAN fixtures covering valid and invalid checks, formatting equivalence, labels, metadata and substring exclusions, pseudonym stability, category isolation, and overlap with phones or other identifiers.

## 5. CLI and WASM

- [x] 5.1 Add `strapd sanitize pii` with exact positional/stdin input, default-all and union category selection, `--all` conflicts, default mask mode, and `--pseudonymize` / `-p`.
- [x] 5.2 Add CLI contract tests for every category, both modes, unions, conflicts, stdin, positional precedence, whitespace, empty and missing input, safe errors, markers, and native output parity.
- [x] 5.3 Add the coarse WASM export and typed WebApp wrapper, rebuild generated WASM, and run shared fixtures against native Rust and the actual WASM module.

## 6. WebApp and Pipes

- [x] 6.1 Add shared PII category and mode metadata and register a sensitive-input Security tool with a versioned Pipes transform.
- [x] 6.2 Build the responsive accessible tool UI with mask/pseudonymize choice, all and individual category controls, input, read-only output, copy, clear, and coverage guidance.
- [x] 6.3 Add wrapper, operation, component, discovery, URL privacy, and Pipes configuration/save/reload/export/import tests, including Aadhaar/PAN-only pseudonymization.
- [x] 6.4 Verify actual WASM behavior, keyboard operation, desktop and 375 px layouts, both themes, and sanitizer-to-downstream Pipes composition in a browser.

## 7. Performance and optimization

- [x] 7.1 Build disposable release measurement harnesses outside the repository, preferably in a temporary directory, and generate deterministic 4 KiB, 64 KiB, 256 KiB, and 1 MiB clean, mixed, dense, and adversarial fixtures with validated results outside timed regions.
- [x] 7.2 Measure mask and pseudonym modes, all and representative single categories, native first-call/median/p95/throughput, alternating paired fresh CLI total and added cost, and actual WASM first-call/median/p95/throughput.
- [x] 7.3 Profile and optimize observed scanner, allocation, candidate-expansion, canonicalization, CLI, or WASM bottlenecks; rerun measurements and demonstrate bounded approximately linear adversarial growth.
- [x] 7.4 Create `openspec/changes/gh-34-sanitize-pii/verification.md` with the reference environment, reproducible methodology, iteration counts, validated measurements, target comparisons, and explicit limitations; remove temporary performance scripts and raw data and confirm none are tracked or committed.

## 8. Documentation and completion

- [x] 8.1 Document CLI and WebApp examples, flags, modes, placeholders, invocation-local pseudonym semantics, category coverage, Aadhaar/PAN rules, offline guarantees, validation limits, false-positive trade-offs, and summarized performance results.
- [x] 8.2 Update README, CLI smoke coverage, and project context for the PII sanitizer while keeping generated artifacts and user-facing descriptions consistent.
- [x] 8.3 Run formatting, Rust lint/tests, release CLI and smoke tests, WASM build/parity checks, WebApp lint/tests/build, and relevant browser tests; resolve every failure.
- [x] 8.4 Request an independent correctness, privacy, overlap, and performance review of the completed core and interface behavior; resolve findings and add regression coverage.
- [x] 8.5 Audit every specification requirement against code, tests, runtime behavior, documentation, and measurements; finalize the verification report and validate OpenSpec strictly.
- [x] 8.6 Commit the verified implementation and current OpenSpec state, keep the change active for user testing, and archive only after explicit user approval.

## 9. User-testing follow-up: email apostrophe boundaries

- [x] 9.1 Refine the scanner's straight-apostrophe boundary after `@` without splitting supported local-part apostrophes, changing canonical identity, or skipping adjacent email candidates.
- [x] 9.2 Add core and CLI regressions for straight/curly possessives, quote boundaries, repeated pseudonyms, local-part apostrophes, malformed addresses, category isolation and idempotence; verify actual browser WASM parity.
- [x] 9.3 Compare release native performance with the pre-fix implementation, measure actual warm WASM on representative and apostrophe-heavy fixtures, record results in verification, and remove temporary harnesses/data.
- [x] 9.4 Run relevant tests, formatting, lint, release CLI/WASM builds, strict OpenSpec validation and an independent correctness review; commit the verified follow-up and stop without archiving or pushing.
