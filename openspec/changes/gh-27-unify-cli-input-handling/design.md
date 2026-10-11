## Context

See `proposal.md` for motivation and `specs/cli-input-handling/spec.md` for the observable contract. Today `get_input_string` clones arguments, trims and recopies stdin, and panics on read failure; `get_input_bytes` always owns its result; `read_stdin_if_piped` avoids terminal blocking but represents a terminal as an empty string; JWT adds its own `Cow`-based required-input policy; and numeric stdin parsing can block or panic. Conversion is intentionally different because it composes arguments with optional stdin.

The CLI receives owned `String` values from clap, so handlers can borrow argument data for the duration of an operation. Piped input must be owned. Text commands currently trim surrounding piped whitespace while preserving positional whitespace, whereas Base64 and Hex encode consume stdin as exact bytes. That compatibility boundary is intentional for this change.

## Goals / Non-Goals

**Goals:**

- Establish one small input-acquisition module with explicit text, byte, optional-pipe, and test seams.
- Separate acquisition from command-specific normalization and validation.
- Make argument paths borrow existing clap storage and avoid a second allocation when trimming owned stdin.
- Make every migrated required-input path non-blocking on terminals and fallible on reads and parsing.
- Verify compatibility and byte fidelity before removing legacy helpers.
- Measure release-mode latency, throughput, and peak memory for representative input sizes.

**Non-Goals:**

- Changing current whitespace semantics or making exact piped text the default.
- Changing the CLI's unconditional trailing newline on successful output; binary-output framing should be handled separately.
- Reading JWT secrets from generic stdin or changing environment-backed secret behavior.
- Introducing a general input trait or a single abstraction that also owns conversion source composition.
- Streaming operations end to end; core operations currently consume complete inputs.

## Decisions

### 1. Add focused raw-acquisition functions with injectable internals

Create a CLI input module whose production-facing functions follow this shape:

```rust
required_text(argument: Option<&str>, name: &str) -> Result<Cow<'_, str>, String>
required_bytes(argument: Option<&str>, name: &str) -> Result<Cow<'_, [u8]>, String>
piped_text() -> Result<Option<String>, String>
```

An argument returns `Cow::Borrowed` immediately and stdin is never inspected. Without an argument, required functions check whether stdin is a terminal, return actionable missing-input guidance for a terminal, and otherwise read stdin once into an owned buffer. `piped_text` returns `None` for a terminal and `Some`, including `Some("")`, for non-interactive stdin so conversion can distinguish source state from content.

Private or crate-visible reader functions accept a generic `Read` value and an explicit terminal state. This provides deterministic unit coverage for terminal detection, partial reads, empty EOF, invalid UTF-8, and injected read errors without requiring a general production abstraction.

Alternative considered: keep direct `io::stdin()` access in every helper. Rejected because read failures and terminal behavior cannot be exercised reliably in unit tests.

Alternative considered: create an `InputSource` trait used throughout handlers. Rejected because the behavior requires only a few focused functions and a test seam; a public trait would add indirection without a second production implementation.

### 2. Keep acquisition raw and apply existing normalization in handlers

The shared module does not trim. A migrated text handler keeps the returned `Cow` alive and passes `input.trim()` to the operation when its existing stdin path trims. Positional values bypass stdin normalization and remain exact. Because `str::trim` returns a view, handlers can normalize owned stdin without `trim().to_string()` and its second payload-sized allocation.

The compatibility matrix is:

| Source and command family | Policy |
|---|---|
| Positional text | Exact borrowed text |
| Piped text for existing text-oriented commands | Existing surrounding-whitespace trim |
| Positional input for a byte-oriented operation | Borrowed UTF-8 bytes of the argument |
| Piped input for Base64 or Hex encoding | Exact owned bytes |
| Piped hash or HMAC message bytes | Existing surrounding ASCII-whitespace trim, without requiring UTF-8 |
| Conversion optional stdin | Raw acquisition, then existing trim and composition policy |
| JWT token or payload | Raw acquisition, then existing trim and empty validation |

This preserves convenient shell behavior such as hashing the same logical value from `echo "hello"` and from the argument `"hello"`, while byte-oriented commands continue to treat line endings and non-UTF-8 data as real input.

Alternative considered: preserve all piped text exactly. Rejected because it changes hashes and other results for ordinary `echo` pipelines and would be an unnecessary breaking change during a refactor.

Alternative considered: trim inside `required_text`. Rejected because it hides policy in acquisition, makes argument-versus-stdin behavior less explicit, and prevents commands from opting into exact text later.

### 3. Treat source presence and content validity separately

An explicitly supplied empty argument and empty non-interactive stdin are acquired successfully. Each operation then applies its existing content rules: empty Base64, Hex, and hash messages remain valid; structured formatters report their normal parse error; JWT rejects normalized empty input; and conversion reports no usable expression.

Interactive stdin with no argument is the only generic missing-source condition. This avoids conflating `/dev/null` or an intentionally empty pipe with a terminal invocation that would otherwise block.

Alternative considered: make every `required_*` helper reject empty content. Rejected because empty byte strings and empty hash/HMAC messages are valid inputs.

### 4. Add byte APIs without removing existing text APIs

Add slice-oriented core entry points for Base64, Hex, hash, and HMAC message data. Where changing an existing `&Vec<u8>` parameter to `&[u8]` is source-compatible for normal calls, use the idiomatic slice form. For hash and HMAC, retain existing `&str` functions as compatibility wrappers and add byte-oriented entry points used by the CLI. Secrets retain their existing textual API in this change.

This lets CLI `Cow<[u8]>` values flow to core logic without conversion, makes non-UTF-8 hashing possible, and avoids breaking existing `strapd-core` callers that use the string functions. Hash and HMAC handlers apply the current piped-message whitespace normalization directly to the byte slice, preserving ordinary `echo` pipeline behavior without allocating or requiring UTF-8.

Alternative considered: change every hash and HMAC public function directly from `&str` to `&[u8]`. Rejected because `strapd-core` is a reusable library and the additive API is safer for downstream source compatibility.

### 5. Keep conversion and environment secrets specialized

Conversion uses `piped_text`, explicitly normalizes stdin, joins argument fragments, and inserts a single composition separator only when both sources contain usable content. It does not use the required-input helpers because stdin is optional when arguments exist.

JWT token and payload resolution delegates acquisition to the shared module but retains JWT-specific empty validation. Secret arguments and environment variables remain in `resolve_secret` because they have different security and Unicode error requirements.

### 6. Make numeric stdin fallible within the same change

Datetime numeric arguments are already parsed by clap. When absent, the handler will use the shared text acquisition path, apply the existing trim policy, and parse through `Result` with a user-facing validation error. The panicking `get_input_int` helper is removed after its caller migrates.

Alternative considered: leave numeric input for a follow-up. Rejected because it would retain the same interactive blocking and panic class under a different legacy helper.

### 7. Verify behavior in layers

Verification combines:

1. Input-module unit tests using injected terminal state and readers, including a reader that fails and one that returns partial chunks.
2. Structural assertions that argument paths return `Cow::Borrowed` and never call the reader.
3. Process-level CLI tests for representative text, byte, format, security, JWT, conversion, and numeric handlers.
4. Generated or table-driven byte round trips containing empty input, NUL, CRLF, and non-UTF-8 data.
5. A real PTY test on supported Unix environments, with a strict timeout, to prove omitted interactive input exits rather than blocks; unsupported environments retain the injected terminal test and a documented manual smoke check.
6. The full Rust format, lint, and test suite.

Characterization tests are added before each handler family migrates so unintended whitespace or empty-input changes are visible at the migration point.

### 8. Prove performance structurally and measure it end to end

The primary performance guarantees are structural: positional values remain borrowed, byte input reaches slice-oriented core APIs without a full-value copy, and trimming piped text creates a view rather than a second owned string.

Record before-and-after release measurements for Base64, Hex, and SHA-256 using small input plus 1 MiB, 16 MiB, and 64 MiB stdin payloads. Repeated runs report median wall time; GNU `time -v` or an equivalent available tool records peak resident memory. Also exercise the largest practical positional payload within the operating system's argument-size limit.

The change is acceptable when structural zero-copy assertions pass, representative release benchmarks show no material regression beyond normal measurement noise, and large-input peak memory is flat or lower. Benchmark results are evidence for the change, not timing assertions in ordinary CI, which would be flaky.

## Risks / Trade-offs

- [Per-command trimming remains asymmetric between arguments and stdin] → Preserve it deliberately for compatibility, document it in tests, and defer an explicit raw-text option to a separate feature.
- [A handler may accidentally omit its previous trim step] → Add characterization tests before migration and review against the compatibility matrix.
- [Returning empty data for non-interactive EOF may produce an operation error rather than generic missing-input guidance] → Keep content validation operation-specific and test `/dev/null`/empty-pipe behavior explicitly.
- [PTY tests can be platform-specific or flaky] → Use a strict child timeout, gate platform-specific code, and retain deterministic injected-terminal unit coverage.
- [Additional byte APIs increase the core surface] → Keep existing text functions as thin wrappers over one byte implementation and document which layer owns encoding.
- [Whole-input buffering still limits very large pipelines] → Keep streaming out of scope; eliminate duplicate buffers now and consider streaming only with corresponding core API changes.
- [Timing measurements are dominated by process startup for small inputs] → Separate structural allocation proof from end-to-end measurements and emphasize large payloads for throughput conclusions.

## Migration Plan

1. Record the current test and release-performance baseline and add compatibility characterization tests.
2. Add the shared input module and exhaustive injected-reader tests without migrating handlers.
3. Add slice/byte core entry points and migrate Base64 and Hex first.
4. Migrate structured formats and URL operations while retaining existing piped-text trimming.
5. Migrate JWT and conversion while keeping their validation and source-composition policies explicit.
6. Add byte-oriented hash/HMAC paths and migrate security handlers.
7. Migrate string, calculator, clipboard, and datetime handlers.
8. Remove legacy input helpers after a repository-wide zero-reference check.
9. Run process, PTY, property/table-driven, format, lint, and full test verification; repeat release measurements and record the comparison.

Rollback is mechanical while migrations remain staged: restore a handler to its previous helper and keep the shared module. After final removal, revert the migration as one change; no persisted data or external protocol requires migration.
