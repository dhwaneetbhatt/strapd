## 1. Core (`crates/core`, workspace `Cargo.toml` profile, `Makefile` bench target) — owner: coder A

- [ ] 1.1 Add `imara-diff`, `memchr`, `bytecount` dependencies and `criterion`, `proptest` dev-dependencies; add `[profile.bench]` (thin LTO, 1 codegen unit); verify `make wasm-build` and `make portable-wasm-build` still compile with the new dependencies (no `getrandom`/`Instant` reach)
- [ ] 1.2 Write the benchmark suite `crates/core/benches/text_diff.rs` and its deterministic generators per design D8 against a stub `diff()`, and add `make rust-bench` (with `BENCH_ARGS`) — benchmarks exist before optimisation
- [ ] 1.3 Implement the zero-copy model and `diff(from, to, context)` per design D1–D2: byte-level prefix/suffix fast path, SIMD prefix line counting, bounded context slicing, `imara-diff` on the middle, hunk grouping with `diff -u` ranges, CRLF and missing-newline handling, totals
- [ ] 1.4 Implement intra-line emphasis per design D3 (token-boundary prefix/suffix trimming, 2,000-token cap, `imara-diff` token diff, 0.5 similarity threshold, merged ranges)
- [ ] 1.5 Implement `unified` (pre-sized) and `unified_into` (streaming) per spec "Unified patch rendering"
- [ ] 1.6 Tests in `crates/core/tests/text_diff.rs`: every core spec scenario; committed GNU `diff -u` fixtures under `crates/core/tests/fixtures/text_diff/`; CRLF, empty sides, zero/full context, Unicode, deep line numbers
- [ ] 1.7 Property tests (`crates/core/tests/text_diff_props.rs`): fast path equals engine on untrimmed input exactly; reconstruction of "to" is byte-exact; emphasis ranges are in-bounds, sorted, on char boundaries
- [ ] 1.8 Run `make rust-bench`; iterate until every native budget in spec "Performance budgets" is met or report the measured gap with a profile (`cargo flamegraph`/Instruments) to the parent — do not relax budgets
- [ ] 1.9 `make rust-test` and `make rust-lint` pass (benches compile under lint)

## 2. CLI (`crates/cli`) — owner: coder B (after group 1)

- [ ] 2.1 Add `Diff` args to `crates/cli/src/args/string.rs` per design D4
- [ ] 2.2 Add exact (untrimmed) stdin byte reader to `crates/cli/src/input.rs` reusing TTY detection
- [ ] 2.3 Implement source resolution and validation with side-named errors; zero-copy file reads
- [ ] 2.4 Implement streaming coloured unified and side-by-side rendering in `crates/cli/src/handlers/diff_render.rs` over `BufWriter` (add `unicode-width`)
- [ ] 2.5 Wire the dedicated diff branch in `main.rs` with exit statuses 0/1/2 and no extra trailing newline
- [ ] 2.6 CLI tests: literal/file/stdin sources, invalid sources, `-U`, `--label`, side-by-side alignment incl. wide chars and tabs, colour never/always/auto-when-piped, ANSI-strip invariant, `--exit-code` statuses, identical → empty stdout
- [ ] 2.7 Renderer benchmark `crates/cli/benches/diff_render.rs` per design D8; record results
- [ ] 2.8 `make rust-test` and `make rust-lint` pass; manual `./target/debug/strapd text diff` smoke run, including a 10 MB file pair

## 3. Browser WASM and WebApp — owner: coder C (after group 1; parallel with 2 and 4)

- [ ] 3.1 Add `text_diff` and `text_diff_unified` to `crates/wasm/src/string_ops.rs` per design D5 (output proportional to hunk lines); `make wasm-build`
- [ ] 3.2 Add `WasmModule` types and wrapper methods in `webapp/src/lib/wasm/index.ts` and `stringUtils.diff` in `webapp/src/lib/utils/string`
- [ ] 3.3 Add diff colour tokens to the Chakra theme and to `DESIGN.md` per design D7; verify text contrast ≥ 4.5:1 on every tint
- [ ] 3.4 Implement `diff-viewer.tsx` (unified + split, gutters, hunk rows, emphasis, filler, missing-newline marker, sr-only labels, 2,000-row cap, long-line elision, memoised rows)
- [ ] 3.5 Implement `diff-tool.tsx` (inputs, swap, view toggle, context select, totals, copy patch, empty/identical states, narrow-screen behaviour) and export it from `components/tools/index.ts`
- [ ] 3.6 Register `string-diff` in `webapp/src/tools/string-tools.ts` without a pipe contract
- [ ] 3.7 Tests: `diff-viewer.test.tsx` and tool-definition test; `make webapp-test` and `make webapp-lint` pass
- [ ] 3.8 Browser benchmark `webapp/e2e/text-diff.bench.ts` and `make webapp-bench` per design D8 (excluded from `make webapp-e2e`); measure the browser build with and without `+simd128`; if the gain is material, enable it in `make wasm-build` only (never the portable build) and report both numbers
- [ ] 3.9 Browser check at `make webapp-dev` in light and dark mode, desktop and mobile widths, including a 1 MB paste (one batched pass)

## 4. Portable WASM — owner: coder D (after group 1; parallel with 2 and 3)

- [ ] 4.1 Add WIT records/exports per design D6 and bump package to `strapd:tools@0.2.0`
- [ ] 4.2 Implement exports in `crates/wasm-portable/src`
- [ ] 4.3 Extend `tests/adapter.rs` and `tests/contract.py` with shared fixture parity (core module and component), including a large-input case asserting the result contains only the changed hunk
- [ ] 4.4 `make portable-wasm-test` passes

## 5. Docs and verification — primary agent

- [ ] 5.1 Document `strapd text diff` and the WebApp tool in `docs/usage.md`; update the portable package version reference
- [ ] 5.2 Write `docs/performance.md` (reference machine, commands, native/WASM/CLI-renderer medians vs budgets, browser `simd128` before/after)
- [ ] 5.3 Update feature lists in `README.md` and `AGENTS.md`; add CHANGELOG entry
- [ ] 5.4 Independent correctness review of core and CLI; resolve findings
- [ ] 5.5 `make lint` and `make test` pass; cross-interface parity check (CLI uncoloured output == WASM unified == portable unified on shared fixtures)
- [ ] 5.6 `openspec validate gh-46-text-diff --strict`
