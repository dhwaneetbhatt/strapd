# Verification

## Commands

| Command | Result |
| --- | --- |
| `make extension-build` | Passed. Built `extension/wasm/`, wrote `src/generated-meta.ts` from the real WASM SHA-256, and produced the self-contained `extension/dist/` package. |
| `make extension-typecheck` | Passed. `tsc --noEmit`. |
| `make extension-test` | Passed. 8 test files, 49 tests, covering settings normalization, pause expiry, detector-bit mapping, lazy diff segments, insertion, stale responses, committed-redaction counting, serialized session writes, bottom-sheet placement, silent auto mode with no overlay or layout read, Proof drawer toggle/self-test refresh, final identity copy, generated digest/CSP metadata, mode flows, and the real-WASM contract. |
| `make rust-fmt-check` | Passed. |
| `make webapp-lint` | Passed. |
| `openspec validate browser-extension-paste-intercept --strict` | Passed. |
| `git diff --check` | Passed. |

## Artifact checks

`extension/dist/` contains the built background, content, popup, fixture, manifest, WASM, sourcemaps, CSS, and local icons.

- Real SHA-256: `7b7865146cda1313f798dc67bd33b6e436b09bd1cff14462900bf3937ba3f7a3`
- Generated digest matches `shasum -a 256 extension/dist/strapd_wasm_bg.wasm`.
- Built CSP: `script-src 'self' 'wasm-unsafe-eval'; connect-src 'none'; object-src 'self'`
- Exact Proof-drawer directive: `connect-src 'none'`
- Icons regenerated with `extension/render-icons.sh` from `extension/icons/icon.svg` at 16, 32, 48, and 128 px. `rsvg-convert` was unavailable, so the ImageMagick MVG fallback was used; pixel histograms confirm the navy fill `#0F172A`, blue border `#2563EB`, and white glyph `#FFFFFF` are present, and all PNGs have the exact target dimensions.
- External CDN/font/remote stylesheet/remote fetch references: 0.
- Host permissions are limited to the three default AI domains; broad HTTP(S) origins are optional only.

## Design checks

- `SCAN_TEXT` carries detector flags; the worker returns findings, scrubbed text, and real elapsed time without an eager diff payload.
- Generated metadata is Git-ignored; typecheck and tests depend on the full build, and a contract test compares the generated digest and CSP directive to the built WASM and manifest.
- Zero-bit detector masks skip the corresponding WASM calls.
- Secret/PII detection and redaction remain in Rust/WASM; TypeScript only maps category bits, counts WASM placeholders, and lazily renders a placeholder-anchored display diff when a user opens it.
- The paste handler uses cached settings, never reads layout, and traps Enter/Escape in the ask-mode bottom sheet so the host form is not submitted.
- Settings, badge state, custom sites, permission reconciliation, session counter, and offline self-test are wired through the popup and service worker.
- An independent correctness review found four issues; all were fixed, covered by regression tests, and re-verified by the same reviewer: stale paste responses no longer insert text, ask-mode redactions increment the proof counter, failed pause resume fails open with raw text, and concurrent counter writes are serialized.
- A second independent review found no P0/P1 defects in the strict-CSP/Proof work and one P2 stale-generated-metadata risk. It was resolved by ignoring generated metadata, making typecheck/tests depend on the full build, and adding a digest/CSP contract test; the same reviewer confirmed the fix with no new findings.
- Feedback fixes: the review card is a compact bottom sheet with no scan timing; auto mode has no popup, toast, timer, diff, undo control, or layout read; the insertion record and raw-replacement helper were removed. The ask-mode diff still expands lazily from Show diff.
- The Proof drawer now hides via an explicit `.proof-drawer[hidden]` rule, and both opening Proof and running the self-test enqueue a serialized audit refresh. Chrome verified both behaviors.
- Final identity copy: exact short manifest description, brand-only popup header, and `0 bytes sent · Fully offline` in the Proof summary; unused header CSS was removed.
- Chrome verified `connect-src 'none'`: the Proof drawer reported `✓ Verified: 4 findings in 1.6ms round trip`, and the dummy payload was redacted. The strict directive is now shipped.

## Manual checks

The user completed the Chrome smoke checks:

- Ask mode bottom-sheet placement, diff, and keyboard actions.
- Auto-redact inserts with no popup or confirmation.
- Add/remove a custom site across a browser reload.
- Cold-start service worker recovery.
- Offline Self-Test with network disabled. The strict `connect-src 'none'` build was verified by the user.

## Notes

No issue number was provided for this worktree, so the OpenSpec change uses the descriptive name `browser-extension-paste-intercept` instead of the `gh-<issue-number>-...` convention. All implementation, review, and manual Chrome checks are complete.
