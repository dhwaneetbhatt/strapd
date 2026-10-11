## 1. Baseline and Characterization

- [x] 1.1 Add a compiled-CLI test harness that can provide text or arbitrary byte stdin and assert exact stdout, stderr, exit status, and completion time.
- [x] 1.2 Add characterization tests for positional versus piped whitespace and empty input across byte encoding, text encoding/decoding, formats, strings, security, JWT, conversion, clipboard, calculator, and datetime handlers.
- [x] 1.3 Build the current release binary and record repeatable baseline latency, throughput, and peak-memory measurements for small, 1 MiB, 16 MiB, and 64 MiB Base64, Hex, and SHA-256 workloads.

## 2. Shared Input Module

- [x] 2.1 Add the focused CLI input module with required text, required bytes, and optional piped-text production functions.
- [x] 2.2 Add injectable reader and terminal-state internals that return borrowed arguments, own stdin data, and produce actionable errors without panicking.
- [x] 2.3 Add unit tests for argument precedence, `Cow::Borrowed` fast paths, interactive missing input, empty EOF, partial reads, read failures, invalid UTF-8 text, and exact arbitrary bytes.
- [x] 2.4 Add a supported-platform PTY test with a strict timeout for non-blocking interactive failure, plus documented manual coverage where the PTY test cannot run.

## 3. Byte-Oriented Core and Encoding Migration

- [x] 3.1 Update Base64 and Hex core encoding entry points to accept byte slices while retaining source compatibility for ordinary callers, and extend core tests for empty and arbitrary bytes.
- [x] 3.2 Migrate Base64 and Hex CLI handlers to shared text/byte acquisition without changing decode trimming or encode byte fidelity.
- [x] 3.3 Add process tests for empty input, trailing line endings, NUL bytes, non-UTF-8 bytes, invalid encoded text, argument precedence, and missing interactive input.

## 4. Text Handler Migration

- [x] 4.1 Migrate URL, JSON, YAML, XML, and SQL handlers while preserving exact positional text and existing piped-text trimming.
- [x] 4.2 Migrate JWT token and payload acquisition while retaining its normalized-empty errors and separate argument/environment secret resolution.
- [x] 4.3 Migrate conversion to optional piped-text acquisition and verify argument-only, stdin-only, combined, empty, and interactive source behavior.
- [x] 4.4 Add or update process tests proving each migrated text family retains its characterized whitespace, empty-input, output, error, and exit-status contracts.

## 5. Security Input Migration

- [x] 5.1 Add byte-oriented hash and HMAC message entry points in `strapd-core`, keep existing text functions as compatibility wrappers, and test both APIs against the same vectors.
- [x] 5.2 Migrate hash and HMAC CLI message input to the shared byte path while preserving textual secret handling.
- [x] 5.3 Add process tests proving compatible normalized digests and authentication codes for empty, newline-terminated, NUL-containing, and non-UTF-8 stdin.

## 6. Remaining Handler Migration and Cleanup

- [x] 6.1 Migrate string, calculator, and clipboard handlers while retaining their characterized positional and piped whitespace behavior.
- [x] 6.2 Replace datetime's panicking numeric stdin path with shared acquisition and fallible parsing, including interactive-missing and invalid-number process tests.
- [x] 6.3 Remove legacy string, byte, piped, and integer input helpers after a repository-wide search confirms that no callers remain.
- [x] 6.4 Review CLI help and user documentation for input guidance accuracy and update only statements affected by non-blocking or binary-input support.

## 7. Performance and Final Verification

- [x] 7.1 Run structural tests proving argument input remains borrowed, stdin is not touched when an argument exists, and byte data reaches slice-oriented core APIs without a full-value conversion.
- [x] 7.2 Repeat the release benchmarks from task 1.3 on the same environment and record the before/after comparison, confirming no material throughput regression and flat or lower large-input peak memory.
- [x] 7.3 Run Rust formatting, linting, the full Rust test suite, and targeted release-binary smoke tests including real terminal, empty pipe, text pipe, and binary pipe cases.
- [x] 7.4 Rebuild WASM after core API changes and verify the generated bindings and existing webapp consumers still build without behavioral changes.
- [x] 7.5 Validate the OpenSpec change strictly and confirm every acceptance scenario is covered by an automated test or an explicitly documented manual check.
