## Why

The first extension protects the paste boundary but asks every user, every time, and makes its privacy claims hard to verify. This upgrade turns it into `strapd guard`: a fast, self-contained paste firewall with review, silent-redaction, and paused modes plus a live privacy proof surface.

## What Changes

- Rebrand the extension, popup, inline cards, and icons to **strapd guard** with the supplied local shield-and-`S` glyph.
- Replace the Enabled/Paused boolean with persisted `ExtensionSettings`: `ask` (interactive review), `auto` (silent redaction with no overlay), and `paused` (15-minute raw-paste window).
- Add four local detector chips persisted in settings and forwarded with each `SCAN_TEXT` request, mapped to existing WASM secret/PII category bits.
- Add custom protected sites using `optional_host_permissions`, `activeTab`, and persistent dynamic content scripts registered from the popup; default sites stay pinned.
- Add a closed Shadow DOM **Proof** drawer showing the exact active CSP directive, live Chrome-granted origins, the build-time WASM SHA-256, a RAM-only blocked counter, and a real offline self-test.
- Ship the strict `connect-src 'none'` CSP verified by Chrome, and make the Proof drawer hide correctly and refresh when the self-test runs.
- Keep the installed identity minimal: exact short manifest description, a brand-only popup header, and `Fully offline` in the Proof summary.
- Redesign the intercept card as a bottom-docked sheet with category pills, a raw-to-redacted diff toggle, keyboard actions, and an opt-in switch to permanent auto-redact.
- Remove the silent-mode toast and insertion undo path; auto mode inserts redacted text with no popup.
- Match the supplied mockup's light/dark developer-tool aesthetic with 100% local CSS and system font stacks.

**BREAKING**: the permission model changes from `storage` only to `storage`, `scripting`, and `activeTab`, with `optional_host_permissions` for user-chosen sites. Host access is still explicit; no broad `<all_urls>` grant is requested at install.

## Capabilities

### New Capabilities

- `browser-extension-paste-intercept`: Local paste scanning, three paste modes, detector controls, custom protected sites, keyboard-first bottom-docked review UI, and verifiable offline privacy proof.

### Modified Capabilities

None.

## Impact

`extension/` gains settings/storage helpers, generated build metadata, PNG icons, a self-contained popup stylesheet, redesigned Shadow DOM UI, and broader tests. Root `Makefile`, `.gitignore`, `docs/usage.md`, and extension documentation are updated. No Rust crate changes: the extension continues to reuse `detect_pii`, `sanitize_secrets`, and `sanitize_pii` from the existing browser WASM artifact.
