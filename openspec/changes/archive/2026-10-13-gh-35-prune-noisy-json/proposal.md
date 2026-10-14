## Why

Large JSON payloads often contain empty values, irrelevant fields, and long arrays that obscure the useful data. Issue #35 calls for one local transformation that behaves consistently in the CLI, WebApp, and Pipes while preserving a clean JSON result for composition.

## What Changes

- Add recursive JSON pruning for nulls, empty strings, empty objects, and empty arrays, plus optional removal of comma-separated key names at every object depth.
- Add opt-in array sampling. A sample size of N retains the first N entries and the final entry only when the pruned array has more than 2N entries; N defaults to 3 when sampling is enabled.
- Return pruning and sampling statistics from the shared operation without inserting markers into the transformed JSON.
- Add `strapd json prune` with positional input or stdin, useful invalid-JSON errors, and `--output raw|json`. Raw is the default; JSON output is a CLI-only `{ "data": ..., "metadata": ... }` response and the first supported use of a convention intended for other commands later.
- Add a visible WebApp pruning tool and a composable Pipes block. Both consume and produce raw JSON; the WebApp may present statistics outside its output box.
- Document exact behavior and local processing.
- Stage delivery: prototype and review the core algorithm, implement the optimized core and CLI path, review end-to-end CLI performance, then add WASM, WebApp, and Pipes integration after that performance checkpoint is accepted.

## Capabilities

### New Capabilities

- `json-pruning`: Shared pruning, sampling, key removal, statistics, and CLI/WebApp/Pipes behavior.
- `cli-json-response`: Opt-in CLI response shape, initially supported by `json prune`.

### Modified Capabilities

None. Existing CLI input and Pipes contracts already describe the required integration behavior.

## Impact

Shared Rust JSON logic, CLI arguments and output handling, WASM bindings, WebApp tool registry and UI, Pipes configuration, tests, and documentation. The CLI response wrapper is an edge concern; the core does not construct it. No network service or persistent storage is required.
