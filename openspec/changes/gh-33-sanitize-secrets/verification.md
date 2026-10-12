# Verification: secret sanitization

This change remains active for user testing. Archive and specification sync
require the user's explicit request. Temporary measurement harnesses and raw
results remain local; a maintained benchmark suite is outside this ticket.

## Requirement audit

| Requirement | Evidence |
| --- | --- |
| Category selection | Eight stable core bits; CLI default/all/subset/conflict tests; actual WASM masks 0, 255, each category, and a selected union. |
| Preservation and determinism | Original-span replacement, stable overlap handling, borrowed identity output. Fixtures cover UTF-8, CRLF, empty input, literal `Error:`, overlap, and idempotence. |
| Semantic labels | JSON/query/assignment boundaries; short and escaped values, acronym labels, JSON newline whitespace, metadata exclusions, and placeholder-like tails. |
| Provider credentials | Declared provider families, complete candidates, current GitHub installation shape, GitLab routable tails, Slack rotation/workflow, Stripe organization/public keys, and growing AWS IDs. |
| Auth and cookies | Raw/JSON/curl headers, full Digest/AWS parameters, quoted cookies, and preserved Set-Cookie attributes including Expires dates. |
| Databases | Encoding, driver suffixes, multiple hosts; distinct libpq/SQL Server grammars; delimiters, braces, escapes, tabs, quoted wrappers, and context-like text inside passwords. |
| Cryptographic material | Complete/truncated private blocks, age/PQ, RSA/EC/OKP/oct JWKs, other primes, duplicate members/types, escaped identifiers, and controls through the JWK lexer. |
| Tokens and signed URLs | Expired/unsigned JWS, JWE, AWS/Azure context, percent-encoded names, legacy AWS parameters, and untouched fragments. |
| Shared local behavior | Thin CLI/WASM adapters invoke Rust core. Actual browser parity fixtures compare all eight categories with the release CLI, preserving trailing whitespace. |
| WebApp and Pipes | Accessible selection, read-only output, copy/reset, 30 ms UI delay, URL exclusion, and frozen save/export/import settings. Actual WASM runs an API-only saved pipe. |
| Performance | Separate native, fresh CLI, and actual WASM measurements validate outputs and counts. Findings and limits are below. |
| Visible limits | Help, README, and sanitizer documentation explain category selection, local operation, finite scalar/container coverage, conservative Google-key handling, and unsupported formats. |

## Checks

- Full Rust workspace tests pass with `make rust-test TZ=UTC`, including 40
  sanitizer core tests and seven CLI tests on macOS.
- Rust formatting/lint, release CLI, generated WASM, WebApp formatting/lint,
  TypeScript, and production Vite build pass.
- All 332 WebApp tests pass across 28 files with four workers; the 33 focused
  sanitizer/adapter tests also pass after the final textarea layout adjustment.
- All six sanitizer browser tests pass against actual WASM and the release CLI:
  category parity, URL privacy, keyboard/copy/reset, themes, Pipes, and desktop/
  375 px geometry. Screenshots were inspected, including privacy-note spacing.
- The final full browser suite passes all ten tests with one worker.
- OpenSpec strict validation and Git whitespace checks pass.

An existing datetime assertion requires UTC. An existing CLI-page test timed out
during concurrent builds; the full suite passed with four workers. The Linux
terminal test is not executed on macOS; an actual macOS pseudo-terminal check
confirmed immediate missing-input guidance. Independent production review used
GPT-6.1-Sol with high reasoning; reported sanitizer findings have regression tests.

Earlier browser runs intermittently failed mobile Pipes assertions: a dialog
extended 0.461 px beyond its viewport in one serial run, and a parallel run also
timed out opening a delete dialog. Both passed separately. The committed baseline
mobile suite passed all four tests with matching font assets confirmed HTTP 200;
the final current suite passed all ten tests serially without source/test edits.
These runs do not establish the cause of the earlier intermittent failures.

## Measurement summary

Reference environment: macOS 27.0.1, Apple Silicon arm64 (exact chip unavailable),
Rust 1.97.1, Python 3.14.7, and Chromium 156 with ten reported logical processors.
Native measurements use 100 warm calls per case; browser measurements use 50;
CLI measurements use 100 alternating paired fresh processes. Complete records
plus padding produce exact 64 KiB, 256 KiB, and 1 MiB inputs. Counts and outputs
are checked, including malformed quotes/JWKs, long whitespace, and near-matches.

| Runtime / workload | Input | Median (ms) | p95 (ms) |
| --- | --- | ---: | ---: |
| Native mixed, all | 64 KiB | 0.487 | 0.663 |
| Native clean, all | 1 MiB | 4.423 | 4.715 |
| Native mixed, all | 1 MiB | 8.194 | 10.108 |
| Native dense, all | 1 MiB | 11.601 | 13.376 |
| WASM mixed, all | 64 KiB | 1.000 | 1.100 |
| WASM mixed, all | 1 MiB | 19.700 | 23.900 |
| WASM mixed, API only | 1 MiB | 8.300 | 9.600 |
| Added CLI mixed, all | 4 KiB | 0.554 | 9.360 |

Native mixed 1 MiB first call was 7.800 ms. First browser sanitizer call before
preflight was 35.900 ms on mixed 1 MiB input; page load/module initialization is
excluded. CLI timing includes startup and I/O, compared with `string trim` on
whitespace-free input and matching output size. Mixed 4 KiB first CLI execution
was 26.092 ms versus 24.332 ms baseline; both had large scheduling outliers.

Initial native clean 1 MiB median was 22.991 ms. Optimization reduced unnecessary
provider comparisons, container scans, URL traversal, and label/token work.
Disabled categories skip their detector passes; clean output stays borrowed.

Typical native 64 KiB meets the under-1-ms target. Native dense 1 MiB and mixed
upper-tail latency exceed 10 ms. All-category mixed 1 MiB WASM exceeds its 16-ms
target and can occupy more than one frame. Added CLI median is below 1 ms, but
paired p95 does not establish the under-5-ms upper-tail target. These are measured
limitations, not claims of uniform latency for every input or machine.
