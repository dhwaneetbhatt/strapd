## Why

Developers often need a small, representative JSON value to show an LLM the shape of a larger payload. The existing prune command removes object keys and uses a deterministic first-and-last preview, which obscures the sampling intent and can erase useful shape information.

## What Changes

- **BREAKING**: Replace `json prune` with `json sample` as the issue-35 operation across CLI, WebApp, and Pipes.
- Recursively remove `null` and empty-array entries from arrays only, then randomly select up to N remaining entries per array, default N=3.
- Use a fixed default seed for repeatable selections; expose a CLI seed override and equivalent controls in the WebApp and Pipes.
- Preserve object keys and values, including null and empty arrays in object members; preserve selected entries exactly apart from sampling nested arrays.
- Keep raw JSON as the default CLI/Pipes result and expose loss metadata through the CLI-only `--output json` response and a separate WebApp summary.

## Capabilities

### New Capabilities

- `json-sampling`: Recursive array-only filtering and seeded random sampling across CLI, WebApp, and Pipes.

### Modified Capabilities

- `json-pruning`: Retire the pruning requirements and direct callers to sampling.
- `cli-json-response`: Move the opt-in CLI JSON response contract from `json prune` to `json sample` and report sampling loss.

## Impact

Core JSON transformation, CLI arguments and output, WASM binding, WebApp tool, Pipes contract, tests, and documentation. Existing `json prune` invocations and saved Pipes steps require migration to `json sample`.
