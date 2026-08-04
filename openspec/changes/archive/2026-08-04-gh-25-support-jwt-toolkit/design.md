## Context

strapd currently exposes shared Rust operations through thin CLI handlers and WASM bindings, while the webapp central tool registry supplies both standalone components and optional pipe contracts. The core already depends on `base64`, `hmac`, `sha2`, and `chrono`, but its Base64 helper uses the standard alphabet, its HMAC helper returns hexadecimal output for SHA-256 and SHA-512 only, and its JSON formatter uses the `json` crate. JWT requires Base64URL processing, raw constant-time MAC verification, SHA-384, structured claims, and UTC temporal analysis.

The change crosses the core, CLI, WASM, webapp tools, and pipe registry. It handles secrets and cryptographic verification, so the public data model and trust boundaries need to be explicit. The proposal and `jwt-toolkit` specification define the observable contract.

## Goals / Non-Goals

**Goals:**

- Keep parsing, analysis, verification, and signing in a reusable Rust core with equivalent CLI and WASM behavior.
- Make the common inspect-and-verify workflow forgiving at the input boundary and strict after normalization.
- Preserve decoded JWT data by default and visibly separate opt-in derived analysis.
- Provide small, composable CLI commands with clean stdout and reliable exit codes.
- Integrate JWT operations into the established webapp tool and pipe architecture.
- Verify HMAC signatures without algorithm confusion or timing-sensitive byte comparisons.

**Non-Goals:**

- Remote JWKS discovery or any other network operation.
- RS256, ES256, EdDSA, encrypted JWTs/JWE, PEM handling, or certificate validation.
- Full JWT authorization policy evaluation or automatic enforcement of audience, issuer, subject, `nbf`, or custom claims.
- Searching arbitrary logs for embedded tokens.
- Creating, seeding, or recommending persisted pipe recipes in the product.
- Hiding secrets from the existing persisted/exported configuration of user-created pipes; a stronger secret-reference model can be designed separately.

## Decisions

### 1. Model JWTs explicitly in `strapd-core`

Add a `jwt` module with explicit algorithm, decoded-token, expiration-analysis, signature-status, and error types. Use `serde` and `serde_json` for typed serialization while preserving the header and payload as `serde_json::Value` objects. Public operations accept an optional clock value internally so expiration tests are deterministic; interface adapters use the current UTC Unix time.

The core returns typed values rather than preformatted CLI messages. CLI handlers choose human or JSON presentation, while WASM bindings serialize the same values into JSON strings for the TypeScript wrapper. This keeps business rules out of both adapters without requiring JavaScript object marshalling through `serde-wasm-bindgen`.

Alternative considered: implement decoding in TypeScript and the CLI independently. Rejected because it violates the one-core guarantee and invites normalization and error drift.

Alternative considered: use the existing `json` crate for JWT structures. Rejected because `serde_json` is already used by the WASM crate, integrates directly with typed Rust data, and is better suited to stable serialized contracts.

### 2. Separate normalization, parsing, analysis, verification, and signing

The core pipeline has deliberate stages:

```text
raw input
   │
   ▼
normalize supported wrappers
   │
   ▼
split exactly three segments
   │
   ▼
decode + parse header and claims objects
   ├──────────────► optional expiration analysis
   └──────────────► algorithm-bound signature verification

JSON claims ──────► optional exp mutation ─► sign ─► compact JWT
```

Normalization removes only documented wrappers and never searches free text. Parsing accepts unpadded canonical Base64URL and compatible padding, validates UTF-8 and JSON separately, and retains the original encoded header and payload for verification. Decode results contain only header and payload. An explicit analysis operation decorates that result under `analysis`; extraction operations return the original objects alone.

Alternative considered: always calculate expiration because it is inexpensive. Rejected because derived data would silently change the default decoded contract and complicate composition.

### 3. Treat expiration as analysis, not validation

`exp` is interpreted only when analysis is requested. A finite numeric value is treated as a UTC NumericDate; the clock comparison produces `ACTIVE` or `EXPIRED`, and absence produces `NOT_PRESENT`. A present nonnumeric, non-finite, or unrepresentable value produces `INVALID` without inventing temporal values or discarding the decoded token. `seconds_remaining` is signed so expired tokens retain useful machine-readable age information.

The initial release does not evaluate `nbf`, `iat`, issuer, audience, or application-specific authorization policy. This keeps “decode” separate from “is acceptable to my service.”

Alternative considered: label any decodable, unexpired token `VALID`. Rejected because neither structure nor expiration proves authenticity or application authorization.

### 4. Implement JWT HMAC directly over raw bytes

Add HS256, HS384, and HS512 dispatch that computes over the exact ASCII `<encoded-header>.<encoded-payload>` signing input. Signing encodes raw MAC bytes with URL-safe Base64 and no padding. Verification decodes the signature segment and calls the `hmac` crate's constant-time `verify_slice` path. The protected header is the sole verification algorithm source; missing, `none`, asymmetric, and unknown algorithms fail before MAC verification.

Existing hexadecimal HMAC APIs remain stable. Shared private helpers may be extracted, but JWT code must not compare encoded signature strings or repurpose a hexadecimal result.

Alternative considered: add a general JWT crate. Rejected for the initial HMAC-only scope because the existing primitives cover the requirement, keep WASM size and transitive surface controlled, and make the supported subset explicit.

### 5. Keep the CLI surface small and output-specific

Add a `Jwt` top-level command and a dedicated args/handler pair:

```text
strapd jwt decode [TOKEN] [--include-analysis]
strapd jwt payload [TOKEN]
strapd jwt header [TOKEN]
strapd jwt verify [TOKEN] (--secret <SECRET> | --secret-env <VARIABLE>)
strapd jwt sign [PAYLOAD] (--secret <SECRET> | --secret-env <VARIABLE>)
                         [--algorithm <HS256|HS384|HS512>]
                         [--exp <SECONDS>]
```

Canonical command aliases follow the agreed vocabulary. `--include-analysis` is canonical because it accurately describes augmentation; `--analyze` and `--analyse` are visible aliases. Token and payload positionals fall back to piped stdin. The input reader must detect an interactive terminal and return a missing-input error rather than blocking.

Decode/header/payload/sign stdout remains data-only. Verify intentionally emits a concise human result and relies on exit status for scripts. All failures use the existing stderr and exit-1 path. `--secret` and `--secret-env` form a required mutually exclusive group; no additional secret-file or prompt mechanism is added in this change.

Signing defaults to HS256 and preserves payload claims. `--exp` accepts a positive duration, replaces `exp` with `now + duration`, and never adds or changes `iat`. This makes the requested mutation explicit.

Alternative considered: add formatting flags to every JWT subcommand. Rejected because pretty JSON is the established readable default and users can compose with `strapd json minify`, `sort`, or `beautify`.

### 6. Expose coarse WASM operations with serialized contracts

WASM exports call core operations and return JSON strings or compact JWT strings through `Result<String, JsValue>`. The TypeScript `WasmModule` and `WasmWrapper` expose decode, analyze, verify, and sign methods using the established safe-call error mapping. TypeScript utilities translate successful serialized core output into the fields required by tool operations without reimplementing JWT rules.

The bindings remain coarse enough that a single user action crosses the WASM boundary once. This avoids reconstructing a JWT workflow from low-level Base64 and HMAC calls in JavaScript.

### 7. Use focused webapp tools within the existing route and registry model

Add a JWT inspector/verifier component and a JWT signer component under the security category, reached through the existing `/tool/:toolId` route rather than a bespoke `/jwt` route. The inspector uses the requested input, split header/payload, expiration presentation, and verification areas. The signer uses payload, algorithm, optional expiration, and secret inputs. Discovery aliases include the common JWT encode/decode vocabulary even though the operations remain accurately named sign and inspect. Both tools reuse established copy, syntax highlighting, responsive layout, auto-processing, error, and accessibility patterns.

JWT secrets are local browser state. Standalone secret fields must be excluded from URL query synchronization so copying the tool URL does not include them. Token/payload state can continue to use the established URL behavior, subject to explicit copy actions.

The JWT input uses the established monospace data-entry treatment. The workbench omits redundant implementation-detail copy and tool-specific CLI-command generation. It uses the page as its single vertical scrolling surface rather than adding a nested workbench scrollbar. Payload-to-pipe handoff is deferred; pipe-compatible JWT operations remain discoverable through the pipe builder.

Alternative considered: add one bespoke route containing every JWT mode. Rejected because it bypasses existing navigation, discovery, settings, and tool lifecycle conventions.

### 8. Register two versioned JWT pipe operations without recipes

Register `security-jwt-decode` as a transform with configuration for `outputMode`, `autoStripBearer`, and `includeAnalysis`. Its canonical `result` is a JSON string containing payload-only, header-only, or the full decoded representation. Register `security-jwt-sign` with JSON input, secret, algorithm, and optional expiration configuration; it emits the compact token as `result`.

Pipe output syntax highlighting preserves minified JSON as intact preformatted text with horizontal overflow. It must not split highlighted tokens character by character when a one-line result exceeds the pane width.

The signing operation is modeled as a transform so it naturally accepts upstream JSON. A user who wants generator-led execution can place a generic text/JSON source before it; the change does not add special dual source/transform semantics to the pipe framework. Secrets remain ordinary frozen configuration and therefore follow current local persistence and export behavior, as explicitly accepted for this release.

Both contracts live in the central registry and use existing generic discovery, validation, persistence, import/export, and execution. No recipe data, default saved pipe, or first-run mutation is introduced.

Alternative considered: make signing both a source and a transform. Rejected because the current pipe contract deliberately assigns one input kind per operation and the same workflow is already expressible by composition.

### 9. Make the CLI page prove value before asking for installation

Recompose the existing CLI advertisement page as a focused persuasion path: a factual hero, a terminal demonstration made only from commands verified against the current binary, concise proof of offline and composable behavior, then installation. Remove the generic Fast/Portable/Easy/Flexible card grid, decorative gradient text, mixed emoji/icon language, and arbitrary command colors. The page retains the established neutral codebench surfaces and single blue action signal.

The hero demonstration uses a real stdin pipeline—JSON minification with sorted keys followed by Base64 encoding—and shows its deterministic output. Supporting examples may use `strapd uuid v7`, `strapd --version`, or other commands only after their syntax is verified against current clap help or an executed binary.

Installation presents Homebrew first and marks it recommended, matching README. A compact platform selector exposes one primary method at a time; Unix, Windows, manual download, and source installation remain available as secondary methods rather than equal full-page cards. Each command has a direct copy action with accessible success feedback. Installer methods link to their source where applicable, state what the user should verify, and end with `strapd --version` plus a first useful command. The page does not invent checksum, signature, architecture, destination, or uninstall claims that the repository cannot substantiate.

Responsive layout must remain within the viewport at 320px and above. Horizontal command scrolling stays local to code surfaces, hero actions stack on narrow viewports, the installation anchor accounts for sticky navigation, and content remains usable at 200% zoom. External links use safe new-tab attributes. The final section leads to successful CLI use and command discovery rather than ending only on license metadata.

The CLI route sets a concise page title, description, canonical deployed URL, Open Graph and Twitter metadata, and factual `SoftwareApplication` structured data without introducing claims absent from the repository. Route-specific metadata is restored when the user leaves the page so the single-page application does not mislabel other tools. The static document retains useful baseline metadata for crawlers that do not execute the route bundle.

Alternative considered: keep every installation method expanded so all options are immediately visible. Rejected because it gives five decisions equal weight, delays the recommended path, and produces excessive mobile scrolling.

## Risks / Trade-offs

- [Users may treat decoded or unexpired tokens as authenticated] → Keep analysis opt-in in the CLI, label signature state `UNVERIFIED`, and visually separate decoding, expiration, and verification.
- [User-created signing pipes persist and export plaintext secrets] → Keep behavior explicit in configuration copy and documentation; defer secret references or runtime secret injection to a dedicated future design.
- [Standalone tool state can leak through shareable URLs] → Exclude secret fields from URL serialization.
- [Permissive normalization can accept unintended text] → Strip only exact documented wrappers and reject arbitrary surrounding content.
- [Supporting padded input increases accepted representations] → Emit only canonical unpadded Base64URL and test both accepted decode forms.
- [Current clock makes expiration tests flaky] → Inject the analysis/signing time into core internals and assert fixed instants in tests.
- [Adding `serde_json` duplicates the existing `json` dependency] → Limit `serde_json` to the JWT domain initially; broader JSON consolidation is out of scope.
- [Webapp registry visibility and pipe registration can drift] → Keep both definitions in the central registry and extend contract tests to cover discovery, defaults, string output, and component visibility.

## Migration Plan

1. Add core types and operations without exposing them through interfaces.
2. Add CLI commands and tests against fixed JWT vectors and clocks.
3. Add WASM bindings, rebuild generated artifacts, and update wrapper tests.
4. Add standalone webapp tools, then register and test pipe contracts.
5. Update user-facing command and tool documentation and perform offline manual verification.

Rollback removes the new CLI dispatch, WASM exports, registry entries, and JWT modules. Existing persisted pipes that reference the removed tool IDs remain diagnosable as unavailable under the current pipe contract instead of being silently discarded.

## Open Questions

None. The initial scope, CLI contract, analysis boundary, secret persistence behavior, and absence of bundled pipe recipes are resolved.
