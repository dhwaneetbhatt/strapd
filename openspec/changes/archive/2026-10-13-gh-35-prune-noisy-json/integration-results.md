# Final integration verification

The accepted v1 CLI behavior is also available through WASM, the visible WebApp JSON Prune tool, and the version 1 Pipes transform contract. The WebApp places raw transformed JSON in its result box and shows omission counts and final-output paths separately. Pipes forward only the raw JSON string. The CLI-only `data`/`metadata` response is never forwarded by these interfaces.

## Cross-interface checks

`webapp/scripts/json-prune-parity.mjs` ran in Chromium against the rebuilt WASM package and compared actual WebApp outcomes with the release CLI's `--output json` result. Data and every statistic matched for cascading removal, alternating object/array nesting, direct nested arrays, escaped key names with exact key dropping, and an empty root. A real Pipes execution returned exactly the release CLI's raw JSON for the nested case. Invalid JSON produced a WebApp error. The browser UI displayed the nested path `/outer/0/middle/0/items` and no horizontal overflow at 1440px or 390px viewport widths.

Rust tests passed for `strapd-core`, `strapd`, and `strapd-wasm` with `TZ=UTC` because an existing datetime test assumes UTC. WebApp Vitest passed 339 tests across 30 files. Rust formatting, scoped strict Clippy, TypeScript compilation, WebApp Biome checks, WASM packaging, and the production Vite build passed. The Vite build reported an existing large-chunk warning. Independent review found no v1 correctness issue. It confirmed that sampling-only is outside the accepted v1 contract and should be explored separately.

## Performance after integration

The Rust pruning algorithm and CLI path did not change during WebApp/Pipes integration. A release core rerun with the same prototype comparison harness measured the following medians in microseconds per parse-prune-sample-serialize operation (five rounds after warmup):

| Input | Accepted CLI checkpoint, production | After integration, production | After integration, prototype |
| --- | ---: | ---: | ---: |
| Small, 52 bytes | 1.061 | 0.910 | 1.104 |
| Wide, 13,059 bytes | 212.755 | 154.776 | 286.698 |
| Deep, 664 bytes | 11.958 | 11.513 | 9.729 |
| Large array, 48,891 bytes | 171.947 | 163.344 | 198.068 |

The deep case illustrates run-to-run noise: its prototype and production ordering changed between runs although neither algorithm changed. The large-array production rate was about 299 MB/s of input in the final run. The allocation rerun was unchanged: production allocated 1,520 bytes per small operation, 380,469 for wide, 32,794 for deep, and 1,097,961 for the large array, versus prototype 2,956, 563,730, 57,026, and 2,098,350 bytes respectively. The prototype harness and implementation were removed from the final crate after these measurements; the recorded results remain in this change.

The release CLI subprocess benchmark was rerun with 30 samples per case, including startup, stdin or argument transfer, processing, and captured stdout. Median end-to-end times across the four inputs and both input modes were 25.55–28.64 ms for raw pruning and 25.17–27.62 ms for JSON response output. The same run measured `/usr/bin/true` at 21.85 ms and `strapd --version` at 28.34 ms, so process launch remains the dominant and variable cost; these medians cannot isolate the pruning operation. There is no measurable CLI performance regression from the WebApp/Pipes integration.

Final whole-process peak resident memory from `/usr/bin/time -l` with stdin (bytes):

| Input | Existing minify | Prune raw | Prune JSON |
| --- | ---: | ---: | ---: |
| Small | 8,683,520 | 8,798,208 | 8,830,976 |
| Wide | 8,896,512 | 9,093,120 | 9,093,120 |
| Deep | 8,716,288 | 8,814,592 | 8,863,744 |
| Large array | 9,273,344 | 9,371,648 | 9,322,496 |

These are process peaks, not incremental operation memory. The accepted CLI checkpoint report contains the full 60-run end-to-end table and initial memory measurements.
