# browser-extension-paste-intercept Specification

## Purpose

The browser extension protects AI chat composers at the paste boundary with local WASM detection, user-controlled redaction modes, explicit site scope, and proof that no pasted text is sent over the network.

## Requirements

### Requirement: Identity copy stays minimal

The manifest description SHALL be exactly `Scrub secrets and PII before pasting. Zero network access.` The popup header SHALL show only `strapd guard` in its brand block, with no subtitle and no top-right WASM badge. The Proof summary SHALL say `0 bytes sent · Fully offline`.

#### Scenario: Inspect the installed identity
- **WHEN** the manifest and toolbar popup are inspected
- **THEN** they use the exact description and offline wording above, with no `Local paste firewall` or `LOCAL WASM` label

### Requirement: Paste scanning stays local and scoped

The extension SHALL request `storage`, `scripting`, and `activeTab` permissions, host access only for `https://chatgpt.com/*`, `https://claude.ai/*`, and `https://gemini.google.com/*`, and optional host permissions only for user-added sites. Paste scanning SHALL run in the extension service worker against existing strapd browser WASM exports. No pasted text SHALL be sent over the network.

#### Scenario: Paste on a default protected site
- **WHEN** a user pastes non-empty plain text into a textarea, text-like input, or contenteditable editor on a default site
- **THEN** the extension prevents the native paste, scans the text locally, and follows the active paste mode

#### Scenario: Unsupported paste
- **WHEN** the clipboard contains files, has no plain text, or the target is not editable
- **THEN** the native paste proceeds unchanged

### Requirement: Three paste modes are persisted

The extension SHALL persist `mode` as `ask`, `auto`, or `paused` in `chrome.storage.local`. `ask` SHALL open a review card for dirty text, `auto` SHALL insert redacted text immediately with no overlay, and `paused` SHALL allow raw pastes for 15 minutes.

#### Scenario: Ask mode default
- **WHEN** the extension is first installed and a dirty paste occurs
- **THEN** the mode is `ask` and the bottom-docked review card opens before insertion

#### Scenario: Auto-redact from the review card
- **WHEN** the user enables "Always auto-redact without asking" and confirms Paste redacted
- **THEN** `mode` is immediately persisted as `auto` and later dirty pastes are scrubbed without opening the card

#### Scenario: Paused paste
- **WHEN** the user selects Paused and pastes within 15 minutes
- **THEN** the original text is inserted natively with no scan and the toolbar shows an `OFF` badge

#### Scenario: Pause expires
- **WHEN** a paste check or popup open observes `pauseUntil` in the past
- **THEN** the extension resumes the prior active mode, or `ask` when none was recorded, and clears the paused state

### Requirement: Local detector controls filter findings

The popup SHALL persist four detector flags (`apiKey`, `jwt`, `email`, `ip`), and each scan request SHALL carry those flags. The worker SHALL pass the derived category bits to the existing WASM sanitization and detection exports so disabled categories are neither reported nor redacted.

#### Scenario: Disable JWT detection
- **WHEN** the user turns off `jwt` and pastes a dummy JWT
- **THEN** the scan reports no JWT finding and the JWT remains unchanged in the inserted text

#### Scenario: Disable email detection
- **WHEN** the user turns off `email` and pastes an email address
- **THEN** the scan reports no email finding and the address remains unchanged

### Requirement: Custom protected sites are user-granted

The extension SHALL add a site only after a user-initiated `chrome.permissions.request`, SHALL register a persistent content script for the granted origin pattern, SHALL inject into the current tab without requiring a reload, and SHALL store the pattern in `customSites`. Default sites SHALL remain pinned, and removing a custom site SHALL unregister its script, revoke the origin permission, and remove it from storage.

#### Scenario: Add the active site
- **WHEN** the popup is opened on a new HTTP(S) site and the user accepts the permission prompt
- **THEN** the site appears as a removable protected-site pill and pastes on the open tab are intercepted without a reload

#### Scenario: Remove a custom site
- **WHEN** the user removes a custom site pill
- **THEN** its dynamic content script is unregistered, its origin permission is revoked, and it no longer appears after a browser restart

#### Scenario: Reconcile after restart
- **WHEN** the extension starts or is installed with stored custom sites
- **THEN** registered scripts and granted permissions are reconciled with `customSites` without adding new install-time host access

### Requirement: Review card is bottom-docked and keyboard safe

For dirty text in `ask` mode, the extension SHALL open one closed Shadow DOM card fixed to the bottom center of the viewport, capped at 46vh with its own overflow scrolling. It SHALL show `strapd guard`, finding counts as category pills, a collapsible raw-to-redacted diff, and the actions Paste redacted (Enter), Paste raw (Shift+Enter), and Cancel (Esc). The card SHALL trap those keys so the host form does not submit, and it SHALL NOT measure the active editor.

#### Scenario: Dirty paste in ask mode
- **WHEN** the scan reports enabled findings
- **THEN** the card opens with Paste redacted focused and the selected text is inserted only after the card is removed and focus returns to the editor

#### Scenario: Bottom sheet stays compact
- **WHEN** the review card opens
- **THEN** it is centered along the bottom edge, capped at 46vh, and scrolls internally instead of growing with the pasted text

#### Scenario: Diff toggle keeps keyboard semantics
- **WHEN** the diff summary has focus and the user presses Enter
- **THEN** the diff expands or collapses instead of pasting text

#### Scenario: Clean or failed scan
- **WHEN** the scan reports no findings or returns an error
- **THEN** the original text is inserted immediately with no review card

### Requirement: Silent redaction has no overlay

In `auto` mode, dirty text SHALL be scrubbed and inserted without blocking the editor and with no popup, toast, timer, diff, or undo affordance. The content script SHALL NOT read layout on the auto path, and no insertion record or raw-replacement helper SHALL be exposed for that path.

#### Scenario: Auto-redact without UI
- **WHEN** a dirty paste is auto-scrubbed
- **THEN** only the redacted text is inserted and no Shadow DOM overlay is attached

#### Scenario: No undo affordance
- **WHEN** the user wants the original text after an auto-scrubbed paste
- **THEN** the extension offers no in-page undo control

#### Scenario: No layout read on the auto path
- **WHEN** the active mode is `auto`
- **THEN** the paste handler inserts the scrubbed text without calling `getBoundingClientRect()`

### Requirement: Privacy proof is live and local

The popup SHALL expose a Proof drawer that reports the exact active `connect-src` directive, origins obtained live from `chrome.permissions.getAll()`, the build-time SHA-256 of the packaged WASM, a session-only blocked counter, and a self-test result from a real `SCAN_TEXT` round trip against a dummy secret payload. The extension SHALL not fetch any external script, font, or stylesheet.

#### Scenario: Open the proof drawer
- **WHEN** the user expands Proof
- **THEN** the drawer shows the active CSP directive, the real granted origin list and count, the generated WASM digest, and the current session counter

#### Scenario: Hide and refresh the proof drawer
- **WHEN** the user collapses Proof or runs the offline self-test
- **THEN** the audit table is hidden when collapsed and populated without a second toggle when the self-test runs

#### Scenario: Strict connect policy
- **WHEN** the built manifest and Proof drawer are inspected
- **THEN** both report `connect-src 'none'` and no other `connect-src` source is declared

#### Scenario: Run the offline self-test
- **WHEN** the user selects Run Offline Self-Test with the network disabled
- **THEN** the worker scans the dummy payload locally, reports a nonzero finding count and measured round-trip milliseconds, and the popup shows the verified result

#### Scenario: Session counter lifetime
- **WHEN** the browser restarts
- **THEN** the blocked counter starts at zero because it is stored only in RAM

### Requirement: Service worker survives cold starts

The service worker SHALL register its message listener synchronously, SHALL NOT use top-level await, and SHALL lazily initialize and cache the WASM engine inside the scan handler. A failed initialization SHALL return a structured error response so the content script can fail open.

#### Scenario: Worker restarted between pastes
- **WHEN** Chrome terminates and wakes the idle service worker before a later paste
- **THEN** the next scan initializes WASM again and returns a normal scan response

### Requirement: UI is self-contained and theme-aware

The popup and all Shadow DOM surfaces SHALL use local CSS only, follow the browser's light/dark preference, and use system UI plus monospace font stacks. No CDN URL, external font link, or remote stylesheet SHALL appear in the built extension.

#### Scenario: Dark browser preference
- **WHEN** the browser prefers dark mode
- **THEN** the popup and intercept card use the dark token set without loading external assets

#### Scenario: Built artifact audit
- **WHEN** the built `extension/dist/` is inspected
- **THEN** no external CDN or font URL is present and all manifest icon references are local PNG files derived from the bundled SVG master
