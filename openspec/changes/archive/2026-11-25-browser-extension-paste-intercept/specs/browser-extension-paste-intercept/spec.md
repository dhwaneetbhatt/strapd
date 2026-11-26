## Purpose

The browser extension protects AI chat composers at the paste boundary with local WASM detection, user-controlled redaction modes, explicit site scope, and proof that no pasted text is sent over the network.

## ADDED Requirements

### Requirement: Identity copy stays minimal

The manifest description SHALL be exactly `Scrub secrets and PII before pasting. Zero network access.` The popup header SHALL show only `strapd guard` in its brand block, with no subtitle and no top-right WASM badge. The Proof summary SHALL say `0 bytes sent · Fully offline`.

#### Scenario: Inspect the installed identity
- **WHEN** the manifest and toolbar popup are inspected
- **THEN** they use the exact description and offline wording above, with no `Local paste firewall` or `LOCAL WASM` label

### Requirement: Paste scanning stays local and scoped

The extension SHALL request `storage`, `scripting`, and `activeTab` permissions, host access only for `https://chatgpt.com/*`, `https://claude.ai/*`, and `https://gemini.google.com/*`, and optional host permissions only for user-added sites. Paste scanning SHALL run in the extension service worker against existing strapd browser WASM exports. No pasted text SHALL be sent over the network. Interception SHALL cover editors in open shadow roots and same-origin frames whose URL matches a protected pattern. An event whose composed path reaches a `contenteditable="false"`, read-only, or disabled boundary SHALL be left to native paste. The local test fixture SHALL opt in explicitly by exact `chrome-extension://` URL and a document marker; production host matching SHALL NOT be broadened for the fixture.

#### Scenario: Paste on a default protected site
- **WHEN** a user pastes non-empty plain text into a textarea, text-like input, or contenteditable editor, including one inside an open shadow root or same-origin frame, on a default site
- **THEN** the extension prevents the native paste, scans the text locally, and follows the active paste mode

#### Scenario: Unsupported paste
- **WHEN** the clipboard contains files, has no plain text, or the target is not editable
- **THEN** the native paste proceeds unchanged

#### Scenario: Paste inside a non-editable island
- **WHEN** paste targets a node inside a `contenteditable="false"`, read-only, or disabled boundary inside an otherwise editable ancestor
- **THEN** the native paste proceeds and the ancestor is not used as the intercept target

#### Scenario: Local fixture without opt-in
- **WHEN** a paste occurs on the exact `chrome-extension://` fixture URL without the fixture document marker
- **THEN** the native paste proceeds

### Requirement: Three paste modes are persisted

The extension SHALL persist `mode` as `ask`, `auto`, or `paused` in `chrome.storage.local`. `ask` SHALL open a review card for dirty text, `auto` SHALL insert redacted text immediately with no overlay, and `paused` SHALL allow raw pastes for 15 minutes. All settings mutations SHALL be serialized through one worker queue that re-reads storage immediately before each write, so expired-pause recovery cannot overwrite a newer mode change and the toolbar badge reflects the final stored pause state.

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

#### Scenario: Pause expires after a newer settings change
- **WHEN** a paused tab observes expiry after another surface has already selected a different mode
- **THEN** recovery keeps the newer mode and does not restore the recorded pre-pause mode

#### Scenario: Concurrent settings changes keep the final badge
- **WHEN** resume, mode selection, and storage-sync updates overlap in the service worker
- **THEN** each operation reads the latest stored settings and the badge reflects the last stored pause state

### Requirement: Local detector controls filter findings

The popup SHALL persist four detector flags (`apiKey`, `jwt`, `email`, `ip`), and each scan request SHALL carry those flags. The worker SHALL pass the derived category bits to the existing WASM sanitization and detection exports so disabled categories are neither reported nor redacted. The `jwt` flag SHALL own both token and authorization-header secret categories; the `apiKey` flag SHALL NOT redact authorization headers.

#### Scenario: Disable JWT detection
- **WHEN** the user turns off `jwt` and pastes a dummy JWT
- **THEN** the scan reports no JWT finding and the JWT remains unchanged in the inserted text

#### Scenario: Disable JWT detection with an authorization header
- **WHEN** `jwt` is off and the text contains `Authorization: Bearer <JWT>`
- **THEN** no Auth or Token finding is reported and the header remains unchanged

#### Scenario: Disable email detection
- **WHEN** the user turns off `email` and pastes an email address
- **THEN** the scan reports no email finding and the address remains unchanged

### Requirement: Custom protected sites are user-granted

The extension SHALL add a site only after a user-initiated `chrome.permissions.request`, using the URL's explicit port or the scheme default port when the URL omits it. A stored pattern without a port SHALL match any port for its scheme; a pattern with an explicit port SHALL match only that port. Persisted no-port patterns SHALL keep the omitted port in dynamic script matches so their wildcard-port scope survives restarts. It SHALL register a persistent `document_start` content script with `allFrames` enabled for the granted pattern, SHALL inject into the current tab without requiring a reload, and SHALL store the pattern in `customSites`. A custom-site pill SHALL be marked protected only while `chrome.permissions.getAll()` reports that exact pattern as granted and `chrome.scripting.getRegisteredContentScripts()` reports its registered script. The popup SHALL refresh site state when permissions change while it is open and SHALL offer repair when either the grant or registration is missing. Default sites SHALL remain pinned, and the popup SHALL recognize a pinned default host from a generated explicit-port pattern. Removing a custom site SHALL unregister its script, revoke the origin permission, remove it from storage, and make already-open tabs stop intercepting on their next paste. Registration or injection failure SHALL roll back the new script and permission without changing `customSites`.

#### Scenario: Add the active site
- **WHEN** the popup is opened on a new HTTP(S) site, including one with an explicit port, and the user accepts the permission prompt
- **THEN** the exact origin is granted, a `document_start` all-frames script is registered, the site appears as a removable protected-site pill, the open tab is injected, and the popup states that page scripts which already captured paste may require a reload

#### Scenario: Ungranted custom site
- **WHEN** a stored custom-site pattern is no longer granted by Chrome
- **THEN** its pill shows that access is needed, the popup offers to grant it again, and the site is not counted as protected

#### Scenario: Missing script registration
- **WHEN** a stored custom site is granted but its dynamic content script is not registered
- **THEN** its pill shows that repair is needed, the popup offers to repair it, and the site is not counted as protected

#### Scenario: Permission changes while the popup is open
- **WHEN** a permission is granted or removed while the popup stays open
- **THEN** the site list and add-site button refresh without reopening the popup

#### Scenario: Omitted-port and explicit-port grants
- **WHEN** a user adds `http://localhost/` and another user adds `http://localhost:3000/`
- **THEN** the first grant uses `http://localhost:80/*` and does not protect `http://localhost:3000/`, and the second grant uses `http://localhost:3000/*`

#### Scenario: Legacy no-port custom site after restart
- **WHEN** the extension reconciles a stored custom-site pattern without a port
- **THEN** its dynamic script keeps the omitted-port match pattern and continues to cover non-default ports

#### Scenario: Default site with an explicit port
- **WHEN** the popup opens on a pinned default host with an explicit port
- **THEN** the add-site button shows `Protected` and no redundant custom site is offered

#### Scenario: Remove a custom site
- **WHEN** the user removes a custom site pill
- **THEN** its dynamic content script is unregistered, its origin permission is revoked, it no longer appears after a browser restart, and open tabs stop intercepting on their next paste

#### Scenario: Failed protection is rolled back
- **WHEN** dynamic script registration or immediate injection fails after permission is granted
- **THEN** the new script registration and granted permission are rolled back and `customSites` is unchanged

#### Scenario: Reconcile after restart
- **WHEN** the extension starts or is installed with stored custom sites
- **THEN** only granted patterns receive persistent scripts, stale or ungranted registrations are removed, and no new install-time host access is added

### Requirement: Review card is bottom-docked and keyboard safe

For dirty text in `ask` mode, the extension SHALL open one closed Shadow DOM card fixed to the bottom center of the viewport, capped at 46vh with its own overflow scrolling. It SHALL show `strapd guard`, finding counts as category pills, a collapsible raw-to-redacted diff, and the actions Paste redacted (Enter), Paste raw (Shift+Enter), and Cancel (Esc). The card SHALL act only on trusted keyboard events, so page-synthesized `keydown` events cannot choose or cancel an action; trusted keys SHALL be trapped so the host form does not submit. Its diff preview SHALL reconstruct the actual scrubbed text and fall back to a whole-text preview when anchored segments cannot. The card SHALL NOT measure the active editor.

#### Scenario: Dirty paste in ask mode
- **WHEN** the scan reports enabled findings
- **THEN** the card opens with Paste redacted focused and the selected text is inserted only after the card is removed and focus returns to the editor

#### Scenario: Bottom sheet stays compact
- **WHEN** the review card opens
- **THEN** it is centered along the bottom edge, capped at 46vh, and scrolls internally instead of growing with the pasted text

#### Scenario: Diff toggle keeps keyboard semantics
- **WHEN** the diff summary has focus and the user presses Enter
- **THEN** the diff expands or collapses instead of pasting text

#### Scenario: Synthesized keyboard event
- **WHEN** a page dispatches an untrusted Enter `keydown` while the card is open
- **THEN** no paste action is taken and the card stays open

#### Scenario: Diff preview matches the scrubbed text
- **WHEN** anchored segments cannot reconstruct `scrubbedText`
- **THEN** the card shows a whole-text preview whose replacement equals `scrubbedText`

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

### Requirement: Paste insertion preserves editor state

The content script SHALL compare the editor state captured before a scan with its state at insertion. When the text changed, it SHALL insert at the current caret without restoring the stale selection. Selection capture, restoration, and fallback insertion SHALL use the editor's root selection or composed ranges and SHALL NOT use a selection outside the target. Native insertion SHALL run only when the target owns focus; otherwise a target-bound fallback SHALL insert into the target and leave other focused editors unchanged. Insertion into text controls SHALL honor `maxlength` and native caret semantics.

#### Scenario: Typing during a pending scan
- **WHEN** the user types into the editor before a pending scan response arrives
- **THEN** insertion uses the current editor text and caret instead of overwriting the typed text

#### Scenario: Limited-length text control
- **WHEN** redacted or raw text is inserted into a text control with `maxlength`
- **THEN** the inserted value is truncated to the control's limit and the caret is placed after the inserted text

#### Scenario: Selection outside a shadow-root editor
- **WHEN** the captured selection belongs to a document node outside a shadow-root editor
- **THEN** insertion ignores that selection and appends into the shadow-root editor

#### Scenario: Focus owned by another editor
- **WHEN** insertion targets one editor while another editor owns focus
- **THEN** a target-bound fallback inserts into the intended editor and leaves the focused editor unchanged

### Requirement: Privacy proof is live and local

The popup SHALL expose a Proof drawer that reports the exact active `connect-src` directive, origins obtained live from `chrome.permissions.getAll()`, the build-time SHA-256 of the packaged WASM, a session-only redaction counter, and a self-test result from a real `SCAN_TEXT` round trip against a dummy secret payload. The counter SHALL include redactions that consume an existing placeholder. The self-test result SHALL report only the verified local scan and CSP directive, not an unmeasured network-call claim. The extension SHALL not fetch any external script, font, or stylesheet.

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
- **THEN** the worker scans the dummy payload locally, reports a nonzero finding count and measured round-trip milliseconds, shows the verified local scan and active CSP directive, and makes no network-call claim

#### Scenario: Count a placeholder-consuming redaction
- **WHEN** WASM changes text by consuming an existing redaction placeholder without adding a new one
- **THEN** the session redaction counter still increases by at least one

#### Scenario: Count a consumed placeholder beside a fresh secret
- **WHEN** WASM consumes an existing placeholder and also adds a fresh secret finding
- **THEN** both the fresh finding and the consumed placeholder are counted

#### Scenario: Session counter lifetime
- **WHEN** the browser restarts
- **THEN** the redaction counter starts at zero because it is stored only in RAM

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

### Requirement: Production package is verified

`make extension-build` SHALL continue to produce a load-ready unpacked `extension/dist/` with the local fixture. `make extension-package` SHALL stage a minified production build with no sourcemaps and no test fixture, verify the exact manifest name, description, and CSP, static script timing and frame scope, WASM digest, icon assets, and absence of unexpected URLs, write `SHA256SUMS`, and create a versioned ZIP with a matching `.sha256` file under `target/`.

#### Scenario: Build an unpacked extension
- **WHEN** the user runs `make extension-build`
- **THEN** `extension/dist/` can be loaded with Chrome's **Load unpacked** flow and includes the local test fixture

#### Scenario: Build a production package
- **WHEN** the user runs `make extension-package`
- **THEN** the artifact contract passes, `extension/release/` contains no sourcemaps or test fixture, and `target/` contains a versioned ZIP plus its SHA-256 checksum
