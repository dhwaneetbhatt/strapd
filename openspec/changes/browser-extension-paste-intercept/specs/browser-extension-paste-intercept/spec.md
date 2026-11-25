## ADDED Requirements

### Requirement: Paste scanning stays local and scoped

The extension SHALL request only the `storage` permission and host access for `https://chatgpt.com/*`, `https://claude.ai/*`, and `https://gemini.google.com/*`. Paste scanning SHALL run in the extension service worker against the existing strapd browser WASM exports. No pasted text SHALL be sent over the network.

#### Scenario: Paste on a supported site
- **WHEN** a user pastes non-empty plain text into a textarea, text-like input, or contenteditable editor on a supported site
- **THEN** the extension prevents the native paste, scans the text locally, and either inserts it or opens the warning card

#### Scenario: Unsupported paste
- **WHEN** the extension is paused, the active element is not editable, or the clipboard has no plain text
- **THEN** the native paste proceeds unchanged

### Requirement: Service worker survives cold starts

The service worker SHALL register its message listener synchronously, SHALL NOT use top-level await, and SHALL lazily initialize and cache the WASM engine inside the scan handler. A failed initialization SHALL return a structured error response so the content script can fail open.

#### Scenario: Worker restarted between pastes
- **WHEN** Chrome terminates and wakes the idle service worker before a later paste
- **THEN** the next scan initializes WASM again and returns a normal scan response

### Requirement: Warning card is keyboard-first and isolated

Detected findings SHALL open a single warning card in a closed Shadow DOM with a summary, a collapsible scrubbed-text preview, and three actions: Paste scrubbed (Enter), Paste raw (Shift+Enter), and Cancel (Escape). The card SHALL trap those keys so the host chat form does not submit.

#### Scenario: Dirty paste
- **WHEN** the scan reports secrets or PII
- **THEN** the card opens with Paste scrubbed focused, and the chosen text is inserted after the card is removed and focus returns to the original editor

#### Scenario: Clean or failed scan
- **WHEN** the scan reports no findings or returns an error
- **THEN** the original text is inserted immediately without showing the card

### Requirement: Extension can be paused

The toolbar popup SHALL show an Enabled/Paused toggle persisted in `chrome.storage.local`. The content script SHALL cache the flag and keep it synchronized without awaiting storage in the paste handler.

#### Scenario: Pause takes effect immediately
- **WHEN** the user pauses the extension in the popup
- **THEN** subsequent pastes on supported sites proceed natively without scanning
