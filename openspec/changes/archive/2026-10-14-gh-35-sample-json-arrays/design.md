## Context

The current issue-35 implementation parses JSON in core, builds a borrowed output tree, serializes once, and passes typed statistics to CLI/WASM. The CLI alone builds the `{data,metadata}` response. See proposal.md for the change in user intent and the delta specs for observable behavior.

## Goals / Non-Goals

**Goals:** Keep object structure intact, sample every array reproducibly, and avoid copying omitted subtrees into an output tree. Keep output metadata separate from raw JSON data.

**Non-Goals:** Inferring a complete schema from heterogeneous arrays, exposing field pruning, preserving old `json prune` calls, or promising identical random selections across future algorithm revisions.

## Decisions

1. Rename the core operation to `json_sample` and expose `sample(input, size, seed)`. The default size is 3 and the default seed is 0 at all interface edges. Core accepts explicit size/seed and returns raw output plus typed filtering and omission statistics.
2. Use a small, explicitly implemented seeded pseudorandom generator and bounded uniform selection rather than an unstable dependency default RNG. Select N surviving entry indexes without replacement, sort those indexes, and build only selected output nodes. This makes the selection repeatable and output order unsurprising. Array elements are checked for removal eligibility before selection; omitted object subtrees need no recursive output work.
3. Filter an array element when it is null or an array that becomes empty after recursively filtering its own array entries. Object fields are always kept. `[]` in an object field stays `[]`. Filtering counts come from selected branches; sampling counts report omitted eligible entries.
4. Keep the existing JSON Pointer path convention. Report only paths present in final data, and compute metadata after selection. Expose the same core result through WASM; the WebApp displays statistics separately; Pipes forwards only raw JSON.
5. Rename the WebApp tool and Pipe tool id to `data-formats-json-sample`. Saved Pipe configs containing the old id are unsupported and must be recreated. Update docs and tests with this migration.

## Risks / Trade-offs

- [Random selection can miss an uncommon field] → Document the uniform-array assumption and present output as a representative sample, not a complete schema.
- [A fixed seed can repeatedly choose unrepresentative entries] → Expose `--seed` and equivalent WebApp/Pipes controls so users can resample deterministically.
- [Recursive eligibility checks may revisit nested arrays] → Keep checks allocation free and benchmark end-to-end behavior against the current command.
- [Renaming breaks scripts and saved Pipe steps] → State the migration in CLI help and docs. This change is on an unreleased feature branch.

## Migration Plan

Replace `json prune` with `json sample`; replace `--sample-size` with `--size` and remove `--sample`/`--drop-keys`. Rename the WebApp tool and Pipe id and update examples. Users of the unreleased v1 must update scripts and recreate saved Pipe steps.
