## 1. Reproduction and core

- [x] 1.1 Reproduce numeric JSON/grouping failures and record release baseline latency.
- [x] 1.2 Add shared resolved detection API and parity/allocation tests.
- [x] 1.3 Fix issuer/length filtering, numeric JSON labels and grouped cards with regressions and deterministic false-positive checks.
- [x] 1.4 Evaluate Unicode email coverage; defer optional support to keep the latency-sensitive patch focused.

## 2. Integration

- [x] 2.1 Expose packed browser detections; portable runtime packaging is deferred to a generic strapd interface after user review.
- [x] 2.2 Extend CLI and actual WASM parity regressions, address the existing keyboard-test focus race without weakening assertions, and update usage/coverage documentation.

## 3. Validation and release

- [x] 3.1 Run required Rust/WebApp/browser checks, release smoke tests and repeat performance methodology, recording limitations.
- [x] 3.2 Obtain independent correctness review and resolve findings.
- [x] 3.3 Prepare tested changes and verification evidence for user review; commit the tested changes when authorized; leave version bump, archive, tags, pushes and release publication pending explicit approval.

## 4. Review cleanup

- [x] 4.1 Fold relevant detection checks into the existing browser suite; remove the standalone WASM verifier and duplicate corpus loops.
- [x] 4.2 Remove the permanent benchmark and PII-only WASM example, build targets and documentation; retain measurement evidence and defer generic portable packaging.
- [x] 4.3 Fix the pre-commit Rust linter target and verify the Rust-only branch without running Git mutations.
- [x] 4.4 Run focused browser, lint, formatting and OpenSpec checks; leave all release actions pending review.
