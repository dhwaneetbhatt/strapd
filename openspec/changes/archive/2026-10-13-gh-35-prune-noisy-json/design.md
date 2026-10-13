## Context

See proposal.md for motivation and the two new capability specs for behavior. JSON formatting already uses the `json` crate in `crates/core/src/data_formats/json.rs`. CLI JSON commands use `required_text` and return bytes through `CommandResult`; WASM binds core operations to the WebApp. Pipes execute registered tool operations sequentially and forward only their canonical string result. There is no existing CLI output-format convention.

## Goals / Non-Goals

**Goals:**
- Keep one transformation and one source of statistics in Rust core while keeping the `{data,metadata}` response solely in CLI presentation code.
- Make transformed data byte-efficient to serialize and safe to pass through existing Pipes contracts.
- Make the prototype measurable and reviewable before investing in the optimized integration.

**Non-Goals:**
- Add `--output json` to commands other than `json prune` in this change.
- Introduce an omission sentinel into JSON data or wrap WebApp/Pipes output.
- Guarantee that a lossy prune or sample result still passes an arbitrary input schema.

## Decisions

### Separate core outcome from CLI response
The core operation returns a typed outcome containing the transformed JSON and typed counts/locations. It does not know about `data`, `metadata`, `--output`, or CLI presentation. The CLI writes raw transformed JSON by default and builds the two-key JSON response only for `--output json`. `data` is embedded as a JSON value, never double-quoted as serialized text. Existing CLI errors remain nonzero with stderr and no success payload. `--output` starts on `json prune`; unsupported commands reject it through argument parsing rather than silently ignoring it.

Alternative: have core return the response object. Rejected because it couples shared behavior to one interface and would force wrappers into WebApp and Pipes. Alternative: reconstruct counts at the CLI edge. Rejected because it duplicates transformation work and can disagree with the core.

### Prune before sampling, and sample retained branches from the root
Parse once. Remove explicitly named members before descending into their values, then apply recursive pruning before deciding which arrays cross the sampling threshold. Preserve an empty root as valid JSON. Then walk surviving arrays from the root, shorten each qualifying array, and descend only into retained entries. Record locations using paths in the final output; this avoids paths into omitted branches and keeps array indices meaningful to callers. The omitted count for one array is its post-prune length minus N minus one. Pruned category counts include values removed because a descendant made a container empty; dropped keys have a separate count and their descendants are not counted.

Alternative: sample before pruning. Rejected because its threshold and count would include entries pruning later removes. Alternative: report only one aggregate count. Rejected because callers cannot locate nested reductions.

### Keep sampling an explicit operation
Pruning is the default behavior. A dedicated sampling control enables sampling, with N=3 unless overridden. CLI options, WebApp controls, and Pipe configuration map to the same core options. This avoids silent array truncation during an ordinary prune and keeps existing data pipelines predictable.

Alternative: always sample at N=3. Rejected because it silently discards entries even when users only asked to remove empty values.

### Prototype, review, optimize core and CLI, then review end-to-end performance
First create a small Rust core prototype without CLI/WASM/WebApp integration. Test synthetic cases spanning nested containers, threshold boundaries, post-prune cascades, dropped keys, unusual member names, root primitives, invalid JSON, and arrays nested inside arrays. Capture exact transformed values and statistics. Benchmark representative small, deeply nested, and large-array inputs in release mode, including allocations and peak memory where locally measurable. Review correctness cases, failure behavior, benchmark methodology, and pathological inputs before proceeding. The prototype has passed that review.

The production pass will choose the lowest-cost approach supported by the measurements: avoid repeated parses, duplicate JSON trees, unnecessary string/key cloning, and collecting entries that will be omitted. Preserve stable value and array order. Re-run the same corpus and benchmarks after each material optimization; compare throughput, allocations, and memory with the prototype. Implement the CLI before the WASM/WebApp/Pipes layer, then measure the release CLI executable end to end, including process startup, input acquisition, parse, transformation, serialization, and stdout for raw and JSON response modes. Review latency, throughput, and memory evidence before proceeding to other interfaces. Performance changes must preserve exact behavior and statistics across all interfaces.

Alternative: directly optimize during the first implementation. Rejected because it makes semantic mistakes harder to isolate and removes a useful baseline for measuring gains.

### Adapt statistics to each interface
The CLI exposes counts and per-array paths in `metadata` only in JSON output mode. The WebApp presents the raw JSON in its result box and can show a separate omission summary nearby. Pipes pass only raw JSON; their saved step config carries the pruning and sampling options through the existing versioned contract. WASM may transport typed statistics for the WebApp, but it does not construct the CLI response format.

## Risks / Trade-offs

- [Parser and tree overhead dominate small inputs] → benchmark full parse, transform, and serialization latency; avoid extra traversals or allocations unless they measurably help.
- [Deeply nested input exhausts stack or memory] → retain the current parser's 512-level depth rejection and test both sides of that boundary; reassess if the parser or traversal changes.
- [Path construction allocates excessively] → use a reusable path buffer or delayed path materialization for arrays that actually sample, then measure.
- [Changing arrays can violate user schemas even without a marker] → keep sampling opt-in and document that pruning and sampling are lossy.
- [A CLI JSON wrapper can be mistaken for ordinary pruned JSON] → default to raw and document the response shape and explicit flag.
- [A parent sample can hide nested arrays] → report only sampled arrays that survive in `data`, with paths into the final value.

## Migration Plan

No stored data or Pipe schema migration is needed. Existing tools and commands retain their output. Add and measure the CLI first. After the CLI performance review, rebuild WASM, add the WebApp and Pipes registrations, run cross-interface conformance checks, update documentation, and validate the OpenSpec change. Reverting the new command/tool registrations and core operation restores prior behavior without data migration.
