## 1. Rust core JWT model and parsing

- [x] 1.1 Add the core serialization dependencies and a `jwt` module with typed algorithms, decoded output, optional analysis, signature status, and structured errors.
- [x] 1.2 Implement deterministic input normalization for whitespace, matching quotes, and case-insensitive Authorization/Bearer wrappers, with rejection of unrelated surrounding text.
- [x] 1.3 Implement exact three-segment parsing, padded and unpadded Base64URL decoding, UTF-8 validation, and object-shaped header and claims parsing while retaining the original signing input.
- [x] 1.4 Implement pretty serialization for header-only, payload-only, default combined decode, and combined decode with an `analysis` envelope.
- [x] 1.5 Add fixed-clock expiration analysis for active, expired, absent, and invalid `exp` claims using RFC 3339 UTC output and signed remaining seconds.
- [x] 1.6 Add core unit tests covering normalization boundaries, segment-specific failures, JSON shapes, lossless decoded values, analysis opt-in, and deterministic expiration states.

## 2. Rust core verification and signing

- [x] 2.1 Implement HS256, HS384, and HS512 dispatch over raw HMAC bytes while preserving existing hexadecimal HMAC APIs.
- [x] 2.2 Implement protected-header algorithm selection and constant-time verification of decoded signature bytes, including mismatch, missing algorithm, `none`, and unsupported-algorithm errors.
- [x] 2.3 Implement signing of JSON object claims with an HS256 default, selectable HS384/HS512, canonical unpadded Base64URL output, and no implicit claim mutation.
- [x] 2.4 Implement positive relative expiration handling that replaces only `exp` using an injectable UTC clock and never adds or changes `iat`.
- [x] 2.5 Add known-vector and round-trip tests for every supported algorithm, tampered content, malformed signatures, algorithm mismatch, expiration mutation, and claim preservation.

## 3. CLI commands and contracts

- [x] 3.1 Add `jwt` CLI arguments for decode/inspect/parse, payload/body, header/meta, verify/check, and sign/gen/create with positional-or-stdin input.
- [x] 3.2 Add canonical `--include-analysis` with visible `--analyze` and `--analyse` aliases only to decode, and map decode/header/payload outputs to data-only pretty JSON.
- [x] 3.3 Add a reusable mutually exclusive secret-source argument for `--secret` and `--secret-env`, including missing and non-Unicode environment-variable errors that never echo the value.
- [x] 3.4 Add verification handling with concise success output, actionable stderr failures, protected-header algorithm reporting, and correct exit codes.
- [x] 3.5 Add signing handling for stdin or positional payload, HS256 default, algorithm selection, positive `--exp`, and compact-token-only stdout.
- [x] 3.6 Add representative examples to clap help and CLI integration tests for canonical commands, aliases, stdin, output purity, analysis opt-in, secret sources, and exit statuses.

## 4. WASM bindings and TypeScript bridge

- [x] 4.1 Add coarse WASM exports for decode, analyzed decode, extraction, verification, and signing that serialize core results and preserve structured errors.
- [x] 4.2 Rebuild the generated WASM package and update checked/generated TypeScript declarations consumed by the webapp.
- [x] 4.3 Extend `WasmModule`, `WasmWrapper`, and JWT utility adapters without reimplementing normalization, cryptography, or expiration logic in TypeScript.
- [x] 4.4 Add WASM wrapper tests for successful serialized results and each major core error category.

## 5. Webapp JWT tools

- [x] 5.1 Register discoverable JWT inspector/verifier and signer tools in the security category using existing `/tool/:toolId` routing and shared operations.
- [x] 5.2 Build the responsive inspector workbench with token input, split header/payload JSON, explicit expiration states, formatted timestamp presentation, and unverified/verified/mismatch signature states.
- [x] 5.3 Build local HMAC secret and verification controls for HS256, HS384, and HS512 with accessible labels, actionable errors, and no network access.
- [x] 5.4 Build the JWT signer UI with JSON input, secret, algorithm, optional positive expiration, compact output, and direct output copy actions.
- [x] 5.5 Prevent standalone JWT secret fields from entering URL query state.
- [x] 5.6 Keep JWT input monospace, remove redundant implementation-detail and tool-specific CLI-command actions, remove payload-to-pipe handoff, and use the page as the single vertical scrolling surface.
- [x] 5.7 Add component and page tests for automatic processing, malformed input, temporal states, verification states, signing, secret non-serialization, output actions, accessibility, and responsive layouts.
- [x] 5.8 Make JWT Signer discoverable through common JWT encode terminology and add a search regression test.

## 6. Pipe compatibility

- [x] 6.1 Register a versioned `security-jwt-decode` transform contract with payload-only, header-only, and full output modes plus explicit bearer-normalization and analysis configuration.
- [x] 6.2 Register a versioned `security-jwt-sign` transform contract with frozen secret, algorithm, and optional expiration configuration and compact string output.
- [x] 6.3 Add generic contract, validation, persistence, export/import, and execution tests proving JWT outputs are strings, failures stop at the JWT step, and configured signing secrets follow existing pipe behavior.
- [x] 6.4 Add regression tests proving JWT tools are discoverable in the builder while first-run storage and exported application assets contain no pre-created JWT pipes or recipes.
- [x] 6.5 Prevent syntax-highlighted pipe output from splitting long minified JSON tokens and add a regression test for horizontal overflow.

## 7. Documentation and verification

- [x] 7.1 Document the complete CLI syntax, aliases, direct/stdin examples, analysis opt-in contract, supported algorithms, secret-source trade-offs, and composition examples.
- [x] 7.2 Document the webapp JWT workflows, offline guarantee, distinction between decoding, expiration, and verification, and plaintext-secret behavior for user-created pipe configuration.
- [x] 7.3 Update project feature inventories and architecture documentation without presenting illustrative pipe recipes as bundled pipes.
- [x] 7.4 Run Rust formatting, linting, unit/integration tests, and CLI help/manual smoke tests for all JWT operations.
- [x] 7.5 Rebuild WASM and run webapp formatting, linting, tests, and production build.
- [x] 7.6 Manually verify CLI/WebAssembly parity, offline operation, desktop/mobile and light/dark presentation, keyboard interaction, secret URL exclusion, and absence of seeded pipes.

## 8. CLI advertisement page redesign

- [x] 8.1 Replace the generic hero and benefit-card grid with a product-specific terminal demonstration whose commands and output are validated against the current CLI, plus concise factual offline and composability proof.
- [x] 8.2 Rework installation around Homebrew as the first recommended path, progressively disclose secondary methods, add accessible copy feedback, installer-source links, sticky-header-safe navigation, verification, first-use, and command-discovery guidance.
- [x] 8.3 Unify the page with the codebench design system, remove decorative gradients and mixed emoji/color treatments, harden external links, and prevent overflow at 320px and 200 percent zoom.
- [x] 8.4 Add focused CLI-page tests for hierarchy, real command copy, installation method switching, Homebrew priority, safe links, responsive semantics, and run formatting, linting, tests, production build, and desktop/mobile light/dark visual verification.
- [x] 8.5 Add factual baseline and route-specific SEO metadata with cleanup behavior, canonical and social tags, structured data, and focused tests.
