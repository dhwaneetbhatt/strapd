## Why

Sanitizer help is too wordy. Users need usage guidance, not the full recognition policy.

## What Changes

- Shorten PII and secrets help to purpose, category defaults, input forms and a docs pointer.
- Keep recognition limits in the existing docs and update help tests.
- Leave sanitization behavior unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pii-sanitization`: Keep CLI help concise; document detailed recognition rules in the linked guide.

## Impact

CLI argument descriptions and help tests only. No core, WASM or dependency changes.
