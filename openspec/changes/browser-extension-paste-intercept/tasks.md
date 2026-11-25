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
