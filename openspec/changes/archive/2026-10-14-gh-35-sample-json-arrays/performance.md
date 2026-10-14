# CLI end-to-end performance

Measured locally on 2026-10-14 with the release binary. Each invocation started a new `strapd` process and passed JSON on stdin. Times include process launch, parse, transform, serialization, and stdout capture. The small payload used 40 measured interleaved invocations per command after two warmups; the large payload used 20 measured invocations per command after two warmups. The payload contains records with an ID, name, boolean, and a small array containing null and empty-array entries.

| Input | Command | Median | p95 |
| --- | --- | ---: | ---: |
| 1,440 B / 20 records | `json minify` | 25.18 ms | 32.42 ms |
| 1,440 B / 20 records | `json sample --size 3` | 25.85 ms | 32.98 ms |
| 762,790 B / 10,000 records | `json minify` | 40.34 ms | 57.25 ms |
| 762,790 B / 10,000 records | `json sample --size 3` | 43.06 ms | 58.23 ms |

An adversarial 400-level nested-array input (801 B), measured before the final output-buffer capacity adjustment, took 35.32 ms median and 41.18 ms p95 for `json sample`, versus 37.50 ms and 46.50 ms for `json minify`, across 30 measured invocations after two warmups. Recursive eligibility checking revisits nested arrays, but this did not produce a measurable end-to-end regression at the parser's supported depth in this environment.

The small-input times are dominated by process launch and vary with machine load. The large-input result puts sampling within a few milliseconds of the existing JSON command for this workload. These are local measurements, not a cross-platform performance guarantee.
