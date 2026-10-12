## 1. Planning baseline

- [x] 1.1 Validate and commit the proposal, design, specification, tasks, and Node.js tool-version update before production implementation.

## 2. Shared sanitizer foundation

- [ ] 2.1 Refactor private span resolution and rendering to support static and generated replacements without changing secret-sanitization output or public APIs.
- [ ] 2.2 Add separate PII category and replacement-mode types with all, none, category inclusion, stable mask placeholders, and stable-marker recognition.
- [ ] 2.3 Implement deterministic overlap resolution, category-scoped canonical identity mapping, first-occurrence pseudonym numbering, idempotence, and borrowed clean-input behavior.
- [ ] 2.4 Add focused regression tests proving the shared rendering refactor leaves all existing secret sanitizer behavior unchanged.

## 3. Global PII detectors

- [ ] 3.1 Implement bounded IPv4 and IPv6 recognition with semantic boundaries, parsed canonical identity, and preservation of brackets, ports, and CIDR prefixes.
- [ ] 3.2 Implement common ASCII email recognition with safe local/domain boundaries and domain-folded canonical identity.
- [ ] 3.3 Implement E.164, strongly formatted, labelled local, and extension-aware phone recognition without country inference.
- [ ] 3.4 Implement payment-card recognition with normalized grouping, Luhn validation, semantic label fallback, and deterministic precedence over phone candidates.
- [ ] 3.5 Add global-detector fixtures covering canonical equivalence, boundaries, punctuation, Unicode surroundings, false positives, category isolation, overlaps, repeated values, and malformed near-matches.

## 4. Indian identifier detectors

- [ ] 4.1 Implement Aadhaar compact and consistent 4-4-4 recognition, Verhoeff validation, semantic UID/Aadhaar label fallback, masked-display preservation, and digit canonicalization.
- [ ] 4.2 Implement case-insensitive PAN recognition with documented holder types, nonzero numeric series, semantic label fallback, token boundaries, and uppercase canonicalization.
- [ ] 4.3 Add Aadhaar and PAN fixtures covering valid and invalid checks, formatting equivalence, labels, metadata and substring exclusions, pseudonym stability, category isolation, and overlap with phones or other identifiers.

## 5. CLI and WASM

- [ ] 5.1 Add `strapd sanitize pii` with exact positional/stdin input, default-all and union category selection, `--all` conflicts, default mask mode, and `--pseudonymize` / `-p`.
- [ ] 5.2 Add CLI contract tests for every category, both modes, unions, conflicts, stdin, positional precedence, whitespace, empty and missing input, safe errors, markers, and native output parity.
- [ ] 5.3 Add the coarse WASM export and typed WebApp wrapper, rebuild generated WASM, and run shared fixtures against native Rust and the actual WASM module.

## 6. WebApp and Pipes

- [ ] 6.1 Add shared PII category and mode metadata and register a sensitive-input Security tool with a versioned Pipes transform.
- [ ] 6.2 Build the responsive accessible tool UI with mask/pseudonymize choice, all and individual category controls, input, read-only output, copy, clear, and coverage guidance.
- [ ] 6.3 Add wrapper, operation, component, discovery, URL privacy, and Pipes configuration/save/reload/export/import tests, including Aadhaar/PAN-only pseudonymization.
- [ ] 6.4 Verify actual WASM behavior, keyboard operation, desktop and 375 px layouts, both themes, and sanitizer-to-downstream Pipes composition in a browser.

## 7. Performance and optimization

- [ ] 7.1 Build disposable release measurement harnesses outside the repository, preferably in a temporary directory, and generate deterministic 4 KiB, 64 KiB, 256 KiB, and 1 MiB clean, mixed, dense, and adversarial fixtures with validated results outside timed regions.
- [ ] 7.2 Measure mask and pseudonym modes, all and representative single categories, native first-call/median/p95/throughput, alternating paired fresh CLI total and added cost, and actual WASM first-call/median/p95/throughput.
- [ ] 7.3 Profile and optimize observed scanner, allocation, candidate-expansion, canonicalization, CLI, or WASM bottlenecks; rerun measurements and demonstrate bounded approximately linear adversarial growth.
- [ ] 7.4 Create `openspec/changes/gh-34-sanitize-pii/verification.md` with the reference environment, reproducible methodology, iteration counts, validated measurements, target comparisons, and explicit limitations; remove temporary performance scripts and raw data and confirm none are tracked or committed.

## 8. Documentation and completion

- [ ] 8.1 Document CLI and WebApp examples, flags, modes, placeholders, invocation-local pseudonym semantics, category coverage, Aadhaar/PAN rules, offline guarantees, validation limits, false-positive trade-offs, and summarized performance results.
- [ ] 8.2 Update README, CLI smoke coverage, and project context for the PII sanitizer while keeping generated artifacts and user-facing descriptions consistent.
- [ ] 8.3 Run formatting, Rust lint/tests, release CLI and smoke tests, WASM build/parity checks, WebApp lint/tests/build, and relevant browser tests; resolve every failure.
- [ ] 8.4 Request an independent correctness, privacy, overlap, and performance review of the completed core and interface behavior; resolve findings and add regression coverage.
- [ ] 8.5 Audit every specification requirement against code, tests, runtime behavior, documentation, and measurements; finalize the verification report and validate OpenSpec strictly.
- [ ] 8.6 Commit the verified implementation and current OpenSpec state, keep the change active for user testing, and archive only after explicit user approval.
