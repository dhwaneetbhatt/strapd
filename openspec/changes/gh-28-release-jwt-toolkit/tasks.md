## 1. Preparation

- [x] Verify main contains merged JWT support and passed CI.
- [x] Verify latest public release is v1.3.0 and inspect release workflows.
- [x] Update package versions and lockfile to 1.4.0.
- [x] Date and finalize the v1.4.0 changelog.

## 2. Validation

- [ ] Validate OpenSpec artifacts.
- [x] Run Rust formatting, lint, tests, and release build.
- [x] Rebuild WASM and run webapp checks, tests, and production build.

## 3. Publishing

- [ ] Merge validated release preparation.
- [ ] Create and push v1.4.0 tag at the release commit.
- [ ] Verify six CLI artifacts and publish the workflow-created draft release.
- [ ] Verify successful GitHub Pages deployment of the tagged commit.
- [ ] Verify and merge the Homebrew tap update.
- [ ] Archive this change after publishing succeeds.

## Verification results

- 650 Rust tests passed; formatting and clippy passed.
- CLI release binary reports `strapd 1.4.0`; HS256/HS384/HS512 signing, verification, and extraction smoke checks passed.
- WASM rebuild, webapp lint, 321 webapp tests, and production/PWA build passed.
- OpenSpec strict CLI validation remains blocked: the CLI is not installed or cached and the proxy is unavailable.
- Publishing remains blocked by environment network and GitHub CLI authentication.
