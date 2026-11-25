# strapd guard

`strapd guard` is a local Manifest V3 paste firewall. It scans plain-text pastes in the extension service worker with the same browser WASM used by strapd, then applies the selected mode before the text reaches an AI chat composer. Pasted text is never sent over the network.

## Build

From the repository root:

```bash
make extension-build
```

This builds a `--target web` WASM artifact into `extension/wasm/`, installs the extension workspace dependencies, generates `src/generated-meta.ts` from the real WASM SHA-256, and writes a self-contained unpacked extension to `extension/dist/`. Generated directories are ignored by Git.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select `extension/dist/`.
4. Open the toolbar popup to confirm the mode and protected sites.

## Paste modes

The popup persists `ExtensionSettings` in `chrome.storage.local`:

- **Ask before pasting** (default): dirty text opens a compact review card docked at the bottom of the screen. Use **Paste redacted** (`Enter`), **Paste raw** (`Shift+Enter`), or **Cancel** (`Esc`). **Always auto-redact without asking** switches to silent mode immediately.
- **Auto-redact (Silent)**: dirty text is scrubbed and inserted without blocking and with no popup, toast, diff, timer, or undo control.
- **Paused**: raw pastes pass through for 15 minutes and the toolbar shows an amber `OFF` badge. On the next paste or popup open, an expired pause returns to the previous mode, or `ask`.

Four detector chips control `apiKey`, `jwt`, `email`, and `ip`. Disabled categories are neither reported nor redacted.

## Protected sites

The default host permissions cover `chatgpt.com`, `claude.ai`, and `gemini.google.com`. On any other HTTP(S) site, open the popup and choose **+ Add &lt;hostname&gt;**. Chrome asks for that origin; once granted, `strapd guard` registers a persistent content script and injects immediately into the open tab. Use the `×` on a custom-site pill to unregister the script and revoke the origin permission. Custom sites are reconciled with Chrome permissions on install and startup.

## Proof drawer

Expand **Proof** in the popup to see:

- the exact active `connect-src 'none'` directive from the built manifest;
- granted origins read live from `chrome.permissions.getAll()`;
- the generated WASM SHA-256, with click-to-copy;
- a RAM-only `blockedCount` from `chrome.storage.session`;
- **Run Offline Self-Test**, which sends a dummy AWS key, JWT, email, and IP through the real `SCAN_TEXT` path and reports the finding count and measured round-trip time.

## Manual test fixture

1. Find the extension ID on `chrome://extensions`.
2. Open `chrome-extension://<extension-id>/test.html`.
3. Copy a dummy payload and paste it into the textarea or contenteditable editor.
4. Verify the active mode's bottom-docked card, diff, and keyboard actions, or the silent auto insertion.

The fixture imports the same interceptor module as the content script. To verify recovery after Chrome stops the idle service worker, paste once, stop the worker from `chrome://serviceworker-internals`, then paste again.

## Scope

- Plain-text paste interception only; images, files, and drag-and-drop are untouched.
- No pre-submit scanning, offscreen document, remote config, or external assets.
- The service worker only loads its packaged WASM file from its own extension origin.
