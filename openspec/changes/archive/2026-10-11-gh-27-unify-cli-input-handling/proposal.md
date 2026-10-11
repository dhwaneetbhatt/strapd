## Why

CLI handlers currently acquire positional and piped input through several inconsistent helpers, causing some commands to block on an interactive terminal, panic on stdin failures, clone complete argument values, or treat bytes and whitespace differently. A shared, fallible input boundary will make command behavior predictable and testable while reducing avoidable allocation and preserving existing user-facing whitespace semantics.

## What Changes

- Introduce focused shared CLI functions for required text, required bytes, and optional piped text.
- Borrow supplied argument values, own stdin values, detect interactive stdin, and return actionable errors instead of blocking or panicking.
- Preserve each command family's current whitespace behavior; normalization remains an explicit handler policy rather than a side effect of generic input acquisition.
- Preserve arbitrary piped bytes for exact byte encoders, and migrate hash and HMAC core APIs toward byte input while retaining their existing surrounding-whitespace normalization for piped messages.
- Keep conversion's argument-plus-stdin composition explicit and keep environment-backed JWT secrets separate from generic input resolution.
- Migrate all callers of the legacy string and byte helpers, characterize numeric stdin handling, and remove obsolete helpers when no callers remain.
- Add unit, process-level, terminal, failure-injection, binary, whitespace, and performance verification covering the shared behavior and representative handlers.

## Capabilities

### New Capabilities

- `cli-input-handling`: Defines consistent, fallible, non-blocking argument and stdin acquisition, compatibility-preserving normalization policies, byte fidelity, and verification requirements for CLI commands.

### Modified Capabilities

None.

## Impact

- Affects CLI input helpers, command handlers, CLI integration tests, and the hash/HMAC core APIs.
- Does not change webapp or WASM input behavior.
- Does not intentionally change command whitespace semantics or environment-secret resolution.
- May add test-only support for PTY, property-based, allocation, or benchmark verification if existing standard-library facilities are insufficient.
