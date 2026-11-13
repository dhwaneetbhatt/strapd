## Why

Non-browser hosts need reusable strapd WASM without JavaScript glue or client-specific modules. The portability PoC selected WIT; its findings should remain documentation, while this PR ships the actual reusable package.

## What Changes

- Capture portability findings in this change’s results.md and implement the reusable package.
- Add a `strapd-wasm-portable` crate exposing the existing browser tool catalog through a versioned WIT world, forwarding to `strapd-core` without browser features.
- Build a WASI Preview 1 core module for core runtimes and a component for component-aware runtimes, with the same WIT contract.
- Add build, contract tests, CI validation and future release packaging; retain the WebApp's existing wasm-bindgen bindings.
- Document ownership, errors, host requirements, UTC timestamps and versioning. Do not ship a language SDK, custom ABI, client integration or release in this work.

## Capabilities

### New Capabilities
- `portable-wasm`: Typed portable WASM library, reproducible artifacts, host contract and regression validation.

### Modified Capabilities

None; existing CLI and browser behavior remains unchanged.

## Impact

New Rust crate/WIT contract/tests; root Cargo lockfile, Makefile, setup/version scripts, CI and release packaging; README, AGENTS and usage documentation. `wit-bindgen` and pinned component tooling are added. Browser features remain opt-in at the portable dependency boundary. No version bump, tag, publication or application migration.
