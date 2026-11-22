## Context

See proposal.md for motivation and specs/text-diff/spec.md for the behaviour contract. Relevant current state:

- `strapd-core` owns all logic; the CLI (`crates/cli`), browser WASM (`crates/wasm`, wasm-bindgen) and portable WASM (`crates/wasm-portable`, WIT world `strapd:tools@0.1.0`) are thin adapters.
- CLI handlers return `Result<Vec<u8>, String>`; `main.rs` writes the bytes, appends `\n`, and exits 1 on error. There is no way for a handler to request another exit status today.
- `crates/cli/src/input.rs` provides shared stdin acquisition with TTY detection. Text commands trim piped input; the diff command must not.
- Browser WASM returns structured results as JSON strings (see `json_sample` in `crates/wasm/src/data_formats_ops.rs`), parsed by `webapp/src/lib/wasm/index.ts`.
- WebApp tools are `ToolDefinition`s in `webapp/src/tools/*-tools.ts` with components under `webapp/src/components/tools/<category>/`, built on Chakra UI and `useBaseTool`/`useAutoProcess`. `pipe` is optional; tools without it are excluded from Pipes.
- Visual authority is `DESIGN.md` ("The Dependable Codebench"): VS Code-like neutral planes, one blue accent, JetBrains Mono for data. It has no semantic diff colours yet.

## Goals / Non-Goals

**Goals:**
- One core diff model rendered three ways: unified text (core), coloured/side-by-side terminal text (CLI), React viewer (WebApp).
- Byte-faithful handling of newlines and missing final newlines so patches apply.
- Small, dependency-light CLI rendering (hand-written ANSI, no terminal crate).
- Work proportional to the change, not the input, wherever the input allows it (spec "Performance budgets"), with a reproducible benchmark suite as the source of truth.

**Non-Goals:**
- Directory diffs, binary diffs, three-way merge, patch application.
- Ignore-whitespace/ignore-case options, alternative algorithms (patience/histogram), word-diff output mode (`--word-diff`).
- Terminal width auto-detection (GNU `diff -y` uses a fixed 130 default; `-W` overrides).
- `--output json` (the cli-json-response convention stays limited to `json sample`).
- A Pipes contract: diff takes two independent inputs, which the linear single-input pipe model does not express.

## Decisions

### D1. Core module and model — `crates/core/src/string/diff.rs` (+ `diff/tests.rs` or `crates/core/tests/text_diff.rs`)

The model borrows from the inputs: no per-line allocation, and its size is proportional to the lines inside hunks, never to input size.

```rust
pub const DEFAULT_CONTEXT: usize = 3;

pub struct TextDiff<'a> { pub hunks: Vec<Hunk<'a>>, pub added: usize, pub removed: usize }
pub struct Hunk<'a> {
    pub from_start: usize, pub from_count: usize,
    pub to_start: usize,   pub to_count: usize,
    pub lines: Vec<DiffLine<'a>>,
}
pub enum LineKind { Context, Removed, Added }
pub struct DiffLine<'a> {
    pub kind: LineKind,
    pub from_line: Option<usize>,    // 1-based
    pub to_line: Option<usize>,
    pub text: &'a str,               // without "\n"; keeps "\r" of "\r\n"
    pub emphasis: Vec<Range<usize>>, // byte ranges into `text`, sorted, non-adjacent
    pub missing_newline: bool,
}

pub fn diff<'a>(from: &'a str, to: &'a str, context: usize) -> TextDiff<'a>;
pub fn unified(diff: &TextDiff, from_label: &str, to_label: &str) -> String; // pre-sized
pub fn unified_into(diff: &TextDiff, from_label: &str, to_label: &str, out: &mut impl io::Write) -> io::Result<()>;
```

- `context: usize`; any value ≥ max line count means full context. Adapters convert from `u32`.
- `emphasis` is empty for context lines and unpaired lines. Adapters derive segments (`[{text, emphasized}]`) from `text` + `emphasis` at the boundary.
- Pairing information for side-by-side/split views is not stored: consumers pair the i-th removed with the i-th added line within a contiguous change run (GNU `diff -y` behaviour).
- `unified_into` streams to a writer (CLI uses a `BufWriter` on stdout); `unified` computes the exact output length first and writes into one allocation.
- Alternative considered: owned `String` segments per line — rejected; 100k+ allocations for full-context or divergent multi-MB inputs.

### D2. Diff engine — `imara-diff` 0.2 with a byte-level fast path

- Engine: `imara-diff` (Apache-2.0; deps `hashbrown`, `memchr`; no `Instant`, no threads, builds on wasm32). Its Myers implementation includes GNU diff/git cost heuristics that bound pathological inputs, which `similar` lacks (`similar` is up to ~30× slower on large inputs and its deadline API panics on `wasm32-unknown-unknown`). No slider/indent post-processing in v1, so results equal plain heuristic Myers and the fast-path equivalence below is exact.
- **Fast path (the sub-millisecond lever):** before interning, compute the common byte prefix and suffix of the two inputs (chunked `u64`/SIMD compare), snap both to line boundaries (prefix ends after a `\n`; suffix starts after a `\n` or at text start; prefix and suffix never overlap in either input), and run `imara-diff` only on the differing middle. This avoids hashing/interning megabytes of unchanged lines, which alone costs milliseconds at 10 MB.
  - Identical inputs: equality check, return empty — no line counting.
  - Line numbers: count `\n` in the trimmed prefix with SIMD byte counting (`bytecount`), only when a hunk exists.
  - Context lines are sliced from the prefix/suffix by scanning backwards/forwards at most N lines (`memchr::memrchr`/`memchr`), never the whole prefix.
- Hunk grouping and `diff -u` ranges are our own code over the engine's change list (ranges offset by the prefix line count).
- Unified rendering is our own, so header format (`--- label`, no timestamp), `,1` omission and `\ No newline at end of file` placement are under test control. Expected strings captured from GNU `diff -u --label a --label b` are committed as fixtures; tests do not shell out.
- Correctness guard: a property test (`proptest`, dev-dependency) asserts (1) fast path == engine on the untrimmed input, and (2) reconstructing "to" from "from" + result is byte-exact, over generated inputs with repeated lines, CRLF, missing final newlines, empty sides and multibyte characters.
- Alternatives: `similar` (slower, no pathological bounds, wasm deadline panic), `diff` crate (no hunks), hand-rolled Myers (needless risk).

### D3. Intra-line emphasis

- Tokens: maximal runs of `char::is_alphanumeric() || '_'`, maximal runs of whitespace, any other single char.
- Within each contiguous change run, pair removed[i] with added[i]. Per pair: strip the common byte prefix/suffix and snap each back to a token boundary (so `abc`→`abd` emphasizes the whole token); tokenize only the middles. If either middle exceeds 2,000 tokens, emphasize each whole middle; otherwise diff the token middles with `imara-diff` (interned tokens).
- Similarity = 2 × (prefix + suffix + equal-middle bytes) / (bytes of both lines). Emphasis kept only when similarity ≥ 0.5.
- Cost is linear in changed-line bytes plus bounded token diffs, so a one-value edit in a 10 MB minified line is a prefix/suffix scan.

### D4. CLI — args, inputs, rendering, exit status

- `crates/cli/src/args/string.rs`: `StringOperation::Diff(DiffArgs)` with `inputs: Vec<String>` (`num_args = 0..=2`), `--from-file`, `--to-file` (`PathBuf`), `-U/--unified <N>` (default 3), `-y/--side-by-side`, `-W/--width <N>` (default 130, requires `side_by_side`), `--label <TEXT>` (`action = Append`, max 2 validated), `--color <WHEN>` (`ValueEnum`: auto/always/never), `--exit-code`.
- Source resolution lives in a small function returning `(Source, Source)` with `enum Source { Literal(String), File(PathBuf), Stdin }`, validated before any IO (count mismatch, double stdin). Reading stdin uses a new `input.rs` helper that reads raw bytes without trimming, reusing the existing TTY check and error messages; UTF-8 validation errors name the side (`from`/`to`).
- Rendering in `crates/cli/src/handlers/diff_render.rs` (unified-colour and side-by-side). Colour is applied by wrapping already-rendered pieces, so stripping ANSI yields exactly `core::unified` output (testable invariant). Colours: header `\x1b[1m`, hunk `\x1b[36m`, removed `\x1b[31m`, added `\x1b[32m`, emphasis `\x1b[7m` … `\x1b[27m`, reset `\x1b[m` — git defaults.
- Side-by-side: column width = `(W - 3) / 2` with gutter ` X ` (X ∈ space,`|`,`<`,`>`); tabs expanded to 8-col stops; truncation and padding by display width using `unicode-width`. Colour mode colours left removed text red and right added text green with emphasis.
- `auto` colour: `std::io::stdout().is_terminal()` and `NO_COLOR` unset/empty.
- Exit status: a dedicated `text diff` branch in `main.rs` calls the diff handler, which returns `Result<DiffOutput { bytes: Vec<u8>, differs: bool }, String>`; the branch maps it to the exit status. Alternative rejected: a generic `CommandOutput { bytes, exit_code }` for all handlers — touches every handler for one command's need. Errors exit 2 when `--exit-code` is set, else 1.
- Trailing newline: `main.rs` appends `\n`; the diff branch writes the rendered output as-is (already newline-terminated) and writes nothing for identical inputs.
- Performance: files read with one `std::fs::read` + `String::from_utf8` (no copy); rendering streams through `BufWriter<StdoutLock>` (64 KiB) via `unified_into`/side-by-side writers instead of building the whole output in memory; colour escapes are written inline, never via a post-pass.

### D5. Browser WASM — `crates/wasm/src/string_ops.rs`

- `text_diff(from: &str, to: &str, context: u32) -> String` returning JSON: `{ "hunks": [{ "fromStart", "fromCount", "toStart", "toCount", "lines": [{ "kind": "context"|"removed"|"added", "fromLine": n|null, "toLine": n|null, "segments": [{ "text", "emphasized" }], "missingNewline" }] }], "added", "removed" }`.
- `text_diff_unified(from: &str, to: &str, context: u32, from_label: &str, to_label: &str) -> String`.
- `context == u32::MAX` maps to full context; any value ≥ line counts behaves the same anyway.

### D6. Portable WASM — `crates/wasm-portable`

WIT additions (bump package to `strapd:tools@0.2.0` and update `docs/usage.md` reference):

```wit
enum diff-line-kind { context, removed, added }
record diff-segment { text: string, emphasized: bool }
record diff-line { kind: diff-line-kind, from-line: option<u32>, to-line: option<u32>,
                   segments: list<diff-segment>, missing-newline: bool }
record diff-hunk { from-start: u32, from-count: u32, to-start: u32, to-count: u32, lines: list<diff-line> }
record text-diff-result { hunks: list<diff-hunk>, added: u32, removed: u32 }
export text-diff: func(from: string, to: string, context: u32) -> text-diff-result;
export text-diff-unified: func(from: string, to: string, context: u32, from-label: string, to-label: string) -> string;
```

Add both forms to `tests/adapter.rs` and `tests/contract.py` with a shared fixture whose expected unified text matches the CLI.

### D7. WebApp — design brief (impeccable, Operate mode, established world)

Visual authority: `DESIGN.md` (refinement inside the incumbent world; no new fonts, no new accent). The diff is the one place where semantic red/green is earned; blue stays reserved for focus/selection/primary action.

**Job:** a developer pastes two versions of a snippet and needs to see, at a glance, exactly what changed and grab a patch. Success = the changed token is findable in under a second.

**Layout & hierarchy (top → bottom):**
1. Tool header (existing pattern).
2. Inputs: two equal monospace textareas side by side ≥ `md`, stacked below; labels "Original" / "Changed"; a compact icon "Swap" button between labels (aria-label "Swap original and changed").
3. Toolbar row (Inter, small): segmented control `Unified | Split` (split disabled with tooltip below `md`), context select `3 lines | 10 lines | Full`, totals `+N −M` (green/red text using the diff fg tokens plus the literal signs), right-aligned Copy patch (existing copy-button style).
4. Diff viewer: one bordered panel (`rounded.md`, Border Gray, Panel White / Dark Panel), JetBrains Mono 0.875rem, no shadow.
   - Row anatomy (unified): `[from #][to #][sign] content`. Number gutters muted, right-aligned, `user-select: none`; sign column `-`/`+`/space.
   - Hunk header rows: Muted Panel background, muted text, `@@ -a,b +c,d @@`.
   - Split: each row is one grid row with left and right halves (each with own number + sign + content), so wrapped lines stay aligned; filler cells use a subtle hatched or Muted Panel background.
   - Long lines wrap (`white-space: pre-wrap; overflow-wrap: anywhere`); no horizontal scroll inside rows.
   - Missing newline shown as a muted `⏎̸`-style marker with sr-only text "No newline at end of file".

**Colour tokens to add to DESIGN.md (`colors`):**

| Token | Light | Dark |
|---|---|---|
| diff-removed-bg | `#ffebe9` | `rgba(248, 81, 73, 0.15)` |
| diff-removed-emphasis | `#ffc1ba` | `rgba(248, 81, 73, 0.40)` |
| diff-removed-fg (sign, totals) | `#cf222e` | `#ff7b72` |
| diff-added-bg | `#e6ffec` | `rgba(46, 160, 67, 0.15)` |
| diff-added-emphasis | `#abf2bc` | `rgba(46, 160, 67, 0.40)` |
| diff-added-fg | `#1a7f37` | `#3fb950` |

Body text on tinted rows keeps Ink / Dark Ink (contrast ≥ 4.5:1 on every tint, verify). Emphasis uses background only, with a 2px radius; no bold, no underline (avoids reflow).

**States:**
- Both empty: muted guidance "Paste text into both fields to compare."
- One empty: diff renders normally (all added/removed).
- Identical: inline success state "No differences" (neutral icon + text, not a toast).
- Large output: render the first 2,000 rows, then a "Show all N lines" button; computation runs through the existing auto-process debounce.
- Long lines: lines over 2,000 characters render elided around their emphasized ranges (`…` with "Show full line" button), so a 10 MB minified line never becomes a 10 MB DOM text node by default.

**Performance (WebApp):** the viewer is a plain keyed list (no per-row component state, no context providers per row); segments render as `<span>`s only for emphasized ranges; `React.memo` on rows keyed by hunk/line index; no virtualisation library in v1 (the 2,000-row cap bounds DOM size). Input change → WASM call → `JSON.parse` → render must stay within one frame for the 1 MB localized scenario; the browser benchmark (D8) measures it.

**Accessibility:** controls are native buttons/select/radio-group; segmented control is a `radiogroup` with arrow-key support; each changed row has visually hidden "Removed line" / "Added line" (and emphasized spans need no extra announcement); viewer is a `role="table"`-free list of `pre`-like rows with an `aria-label="Diff"` region; focus ring = Focus Blue.

**Anti-goals:** no animated transitions on rows, no gradients, no green "success" banners, no blue tints in the viewer, no syntax highlighting.

**Components/files:** `webapp/src/components/tools/string/diff-tool.tsx` (container + inputs + toolbar) and `diff-viewer.tsx` (pure presentational, takes the parsed model + view mode + context); tool definition `string-diff` in `string-tools.ts` (aliases `diff`, `compare`, `delta`, `patch`, `text diff`); `stringUtils.diff` in `webapp/src/lib/utils/string`; wrapper methods in `webapp/src/lib/wasm/index.ts`. Copy-patch labels: `original` / `changed`. Tests: `diff-viewer.test.tsx` (unified/split rows, filler, emphasis spans, sr text, identical/empty states) and a tool-definition test.

### D8. Performance engineering and benchmarks

**Where time goes at 10 MB (≈200k lines/side)** — and why each budget tier is reachable:

| Tier | Dominant cost | Lever |
|---|---|---|
| Identical | one equality compare of 10 MB (memory-bandwidth bound, ~0.2–0.4 ms) | early return before any tokenizing |
| Localized edit | prefix/suffix compare + SIMD `\n` count of the prefix | D2 fast path; engine sees only a few lines |
| Single-line edit | prefix/suffix compare at line level, then again at token level | D2 + D3 trimming; middle is a few tokens |
| Scattered 1% | interning ~200k lines (hashing 10 MB) + Myers with D≈4k | `imara-diff` interning (hashbrown + fast hasher); no extra copies |
| Completely different | Myers heuristics cap the search; emphasis on every pair | heuristics bound cost; emphasis pairs mostly fail the similarity check after a cheap prefix/suffix pass |

**Allocation discipline:** zero-copy model (D1); hunks/lines `Vec`s reserved from change counts; emphasis `Vec` only for paired lines; `unified` pre-computes output length. No `String` per line anywhere in core.

**Benchmark suite (`crates/core/benches/text_diff.rs`, `criterion`, `harness = false`):**
- Deterministic generators (seeded `rand_chacha` or a local xorshift; no committed multi-MB fixtures) producing code-like lines (~50 bytes avg, mixed identifiers/whitespace/punctuation) and minified JSON for the single-line tier.
- Groups: `diff/{identical,localized,single_line,scattered_1pct,divergent}/{1MB,10MB}` (core `diff()` only) and `unified/{localized,scattered_1pct,divergent}/{1MB,10MB}` reporting `Throughput::Bytes` of output.
- Additional scaling group at 100 KB / 1 MB / 10 MB for the identical/localized/single-line tiers to verify linear growth.
- Release profile for benches: `lto = "thin"`, `codegen-units = 1` under `[profile.bench]` (does not affect normal builds).
- Make targets: `make rust-bench` (`cargo bench -p strapd-core --bench text_diff $(BENCH_ARGS)`), so `BENCH_ARGS='-- --save-baseline main'` / `'-- --baseline main'` enable regression comparison. `make rust-lint` must compile benches (clippy `--all-targets`).
- CLI rendering bench (`crates/cli/benches/diff_render.rs`): coloured unified and side-by-side render to `io::sink()` for the localized/scattered tiers — guards against renderer regressions without process-startup noise.

**Browser WASM benchmark:** a Playwright spec (`webapp/e2e/text-diff.bench.ts`, excluded from `make webapp-e2e`, run by `make webapp-bench`) that loads the built app, generates the same scenarios in-page, and reports per scenario: (a) `performance.now()` around `wasmWrapper.text_diff` (end-to-end incl. string transfer and `JSON.parse`), and (b) time-to-rendered-diff for the 1 MB localized scenario. Report-only (no CI gate) — browser timing is too noisy to gate.

**SIMD in WASM (decided):** the browser build (`make wasm-build`) enables `-C target-feature=+simd128` as a single SIMD-only build (no fallback build; requires Chrome/Edge 91+, Firefox 89+, Safari 16.4+) **if** the browser benchmark shows a material gain on the byte-scanning tiers; the before/after numbers are recorded in `docs/performance.md`. The portable package stays on baseline WASM (no `simd128`) to keep its host contract; a separate SIMD variant is out of scope.

**Recording results:** `docs/performance.md` — reference machine, command, medians per scenario/size for native, WASM (in-module and end-to-end), and the CLI renderer; updated when budgets change.

**CI:** benches compile in CI via `make rust-lint`; timings are not gated in CI (shared runners are too noisy for sub-ms budgets).

## Risks / Trade-offs

- [Scattered/divergent tiers cannot be sub-ms at 10 MB: interning alone hashes all 10 MB] → tiered budgets; sub-ms promised only where work is proportional to the change, not the input.
- [Myers heuristics produce non-minimal diffs on large divergent inputs] → spec permits it; validity guaranteed by property test.
- [Fast-path trimming diverges from engine results] → exact-equality property test (D2); no slider post-processing so equivalence holds.
- [Browser main thread blocked on divergent multi-MB inputs (~hundreds of ms)] → debounce via auto-process, 2,000-row cap, line elision. Web Worker offload deferred until the browser benchmark shows the 1 MB tiers miss one frame.
- [String transfer JS→WASM (UTF-16→UTF-8 encode) costs ~1–5 ms per 10 MB, outside our control] → measured separately in the browser benchmark; native budgets apply to core only.
- [Myers may align ambiguous edits differently from GNU diff's heuristics] → spec only requires byte-identity for unambiguous fixtures; patches remain valid regardless.
- [`imara-diff` 0.2 or `hashbrown` hasher pulling `getrandom`/`Instant` on wasm32] → verify browser and portable builds in task 1; pin versions.
- [Positional `-` cannot diff the literal text `-`] → documented; use a file or stdin for that edge case.
- [Display-width truncation in side-by-side for combining marks/emoji ZWJ sequences] → `unicode-width` is approximate for ZWJ; acceptable, gutter stays aligned per computed width.
- [WIT version bump] → additive only; documented in CHANGELOG and usage docs.

## Migration Plan

Additive. No migration; rollback is reverting the change. Release notes in CHANGELOG under the next minor version.
