## Context

The extension must run in a Manifest V3 service worker that Chrome can terminate at any time. Content scripts run in an isolated world beside rich-text editors such as ProseMirror and Quill. The existing browser WASM package is built with wasm-pack's bundler target for the WebApp, while a service worker needs a directly fetchable module and WASM binary.

## Decisions

- Build a separate `--target web` WASM artifact into `extension/wasm/` from the same `crates/wasm` crate. The service worker bundles the generated JS glue with esbuild and calls the generated `init()` with `chrome.runtime.getURL("strapd_wasm_bg.wasm")`.
- Register `chrome.runtime.onMessage` synchronously and lazy-initialize a cached WASM promise inside the handler so a cold-started worker recovers.
- Derive secret finding counts from placeholder deltas between the original and `sanitize_secrets` output. PII finding counts come from the packed `detect_pii` triples. Scrubbed text is produced by running `sanitize_pii` over the secret-scrubbed text.
- Keep paste handling synchronous until `preventDefault()` and `stopImmediatePropagation()` have run. The enabled flag is cached in memory and synchronized with `chrome.storage.onChanged`.
- Insert into text controls by replacing the captured selection and dispatching an `InputEvent`. Insert into contenteditable editors with `document.execCommand("insertText", …)` so host editor state updates, with a Range fallback.
- Render the warning card in a closed Shadow DOM on `document.documentElement`, with a window capture keydown listener for Enter, Shift+Enter, and Escape.

## Risks

- Site editor behavior can change. The contenteditable insertion path keeps a Range fallback and is verified with the local fixture.
- Chrome may suspend the worker between pastes. The lazy initialization path and cold-start test cover this.
- Placeholder counting can be confused by user text that already contains placeholders. Subtracting original placeholder counts avoids counting pre-existing markers.
