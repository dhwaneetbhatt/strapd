# Verification

## Commands

| Command | Result |
| --- | --- |
| `make extension-build` | Passed. Built `extension/wasm/` with wasm-pack `--target web`, installed dependencies, and produced `extension/dist/`. |
| `make extension-typecheck` | Passed. `tsc --noEmit`. |
| `make extension-test` | Passed. 4 test files, 24 tests, including real-WASM contract checks. |
| `make rust-fmt-check` | Passed. |
| `make webapp-lint` | Passed after installing the WebApp workspace dependencies. |
| `make rust-test` | Passed. |
| `openspec validate browser-extension-paste-intercept --strict` | Passed. |

## Artifact checks

`extension/dist/` contains:

- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `popup.js`
- `strapd_wasm_bg.wasm`
- `test.html`
- `test.js`

## WASM bridge check

`tests/wasm-contract.test.ts` initializes the real `extension/wasm` artifact and asserts the placeholder strings and PII category bit that `src/scan.ts` duplicates, so Rust drift fails a test instead of silently bypassing the warning card. `make extension-test` builds WASM first so the contract test always runs.

A Node harness imported `extension/wasm/strapd_wasm.js`, initialized it with the packaged WASM bytes, and confirmed:

- `sanitize_secrets` redacts an AWS access key and a JWT.
- `detect_pii` returns packed triples for an email, phone number, and payment card.
- `sanitize_pii` replaces those PII values with category placeholders.
- Clean text returns unchanged.

A second Node harness mocked `chrome.runtime` and `fetch` against `extension/dist/background.js` and confirmed:

- The message listener is registered at module load.
- `SCAN_TEXT` responses have the expected `ok`, `clean`, `findings`, and `scrubbedText` fields.
- A second scan reuses the cached WASM initialization.
- Non-scan messages return `false`.

## Manual checks remaining

The Chrome-specific load-unpacked flow and Service Worker cold-start recovery are documented in `extension/README.md`. They require a local Chrome profile and are not automated in this change.

## Notes

No issue number was provided for this worktree, so the OpenSpec change uses the descriptive name `browser-extension-paste-intercept` instead of the `gh-<issue-number>-...` convention.
