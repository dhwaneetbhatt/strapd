## Why

Comparing two snippets (configs, payloads, generated output) is a frequent micro-task that today means reaching for `diff` with temp files or pasting into a third-party website. strapd should handle it offline from the terminal and the browser, consistent with every other text tool (GitHub issue #46).

## What Changes

- Add a line-oriented text diff with intra-line (word-level) change emphasis to `strapd-core`.
- Add `strapd text diff` (also reachable through the `string`/`str` aliases) to the CLI:
  - inputs as two literal arguments, `--from-file`/`--to-file` paths, or `-` to read one side from stdin, following GNU `diff`/`git diff --no-index` conventions;
  - unified output (the `diff -u` / `git diff` format) by default, `-y/--side-by-side` GNU-style two-column output as an option;
  - `-U/--unified N` context lines, `--label` overrides, `--color auto|always|never` with git's colour scheme and word emphasis, `--exit-code` for scripts.
- Export the diff from the browser WASM module (structured result plus unified patch text).
- Export the diff from the portable WIT package (`strapd:tools`) with typed records.
- Add a "Text Diff" WebApp tool with two inputs, red/green line deltas, intra-line emphasis, unified/split toggle, context selection, change stats and copy-as-patch.
- Add diff colour tokens to `DESIGN.md`.
- Treat performance as a requirement: tiered budgets (sub-millisecond at 10 MB for identical, localized-edit and single-line-edit inputs), a reproducible native benchmark suite, a CLI renderer benchmark and a report-only browser WASM benchmark, with results in `docs/performance.md`.

## Capabilities

### New Capabilities
- `text-diff`: Comparing two texts and presenting the differences consistently across the core library, CLI, browser WASM, portable WASM and WebApp.

### Modified Capabilities
<!-- None. The portable catalog requirement already covers extending the browser catalog; the diff tool is intentionally not pipe-enabled, which the existing webapp-pipes requirement already permits. -->

## Impact

- `crates/core`: new `string::diff` module; new dependencies `imara-diff`, `memchr`, `bytecount`; dev-dependencies `criterion`, `proptest`; new `benches/text_diff.rs`; `[profile.bench]` in the workspace manifest.
- `crates/cli`: new `StringOperation::Diff` args and handler; exit-status plumbing for `--exit-code`; new dependency `unicode-width` for side-by-side column layout; new `benches/diff_render.rs`.
- `Makefile`: `rust-bench` and `webapp-bench` targets.
- `crates/wasm`: new `string_ops` exports.
- `crates/wasm-portable`: new WIT records/exports, adapter and contract tests; WIT package minor version bump.
- `webapp`: WASM wrapper, string utils, tool definition, new `diff-tool.tsx` component and tests.
- Docs: new `docs/performance.md`, `docs/usage.md`, `README.md` feature list, `AGENTS.md` feature list, `DESIGN.md` diff tokens, `CHANGELOG.md`.
