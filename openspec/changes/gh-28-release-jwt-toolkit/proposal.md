## Why

JWT support is merged and CI passes, but CLI binaries and the webapp remain on v1.3.0. A minor release makes JWT support and accumulated webapp features available to users.

## What Changes

- Set CLI, core, WASM, and webapp package versions to 1.4.0.
- Move Unreleased changelog entries into v1.4.0 dated 2026-10-03.
- Validate builds and tests, then use the existing tag-triggered release and Pages workflows.

## Capabilities

### New Capabilities

- `release-metadata`: Consistent version metadata and documented release contents.

### Modified Capabilities

None.

## Impact

Package manifests, Cargo.lock, and CHANGELOG.md. Publishing requires authenticated GitHub tag and release access. The CLI workflow creates a draft release and a Homebrew tap PR; the draft must be published and the tap update merged after artifact verification.
