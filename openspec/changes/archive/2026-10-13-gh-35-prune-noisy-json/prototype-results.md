# JSON prune prototype results

This is a historical checkpoint record. The prototype implementation and its benchmark examples were removed from the production crate after the final integration comparison; the measured results are retained here.

## Scope

The prototype is a core-only implementation in `crates/core/src/data_formats/json_prune_prototype.rs`. It has no CLI, WASM, WebApp, or Pipes integration. It parses input, recursively rebuilds a pruned tree, samples surviving arrays, and returns raw JSON plus typed counts and paths. The prototype intentionally favors simple code over minimum allocations so it can serve as a correctness baseline.

## Synthetic cases

`rtk cargo test -p strapd-core --test json_prune_prototype` passed all 10 cases. The full core test suite passed with 636 tests across 9 suites. `rtk cargo clippy -p strapd-core --all-targets -- -D warnings` and strict OpenSpec validation passed. Formatting was applied after the final two focused cases and will be checked once more at the review checkpoint.

| Case | Representative input and options | Exact result or key statistics |
| --- | --- | --- |
| Cascading removal | `{"outer":{"inner":null},"items":["",{},false]}` | `{"items":[false]}`; 1 null, 1 empty string, 2 empty objects removed |
| Empty/scalar roots | `{}`, `[]`, `null`, `""`, `false`, `0`, `" "` | Each root remains the same JSON value; no removals |
| Exact dropped keys | `debug, trace` at nested depths | Matching members removed case-sensitively; 3 dropped keys; dropped subtrees do not contribute prune counts |
| Sampling boundary | Six then seven entries, N=3 | Six remain unchanged; seven become `[1,2,3,7]`, 3 omitted at root path `""` |
| Prune before sample | `[1,null,2,{},3,4,5,6]`, N=3 | `[1,2,3,4,5,6]`; no sampled omissions |
| Nested arrays | Two `orders[*].items` arrays, N=3 | Both shortened; paths `/orders/0/items`, `/orders/1/items`; 6 total omitted |
| Omitted branch and escaped key | Key `a/b~c`, outer array and nested arrays, N=3 | Only retained branches reported; path starts `/a~1b~0c`; 9 total omitted |
| Alternating objects and arrays | `outer` array → object → `middle` array → object → `items` array, with earlier entries pruned | `{"outer":[{"middle":[{"items":[1,2,3,7]}]}]}`; path `/outer/0/middle/0/items`; 2 nulls, 1 empty object, 3 sampled omissions |
| Directly nested arrays | `[[1,2,3,4,5,6,7],[],[10,11,12,13,14,15,16]]`, N=3 | `[[1,2,3,7],[10,11,12,16]]`; the empty array is pruned, then paths `/0` and `/1` each report 3 omissions |
| Parser depth boundary | 512 nested arrays, then 513 nested arrays | The 512-level value is preserved; 513 levels return an invalid-JSON depth error before recursive pruning starts |

Malformed JSON returns an error beginning `Invalid JSON input:`. A zero sample size returns `Sample size must be a positive integer`.

The first test run found two incorrect test expectations: the cascading example removes two empty objects, and the empty-string root fixture was malformed. Both fixtures were corrected; the prototype logic did not change because of those failures. Independent review then identified missing direct array-inside-array coverage and an unverified deep-input boundary; both focused cases were added and pass. A second read-only review found no remaining correctness issue in the prototype.

## Release benchmark baseline

Command: `rtk cargo run --release -p strapd-core --example json_prune_bench`. Measurements on local arm64, 5 timed rounds per case after warmup; each round reparses, prunes, samples at N=3, and serializes every input. The figures are medians in microseconds per operation, not promises for other hardware.

| Case | Input bytes | Iterations per round | Median µs/op |
| --- | ---: | ---: | ---: |
| Small object and array | 52 | 20,000 | 1.255 |
| Wide object | 13,059 | 1,000 | 311.052 |
| 64-level nested object | 664 | 4,000 | 14.634 |
| Large 10,000-entry array | 48,891 | 200 | 224.515 |

For separate `time -l` runs, maximum resident set size was 7,094,272 bytes for the wide-object process and 7,946,240 bytes for the large-array process. These are whole-process peaks, not per-operation allocations or incremental memory. The local tool did not expose reliable per-operation allocation counts; the production optimization phase should instrument those directly before treating memory as optimized.

## Review focus

- Check whether the pruning and path semantics match the intended user behavior, especially paths after array indices shift.
- Inspect count semantics for cascading containers and explicitly dropped subtrees.
- Review the benchmark corpus and measurement method before treating its figures as a performance baseline.
- The prototype rebuilds objects/arrays and clones retained primitives; the production pass should measure and remove avoidable data movement.
- The current `json` parser rejects nonempty containers beyond 512 nesting levels before the prototype traversal begins. The production implementation should retain a safe failure path if the parser or traversal changes.
