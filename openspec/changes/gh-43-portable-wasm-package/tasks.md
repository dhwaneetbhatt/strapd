## 1. Replace the experiment

- [x] 1.1 Capture PoC decisions, measurements and limits in this change’s results.md; keep only integration files in the PR.
- [x] 1.2 Add the portable crate, complete versioned WIT catalog and thin core adapters with boundary validation.

## 2. Integrate builds and distribution

- [x] 2.1 Add pinned tooling, Make build/test/package targets and existing setup/version script integration.
- [x] 2.2 Validate artifacts in CI and add portable assets to the existing future draft release workflow.
- [x] 2.3 Document host ownership/services/versioning and update repository architecture references.

## 3. Verify and deliver

- [x] 3.1 Test actual core module and component contracts, all exports, malformed data, binary/Unicode values, large inputs, 64-bit values, clocks/randomness and reuse.
- [x] 3.2 Run Rust and WebApp regression checks, rebuild browser WASM, obtain independent correctness review and resolve findings.
- [x] 3.3 Validate OpenSpec and final diff; update the same PR with only integration code and results documentation. Do not release.
