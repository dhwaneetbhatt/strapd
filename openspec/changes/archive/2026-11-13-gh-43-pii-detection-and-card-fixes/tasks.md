## 1. Reproduction and core

- [x] 1.1 Reproduce numeric JSON/grouping failures and record release baseline latency.
- [x] 1.2 Add shared resolved detection API and parity/allocation tests.
- [x] 1.3 Fix issuer/length filtering, numeric JSON labels and grouped cards with regressions and deterministic false-positive checks.
- [x] 1.4 Evaluate Unicode email coverage; defer optional support to keep the latency-sensitive patch focused.

## 2. Integration

- [x] 2.1 Expose packed browser detections.
- [x] 2.2 Extend CLI and actual WASM parity regressions, address the existing keyboard-test focus race without weakening assertions, and update usage/coverage documentation.

## 3. Validation and review

- [x] 3.1 Run required Rust/WebApp/browser checks, release smoke tests and repeat performance methodology, recording limitations.
- [x] 3.2 Obtain independent correctness review and resolve findings.
- [x] 3.3 Commit tested changes and verification evidence for review in PR #44; leave version bumps, tags and release publication pending approval.

## 4. Review cleanup

- [x] 4.1 Keep detection checks in the existing browser suite and synthetic corpus checks in Rust.
- [x] 4.2 Retain measurement evidence without adding permanent benchmark scripts or build targets.
- [x] 4.3 Fix the pre-commit Rust linter target and verify the Rust-only branch without running Git mutations.
- [x] 4.4 Run focused browser, lint, formatting and OpenSpec checks; leave all release actions pending review.
- [x] 4.5 Sync the completed requirements to the main spec and archive the change.
