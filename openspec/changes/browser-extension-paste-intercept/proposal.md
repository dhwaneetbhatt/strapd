## Why

People paste credentials and personal data into AI chats before noticing what they shared. strapd already detects and masks secrets and PII locally in browser WASM, but that protection is not present at the paste boundary of the most common AI chat sites.

## What Changes

- Add a standalone Manifest V3 extension under `extension/` that intercepts plain-text paste events on chatgpt.com, claude.ai, and gemini.google.com.
- Scan pasted text in the extension service worker using the existing browser WASM exports. No text leaves the browser and the extension requests no network permissions.
- Show a closed Shadow DOM warning card with keyboard-first actions to paste scrubbed text, paste raw text, or cancel.
- Add an Enabled/Paused popup toggle persisted in `chrome.storage.local`.
- Add `make extension-build` and a local `extension/test.html` smoke-test fixture.

## Capabilities

### New Capabilities

- `browser-extension-paste-intercept`: Paste-time secret and PII scanning, warning UI, editor insertion, and extension controls.

### Modified Capabilities

None.

## Impact

New `extension/` workspace, root Makefile target, `.gitignore` entries, and extension-specific tests. No Rust crate changes. The extension reuses the existing `detect_pii`, `sanitize_secrets`, and `sanitize_pii` WASM exports. Existing CLI, WebApp, and Pipes behavior is unchanged.
