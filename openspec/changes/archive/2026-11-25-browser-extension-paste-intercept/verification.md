# Verification

## Commands

| Command | Result |
| --- | --- |
| `make extension-build` | Passed. Built `extension/wasm/`, wrote `src/generated-meta.ts` from the real WASM SHA-256, and produced the load-ready `extension/dist/` package with its local fixture. |
| `make extension-package` | Passed. Staged a minified `extension/release/` without sourcemaps or the test fixture, verified the shipped-file and manifest/WASM/icon/URL contract, wrote `SHA256SUMS`, and created `target/strapd-guard-0.1.0.zip` plus its `.sha256` file. Both checksum files verified. |
| `make extension-typecheck` | Passed. `tsc --noEmit`. |
| `make extension-test` | Passed. 12 test files, 79 tests, covering settings normalization, pause expiry, detector-bit mapping, lazy diff reconstruction, insertion limits, stale responses, editor-state preservation, shadow-root selection and focus-safe insertion, non-editable paste boundaries, explicit fixture opt-in, committed-redaction counting, serialized session and settings writes, concurrent pause/badge state, trusted keyboard mapping, custom-site pattern/port/script-ID/grant/registration contracts, legacy wildcard-port registration, default-site recognition, bottom-sheet placement, silent auto mode with no overlay or layout read, Proof drawer toggle/self-test refresh, final identity copy, generated digest/CSP metadata, mode flows, and the real-WASM contract. |
| `make test` | Passed with the release CLI present. Confirms the default target now includes `extension-test`; the WebApp E2E stage passed 15 tests after `make cli-release`. |
| `make rust-fmt-check` | Passed. |
| `make webapp-lint` | Passed. |
| `openspec validate browser-extension-paste-intercept --strict` | Passed. |
| `openspec validate browser-extension-paste-intercept --type change --strict --archived` | Passed. |
| `git diff --check` | Passed. |

## Artifact checks

`extension/dist/` contains the built background, content, popup, fixture, manifest, WASM, sourcemaps, CSS, and local icons. `extension/release/` contains the minified production files, manifest, WASM, CSS, icons, and `SHA256SUMS`; it has no sourcemaps and no `test.html`/`test.js`.

- Real SHA-256: `7b7865146cda1313f798dc67bd33b6e436b09bd1cff14462900bf3937ba3f7a3`
- Generated digest matches `shasum -a 256 extension/dist/strapd_wasm_bg.wasm`.
- Built CSP: `script-src 'self' 'wasm-unsafe-eval'; connect-src 'none'; object-src 'self'`
- Default content script: `document_start` with `all_frames: true`; dynamic custom-site scripts use the same timing and frame scope.
- Exact Proof-drawer directive: `connect-src 'none'`
- Icons regenerated with `extension/render-icons.sh` from `extension/icons/icon.svg` at 16, 32, 48, and 128 px. `rsvg-convert` was unavailable, so the ImageMagick MVG fallback was used; pixel histograms confirm the navy fill `#0F172A`, blue border `#2563EB`, and white glyph `#FFFFFF` are present, and all PNGs have the exact target dimensions.
- External CDN/font/remote stylesheet/remote fetch references: 0.
- Host permissions are limited to the three default AI domains; broad HTTP(S) origins are optional only.
- Production ZIP entries: 13 files with no `test.html`, `test.js`, or source maps; `shasum -a 256 -c SHA256SUMS` and the ZIP `.sha256` check both passed.

## Design checks

- `SCAN_TEXT` carries detector flags; the worker returns findings, scrubbed text, and real elapsed time without an eager diff payload.
- Generated metadata is Git-ignored; typecheck and tests depend on the full build, and a contract test compares the generated digest and CSP directive to the built WASM and manifest.
- Zero-bit detector masks skip the corresponding WASM calls.
- Secret/PII detection and redaction remain in Rust/WASM; TypeScript only maps category bits, counts WASM placeholders, and lazily renders a placeholder-anchored display diff when a user opens it.
- The paste handler uses cached settings, never reads layout, and acts on Enter/Shift+Enter/Escape only through a pure resolver that ignores untrusted `keydown` events.
- Copy and generated metadata are ignored by Git; `make test` now includes `extension-test`, and `make lint` includes `extension-typecheck`.
- Paste targets are resolved through `composedPath()`, so editors in open shadow roots and same-origin frames are covered; stale scan responses preserve text typed while a scan was pending, and text insertion honors `maxlength` and native caret behavior.
- Custom sites use collision-free script IDs, register at `document_start` in all frames, show protected state only when both the effective-port grant and dynamic script registration are present, refresh while the popup is open, offer repair, roll back failed injection, and fail open in open tabs after removal. Settings mutations are serialized through one worker queue and the badge follows the final stored pause state.
- JWT owns both authorization and token categories, so disabling it leaves `Authorization: Bearer` text unchanged; placeholder-consuming redactions still increment the session count, including when mixed with fresh findings; the diff preview reconstructs the actual scrubbed text; the self-test reports a verified local scan without a network-call claim.
- Paste targets stop at `contenteditable="false"`, read-only, and disabled boundaries; the local fixture requires both its exact extension URL and a document marker; shadow-root editors use root selection or composed ranges with a target-bound fallback, and `execCommand` runs only when the target owns focus.
- Settings, badge state, custom sites, permission reconciliation, session counter, and offline self-test are wired through the popup and service worker.
- An independent correctness review found four issues; all were fixed, covered by regression tests, and re-verified by the same reviewer: stale paste responses no longer insert text, ask-mode redactions increment the proof counter, failed pause resume fails open with raw text, and concurrent counter writes are serialized.
- A second independent review found no P0/P1 defects in the strict-CSP/Proof work and one P2 stale-generated-metadata risk. It was resolved by ignoring generated metadata, making typecheck/tests depend on the full build, and adding a digest/CSP contract test; the same reviewer confirmed the fix with no new findings.
- A third independent review found a P1 legacy no-port registration gap and a P2 default-site add-button gap. Dynamic registrations now preserve omitted-port wildcard scope, and the popup recognizes pinned default hosts from generated explicit-port patterns; startup, popup, and pattern regressions cover both.
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

The original Chrome checks remain authoritative for the unchanged flows. The later review-driven changes were verified with build, typecheck, focused tests, and built-artifact audits; no additional Chrome retest was requested.

## Notes

No issue number was provided for this worktree, so the OpenSpec change uses the descriptive name `browser-extension-paste-intercept` instead of the `gh-<issue-number>-...` convention. All implementation, review, and manual Chrome checks are complete.
