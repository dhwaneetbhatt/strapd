## Why

Developers regularly inspect and create JSON Web Tokens while debugging authorization failures, but online JWT tools can expose sensitive claims and secrets. strapd should cover this common workflow locally with one consistent Rust implementation shared by the CLI and webapp.

## What Changes

- Add offline JWT normalization, decoding, claim extraction, expiration analysis, HMAC signature verification, and signing for HS256, HS384, and HS512.
- Add `strapd jwt decode`, `payload`, `header`, `verify`, and `sign` commands with forgiving aliases, positional-or-stdin input, predictable output, and actionable exit-code failures.
- Keep decoded output faithful to the token by default and add derived expiration and signature metadata only when `decode` receives `--include-analysis` or an accepted alias.
- Add a JWT workbench to the existing webapp tool registry, backed by WASM bindings to the shared Rust implementation.
- Make JWT decoding and signing available as pipe-compatible tools without creating or bundling any pre-built pipes.
- Refresh the webapp CLI page so it demonstrates real composable commands, presents Homebrew as the first recommended installation path, makes installation responsive, auditable, and easy to verify, and exposes factual search and social metadata.
- Keep all parsing, verification, and signing offline; remote JWKS access and asymmetric algorithms remain out of scope.

## Capabilities

### New Capabilities

- `jwt-toolkit`: Offline JWT decoding, optional analysis, HMAC verification and signing across the Rust core, CLI, WASM webapp, and pipe tool registry.

### Modified Capabilities

None.

## Impact

- Adds a JWT domain module and cryptographic/serialization support to `strapd-core`.
- Extends CLI argument parsing, handlers, aliases, help examples, and error behavior.
- Extends WASM exports and the TypeScript WASM wrapper with structured JWT operations.
- Adds JWT tool definitions, UI components, tests, and pipe contracts to the webapp.
- Revises the existing CLI advertisement page hierarchy, installation interactions, and responsive presentation without changing CLI behavior.
- Adds SHA-384 and Base64URL-no-padding behavior required by HMAC JWTs.
- Does not add network calls, bundled pipe recipes, asymmetric verification, or remote key discovery.
