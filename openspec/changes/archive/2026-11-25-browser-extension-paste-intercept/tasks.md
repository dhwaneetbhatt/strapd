## 1. Scaffold and WASM bridge

- [x] 1.1 Create the `extension/` workspace with package metadata, TypeScript config, Manifest V3 manifest, and esbuild build script.
- [x] 1.2 Implement shared scan types and pure finding aggregation over `detect_pii` and `sanitize_secrets`/`sanitize_pii`.
- [x] 1.3 Implement the service worker with synchronous message registration and a cached lazy WASM initialization promise.

## 2. Paste interception and controls

- [x] 2.1 Implement capture-phase paste interception with a cached enabled flag.
- [x] 2.2 Implement text control and contenteditable insertion with selection restoration and input events.
- [x] 2.3 Implement the popup Enabled/Paused toggle backed by `chrome.storage.local`.

## 3. Warning card

- [x] 3.1 Implement the closed Shadow DOM warning card with summary, scrubbed preview, and keyboard-first actions.
- [x] 3.2 Wire clean, dirty, error, and replacement flows into the paste handler.

## 4. Build, tests, and verification

- [x] 4.1 Add `make extension-build` and ignore generated extension output.
- [x] 4.2 Add the local `extension/test.html` fixture with copyable payloads.
- [x] 4.3 Add unit tests for text control insertion, scan finding aggregation, paste flows, and the real-WASM placeholder/category contract.
- [x] 4.4 Run the extension build, typecheck, tests, and required repository checks.

## 5. Branding, manifest, and shared settings

- [x] 5.1 Rename the extension to `strapd guard`, update its description, and add local shield/`S` icons at 16, 32, 48, and 128px.
- [x] 5.2 Add `ExtensionSettings`, `PasteMode`, `DetectorSettings`, settings normalization, legacy `enabled` migration, pause-expiry helpers, and session-counter helpers.
- [x] 5.3 Add strict MV3 CSP with an extension-local `connect-src` directive, `storage`/`scripting`/`activeTab` permissions, the three default hosts, and optional HTTP(S) hosts.
- [x] 5.4 Generate `src/generated-meta.ts` from the real WASM SHA-256 during `build.mjs` and copy icons into `dist/`.
- [x] 5.5 Add real scan timing, detector-bit mapping, zero-bit WASM short-circuits, and a lazy placeholder-anchored diff builder kept out of the paste path.

## 6. Background service worker

- [x] 6.1 Accept detector flags in `SCAN_TEXT`, return `elapsedMs` and scrubbed text without an eager diff payload, and record committed redactions in `chrome.storage.session`.
- [x] 6.2 Handle `RESUME_PAUSED`, persist the resumed mode, and keep the toolbar badge synchronized with `mode`/`pauseUntil`.
- [x] 6.3 Reconcile custom sites with `chrome.permissions.getAll()` and `chrome.scripting.getRegisteredContentScripts()` on install and startup.

## 7. Redesigned popup

- [x] 7.1 Build the 348px `popup.html`/`popup.css` from the mockup with self-contained light/dark tokens and no external assets.
- [x] 7.2 Wire mode cards, detector chips, and custom-site add/remove flows, including dynamic script registration and immediate injection.
- [x] 7.3 Implement the Proof drawer with live permissions, WASM hash, session counter, exact CSP directive, and a real offline self-test button.

## 8. Content script and overlays

- [x] 8.1 Cache structured settings without awaiting storage inside the paste handler, expire stale pauses, and keep the double-injection sentinel.
- [x] 8.2 Implement the closed Shadow DOM intercept card with pills, diff toggle, keyboard actions, and the always-auto checkbox.
- [x] 8.3 Insert auto-mode redactions with no overlay, timer, diff, or undo control.
- [x] 8.4 Keep `insertText` as a void operation with no insertion record or raw-replacement helper.

## 9. Tests and verification

- [x] 9.1 Add tests for settings normalization, pause expiry, detector filtering, diff segments, insertion, bottom-sheet placement, and mode flows.
- [x] 9.2 Update the local fixture and documentation for `strapd guard`, three modes, custom sites, and the proof drawer.
- [x] 9.3 Run `make extension-build`, `make extension-typecheck`, `make extension-test`, repository checks, and a built-artifact audit for external URLs and real WASM hash.
- [x] 9.4 Complete the remaining manual Chrome smoke checks for ask, auto, custom-site persistence, cold start, and network-disabled offline self-test. The independent review and the strict-CSP/Proof checks are complete.

## 10. Feedback fixes

- [x] 10.1 Replace the side-gutter card and toast with a compact bottom-docked review sheet for ask mode only.
- [x] 10.2 Remove the auto-mode popup entirely, including diff, timer, dismiss, and Paste Raw controls.
- [x] 10.3 Remove the insertion record and raw-replacement helper used by auto-mode undo.
- [x] 10.4 Update UI tests and user docs, then re-run the extension checks and artifact audit.

## 11. Proof and CSP hardening

- [x] 11.1 Ship `connect-src 'none'` after Chrome verification of the offline self-test and paste redaction.
- [x] 11.2 Make the Proof drawer hide with its `hidden` attribute and refresh the audit table when Run Offline Self-Test is clicked.
- [x] 11.3 Add popup regression tests for drawer toggling, self-test refresh, and the strict CSP directive.
- [x] 11.4 Make typecheck and tests depend on the full extension build, ignore generated metadata, and verify its digest/CSP against the built artifact.

## 12. Final identity copy

- [x] 12.1 Set the manifest description to `Scrub secrets and PII before pasting. Zero network access.`
- [x] 12.2 Remove the popup subtitle and top-right WASM badge, including their unused CSS.
- [x] 12.3 Change the Proof summary to `0 bytes sent · Fully offline` and add a regression test for the final copy.

## 13. Final logo

- [x] 13.1 Add the supplied shield-and-`S` SVG as the local icon master.
- [x] 13.2 Add `extension/render-icons.sh`, preferring `rsvg-convert` and falling back to ImageMagick MVG commands because MSVG drops SVG strokes. Regenerate the 16/32/48/128 PNGs with it.
- [x] 13.3 Rebuild `extension/dist/` and verify the shipped icon sizes and local-only artifact.

## 14. PR review hardening

- [x] 14.1 Require trusted keyboard events and cover the pure keyboard mapping.
- [x] 14.2 Register custom-site scripts at `document_start` in all frames, preserve explicit ports, avoid script-ID collisions, and make current-tab wording honest about reload-limited protection.
- [x] 14.3 Treat only Chrome-granted custom sites as protected, roll back failed injection, and fail open in open tabs after removal.
- [x] 14.4 Cover editors in open shadow roots and same-origin frames, preserve edits during pending scans, honor `maxlength`/caret semantics, and avoid expired-pause overwrites.
- [x] 14.5 Separate JWT/Auth redaction, count placeholder-consuming redactions, reconstruct diff previews, and correct self-test wording.
- [x] 14.6 Wire extension tests into default `make test` and add targeted regressions for site patterns, keyboard trust, detector bits, diff reconstruction, redaction counts, and insertion limits.

## 15. Production package and final review fixes

- [x] 15.1 Add `make extension-package` with minification, no sourcemaps, no test fixture, `SHA256SUMS`, artifact contract checks, and a versioned ZIP with checksum.
- [x] 15.2 Require both permission grant and script registration for protected custom sites, refresh permission changes while the popup is open, and offer repair.
- [x] 15.3 Use root selection or composed ranges for shadow-root capture and target-bound Range fallback for insertion; guard `execCommand` with target focus ownership.
- [x] 15.4 Serialize worker settings mutations, derive the badge from the final stored pause state, and match Chrome's omitted-port wildcard semantics with explicit effective grant patterns.
- [x] 15.5 Gate the local fixture by exact URL and marker, stop composed editable-target lookup at non-editable boundaries, and count consumed placeholders beside fresh findings with real WASM coverage.
- [x] 15.6 Simplify only the extension section of the usage guide, update the extension guide and OpenSpec artifacts, and add focused regressions for the new fixes.
- [x] 15.7 Preserve wildcard-port matches for legacy no-port custom sites and recognize pinned default hosts from generated explicit-port patterns.
