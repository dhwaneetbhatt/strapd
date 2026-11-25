# strapd browser extension

A minimal Manifest V3 Chrome extension that scans plain-text pastes on ChatGPT, Claude, and Gemini before the text reaches the chat input. Detection and sanitization reuse the existing strapd browser WASM exports. The extension has no network permissions and pasted text never leaves the browser.

## Build

From the repository root:

```bash
make extension-build
```

This builds a `--target web` WASM artifact into `extension/wasm/`, installs the extension workspace dependencies, and writes a self-contained unpacked extension to `extension/dist/`. The generated directories are ignored by Git.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select `extension/dist/`.
4. Open the toolbar popup to confirm the extension is **Enabled**.

## Use

Paste text into a textarea, text-like input, or contenteditable editor on `chatgpt.com`, `claude.ai`, or `gemini.google.com`.

- Clean text is inserted immediately.
- Detected secrets or PII open a warning card with **Paste scrubbed** (Enter), **Paste raw** (Shift+Enter), and **Cancel** (Esc).
- If the scan fails, the original paste is inserted so the extension never blocks the editor.
- Pause scanning from the toolbar popup at any time.

## Manual test fixture

1. Find the extension ID on `chrome://extensions`.
2. Open `chrome-extension://<extension-id>/test.html`.
3. Copy a dummy payload and paste it into the textarea or contenteditable editor.
4. Verify the warning card, the scrubbed preview, and each keyboard action.

The fixture imports the same interceptor module as the content script, so it exercises paste interception, WASM scanning, and the warning card without needing an AI chat account.

## Cold-start check

Chrome can terminate the service worker while the extension is idle. To verify recovery:

1. Paste once to warm the worker.
2. Open `chrome://serviceworker-internals`, find the extension service worker, and stop it. Alternatively, wait for Chrome to idle it.
3. Paste again. The scan should complete because WASM initialization is lazy and cached inside the message handler.

## Scope

- Plain-text paste interception only. Images, files, and drag-and-drop are not intercepted.
- No offscreen document, reversible redaction, custom rules, or pre-submit scanning.
- No network access. The service worker only fetches its own packaged WASM file.
