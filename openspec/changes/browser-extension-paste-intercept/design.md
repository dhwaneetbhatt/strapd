## Context

The committed extension already intercepts paste events in an isolated content script and scans them in a cold-start-safe MV3 service worker using a separate `wasm-pack --target web` artifact. The supplied mockup pins a 348px developer-tool aesthetic: neutral layered surfaces, blue/emerald/amber signals, monospace metadata, closed Shadow DOM overlays, and an auditable privacy footer. All extension assets must remain local so pasted text never reaches the network.

## Goals / Non-Goals

**Goals:**

- Preserve local-only detection while adding review, silent-redact, and paused paste paths.
- Let users choose detectors and extra protected sites without requesting broad install-time access.
- Make privacy claims auditable from the popup using live Chrome state and real build metadata.
- Keep paste interception synchronous before `preventDefault()` and keep the service worker listener synchronous at module load.

**Non-Goals:**

- No copy of the mockup workbench, name switcher, chat simulator, Tailwind CDN, or Google Fonts links.
- No Rust changes, custom regex rules, file/paste handlers, offscreen document, pre-submit scanning, reversible redaction history, or any overlay/undo affordance in auto mode.
- No telemetry, remote configuration, or network requests to non-extension origins.

## Decisions

- **Settings model.** `ExtensionSettings` lives in `chrome.storage.local`; `blockedCount` and the mode to resume after a timed pause live in `chrome.storage.session`. Legacy `enabled: false` is normalized to a paused mode; `true` or absent data normalizes to `ask`. The content script caches settings and treats an unread cache as fail-open, so a paste before the first storage callback is never intercepted on an unknown preference.
- **Detector mapping.** Use existing Rust category bits, not new regexes: `apiKey` maps to all non-token secret categories (`1|2|4|8|16|32|128`), `jwt` maps to token category `64`, `email` maps to all PII except IP (`2|4|8|16|32`), and `ip` maps to PII category `1`. `SCAN_TEXT` carries the four booleans; the worker derives the two bit masks and reuses `sanitize_secrets`, `detect_pii`, and `sanitize_pii`.
- **Custom sites.** Install-time hosts remain the three default AI domains. `chrome.permissions.request` grants an optional origin from a popup click, `chrome.scripting.registerContentScripts` persists the content script across sessions, and `executeScript` protects the current tab without a reload. `onInstalled`/`onStartup` reconcile stored sites with live permissions and registrations. A window sentinel prevents double injection.
- **CSP and WASM loading.** The packaged `wasm-pack` glue loads its local binary and the real offline self-test passes with `connect-src 'none'` in the user's Chrome verification. Ship `connect-src 'none'`, display that exact directive in the proof drawer, and rely on `script-src 'self' 'wasm-unsafe-eval'` for local WASM compilation. No external origin is permitted by CSP or permissions; the build check asserts that no CDN URL appears in `dist/`.
- **Build metadata.** `build.mjs` computes the real SHA-256 of `strapd_wasm_bg.wasm` with Node `crypto`, reads the manifest CSP directive, and writes `src/generated-meta.ts`. Generated metadata is ignored by Git; typecheck and tests depend on the full build so the file is never stale or absent, and a contract test compares the constant to the actual binary digest and manifest directive.
- **Hot path budget.** The worker returns only findings, scrubbed text, and `elapsedMs`. Detector masks of zero skip the corresponding WASM calls, and the content script never measures the editor: ask mode docks a fixed bottom sheet, and auto mode inserts without any UI. No diff is built during paste handling.
- **Lazy diff.** When the user opens Show diff, the UI derives capped segments by anchoring on the WASM redaction placeholders already present in `scrubbedText`. This is a linear placeholder scan, not a Myers character diff, and it never duplicates detection rules in TypeScript. Auto mode has no diff surface because it has no overlay.
- **UI surfaces.** The ask-mode intercept card is a compact bottom sheet: fixed to the bottom center, capped at 46vh, independently scrollable, and never measured against the editor. Auto mode renders nothing. The only overlay uses `attachShadow({ mode: "closed" })`, `textContent` for all dynamic values, and a `2147483647` z-index; its Enter/Shift+Enter/Escape handling is focus-aware so the diff toggle and checkbox keep their native behavior.
- **Insertion path.** `insertText` restores the captured selection, inserts text, dispatches an `InputEvent`, and returns nothing. No insertion record or raw-replacement helper remains. Ask mode inserts only after an explicit choice; auto mode inserts scrubbed text immediately.
- **Pause state.** Selecting Paused stores `pauseUntil` and the prior active mode. Any paste check or popup open that finds an expired pause sends a `RESUME_PAUSED` message and continues with the prior mode; the worker persists the change and clears the badge.
- **Proof drawer.** The drawer uses the `hidden` attribute with an explicit `.proof-drawer[hidden] { display: none; }` rule so its grid display cannot override hiding. Opening the drawer and running the self-test both enqueue one serialized proof refresh, so the audit table populates immediately without a second toggle.
- **Identity copy.** The manifest uses the exact short description `Scrub secrets and PII before pasting. Zero network access.` The popup header drops the subtitle and WASM badge so only `strapd guard` remains; the Proof summary says `Fully offline`. Unused subtitle/badge CSS is removed with the markup.
- **Icon source.** Keep the supplied SVG as `extension/icons/icon.svg` and rasterize it locally to 16/32/48/128 PNGs. `extension/render-icons.sh` uses `rsvg-convert` when available. ImageMagick's MSVG renderer drops SVG stroke attributes, so the fallback replays the same paths as MVG draw commands before resizing; this preserves the blue border and white glyph. The manifest and build copy only local PNGs into the shipped icon references.
- **Theme.** Popup and Shadow DOM styles repeat a small token set from the mockup under `:root` and `@media (prefers-color-scheme: dark)`, using system UI and monospace stacks only.

## Risks / Trade-offs

- Chrome may deny optional origin requests or dynamic script registration. → Popup surfaces the denial, keeps stored settings unchanged, and default domains still work.
- A bottom sheet can cover a bottom-anchored composer. → It is used only in ask mode, capped at 46vh with its own scroll, and dismissed with Enter, Shift+Enter, or Escape; auto mode has no overlay at all.
- A large paste could make diff rendering expensive. → Diff generation is deferred until the user opens it, capped, and falls back to a plain preview; detection and sanitization remain uncapped in WASM.
- A stricter `connect-src 'none'` could block a same-extension WASM fetch in some Chrome versions. → The user verified the real self-test and paste redaction with `'none'`; the proof drawer reports the exact directive, and the build check verifies no external URLs in the shipped artifact.
- A paused tab restored from disk may have stale cached settings. → Storage change listeners update every open tab, and an unknown cache fail-opens native paste.

## Migration Plan

1. Read legacy `enabled` during settings normalization and map it to `ask` or a timed `paused` state.
2. Build the new worker, popup, content script, icons, and generated metadata before loading the unpacked extension.
3. Existing fixtures and tests continue to work with the new `SCAN_TEXT` payload defaults.

## Open Questions

None.
