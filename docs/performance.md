# Performance

strapd tools run on every keystroke in the WebApp and inside shell pipelines, so their cost should depend on the size of the change, not the size of the input, wherever possible. This page records performance budgets, how to measure them and the latest measurements.

## Text diff

### Budgets

Median time of the core comparison with default context (3 lines), release build, single thread, on the reference machine. Input sizes are per side.

| Scenario | 1 MB | 10 MB |
|---|---|---|
| Identical inputs | ≤ 0.1 ms | ≤ 1 ms |
| One localized edit (≤ 10 changed lines) | ≤ 0.2 ms | ≤ 1 ms |
| One edit inside a single-line document | ≤ 0.2 ms | ≤ 1 ms |
| 1% of lines changed, uniformly scattered | ≤ 3 ms | ≤ 30 ms |
| Completely different inputs | ≤ 50 ms | ≤ 1 s |

Unified rendering must sustain at least 1 GB/s of output. In the WebApp, a 1 MB pair with a localized edit must show its diff within one frame (16 ms).

Identical, localized and single-line edits are sub-millisecond because unchanged leading and trailing text is skipped with a byte comparison before any line is hashed. Scattered and divergent changes must hash every line, so they scale with input size; the diff engine's heuristics keep divergent inputs from blowing up.

### Running the benchmarks

```bash
make rust-bench                                     # core diff and rendering
make rust-bench BENCH_ARGS='-- --save-baseline main' # save a baseline
make rust-bench BENCH_ARGS='-- --baseline main'      # compare against it
make webapp-bench                                   # browser WASM, report only
```

Inputs are generated from a fixed seed, so every run measures the same data. CI compiles the benchmarks but does not gate on timings.

### Results

Reference machine: Apple M4, macOS 27.2.1, Rust 1.97.1, release build with thin LTO. Recorded 2026-11-22.

| Scenario | Native 1 MB | Native 10 MB | Browser WASM 10 MB (in module / end to end) |
|---|---|---|---|
| Identical | 0.017 ms | 0.19 ms | |
| Localized edit | 0.033 ms | 0.33 ms | |
| Single-line edit | 0.054 ms | 0.58 ms | |
| Scattered 1% | 1.08 ms | 11.3 ms | |
| Completely different | 20.0 ms | 203 ms | |

Unified rendering throughput: 2.5 GB/s (localized), 3.3 GB/s (scattered 1%), 6.3–7.2 GB/s (completely different). Time grows linearly with input size in the scaling benchmark.

Browser `simd128`: _before/after to be recorded_.
