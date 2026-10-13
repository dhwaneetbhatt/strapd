# CLI implementation and performance checkpoint

## Contract and correctness

`strapd json prune` accepts a JSON argument or stdin, recursively removes nulls, empty strings, empty objects and empty arrays, and can drop exact object keys with `--drop-keys`. `--sample` enables array sampling with N=3; `--sample-size N` enables it with another positive N. Arrays are sampled after pruning only when more than 2N elements survive. The default `--output raw` writes the JSON value. `--output json` wraps that value as typed `data` and adds `metadata` at the CLI edge. Other commands do not yet accept `--output`.

For example, `strapd json prune --sample --output json '{"outer":[{"middle":[{"items":[1,2,3,4,5,6,7]}]}],"unused":null}'` prints:

```json
{"data":{"outer":[{"middle":[{"items":[1,2,3,7]}]}]},"metadata":{"pruned":{"droppedKeys":0,"emptyArrays":0,"emptyObjects":0,"emptyStrings":0,"nulls":1},"sampling":{"arrays":[{"omitted":3,"path":"/outer/0/middle/0/items"}],"omittedTotal":3}}}
```

The production core has 11 focused tests and the CLI has 7 focused tests. They cover the alternating object → array → object → array → object → array path, direct nested arrays, shifted final-output indices, escaped pointer segments, pruning before sampling, parser depth, positional/stdin input, defaults and overrides, typed CLI output, errors, and unsupported options. The full core and CLI Rust test suites pass with `TZ=UTC` (an existing datetime test assumes UTC). Focused strict Clippy and `cargo fmt --all --check` pass. An independent read-only review found no correctness issue in the production core or CLI implementation.

## Core operation benchmark

Measured on the local arm64 machine with `rtk cargo run --release -p strapd-core --example json_prune_bench`. Each operation parses, prunes, samples at N=3, and serializes. Five timed rounds follow warmup; numbers are medians. The separate parse-only measurement shows how much of the production time is spent just parsing the input.

| Input | Bytes | Prototype µs/op | Production µs/op | Production speedup | Parse-only µs/op |
| --- | ---: | ---: | ---: | ---: | ---: |
| Small object | 52 | 1.259 | 1.061 | 1.19× | 0.400 |
| Wide object | 13,059 | 298.979 | 212.755 | 1.41× | 155.895 |
| 64-level object | 664 | 13.559 | 11.958 | 1.13× | 4.911 |
| 10,000-entry array | 48,891 | 205.956 | 171.947 | 1.20× | 104.696 |

The production path builds a borrowed plan over the parsed tree instead of cloning retained JSON values. It keeps only the first 2N and rolling last child plans for sampled arrays, constructs JSON Pointer paths only for emitted arrays, and writes the raw result directly to a byte buffer. Each input is parsed once. The large-array input is processed at about 284 MB/s in this in-process benchmark (input bytes divided by median production time). Parsing alone takes about 61% of that case's measured time, so further large gains would require parser-level changes or a streaming design, each with added complexity.

Measured allocations with `rtk cargo run --release -p strapd-core --example json_prune_alloc`:

| Input | Prototype allocations / bytes per op | Production allocations / bytes per op |
| --- | ---: | ---: |
| Small | 18 / 2,956 | 17 / 1,520 |
| Wide | 28 / 563,730 | 16 / 380,469 |
| Deep | 146 / 57,026 | 146 / 32,794 |
| Large array | 37 / 2,098,350 | 25 / 1,097,961 |

## End-to-end release CLI benchmark

Measured `target/release/strapd` with `rtk proxy python3 scripts/json-prune-cli-bench.py --runs 60`. Each invocation starts a new process; the harness captures stdout and includes startup, argument or stdin transfer, processing, and output. Five warmups precede each case. `minify` is an existing-command reference, not a semantic equivalent of pruning. The table gives median / p95 wall time in milliseconds. Raw and JSON prune modes enable N=3 sampling. Input sizes match the core table.

| Input | Minify argument | Minify stdin | Prune raw argument | Prune raw stdin | Prune JSON argument | Prune JSON stdin |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Small | 27.76 / 35.14 | 30.52 / 43.16 | 25.57 / 42.28 | 25.15 / 30.38 | 26.87 / 35.54 | 25.61 / 33.51 |
| Wide | 26.56 / 34.48 | 26.29 / 32.49 | 29.99 / 83.14 | 30.63 / 35.40 | 28.64 / 43.91 | 29.74 / 37.64 |
| Deep | 27.68 / 33.01 | 25.87 / 33.61 | 26.59 / 33.99 | 28.73 / 41.34 | 28.90 / 45.43 | 28.90 / 44.08 |
| Large array | 30.23 / 41.77 | 29.76 / 35.69 | 27.66 / 35.31 | 27.56 / 36.26 | 27.32 / 33.56 | 29.36 / 38.07 |

The same harness measured `/usr/bin/true` at 30.75 ms median and `strapd --version` at 28.56 ms median. These are environment-wide process launch costs, not prune time. They dominate all CLI results and fluctuate enough that sub-millisecond pruning differences cannot be inferred from the subprocess medians. The core benchmark above isolates operation cost. An end-to-end 10,000-entry array invocation has an observed median around 27–29 ms here, but it should not be presented as a portable strapd latency.

Whole-process maximum resident set size from `/usr/bin/time -l`, using stdin (bytes):

| Input | Minify | Prune raw | Prune JSON |
| --- | ---: | ---: | ---: |
| Small | 8,683,520 | 8,798,208 | 8,781,824 |
| Wide | 8,912,896 | 9,093,120 | 9,060,352 |
| Deep | 8,683,520 | 8,847,360 | 8,863,744 |
| Large array | 9,273,344 | 9,355,264 | 9,355,264 |

These peaks include the whole executable and allocator; the allocation table above is the more useful comparison of implementation memory. The current CLI checkpoint is ready for review. WASM, WebApp, and Pipes work remains after acceptance, as specified in `tasks.md`.
