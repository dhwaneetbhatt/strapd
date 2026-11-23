# text-diff Specification

## Purpose

Lets developers compare two texts offline and read the differences in the conventional unified diff format in the terminal and as colour-coded line deltas in the WebApp, with identical results across every strapd interface and predictable performance on multi-megabyte inputs.

## Requirements

### Requirement: Line diff semantics
The system SHALL compare two UTF-8 texts ("from" and "to") line by line using the Myers algorithm with git/GNU-diff style cost heuristics and SHALL produce a deterministic result. For large, highly divergent inputs the heuristics MAY produce a non-minimal diff, but every result SHALL be valid: applying it to "from" SHALL reproduce "to" exactly. A line SHALL include its terminator; a final line without a terminator SHALL be distinguishable from the same line with one. `\r\n` and `\n` SHALL be treated as different terminators. Unchanged lines SHALL be context, lines only in "from" SHALL be removed and lines only in "to" SHALL be added. Within each change block, removed lines SHALL precede added lines.

#### Scenario: Identical texts
- **WHEN** "from" and "to" are byte-identical, including both being empty
- **THEN** the result contains no hunks and zero added and removed lines

#### Scenario: Single line replaced
- **WHEN** "from" is `a\nb\nc\n` and "to" is `a\nB\nc\n`
- **THEN** the result contains one hunk with context `a`, removed `b`, added `B`, context `c`

#### Scenario: Missing final newline
- **WHEN** "from" is `a\n` and "to" is `a`
- **THEN** the result reports line `a` as removed and re-added and marks the added line as having no terminating newline

#### Scenario: Deterministic output
- **WHEN** the same pair of texts and options is diffed repeatedly or through different interfaces
- **THEN** every result is identical

#### Scenario: Validity on arbitrary input
- **WHEN** any pair of texts, including large and highly divergent ones, is diffed
- **THEN** reconstructing "to" from "from" and the result yields "to" byte for byte

### Requirement: Hunks and context
The system SHALL group changes into hunks surrounded by up to N unchanged context lines, where N defaults to 3. Changes separated by at most 2N unchanged lines SHALL share one hunk. Each hunk SHALL report the 1-based start line and line count for both sides, following `diff -u` conventions: a side with zero lines in the hunk SHALL report the line before the hunk as its start. Every line SHALL carry its line number on each side where it exists. Requesting full context SHALL produce a single hunk spanning both texts whenever any difference exists.

#### Scenario: Distant changes produce separate hunks
- **WHEN** two changed lines are separated by 10 unchanged lines and N is 3
- **THEN** the result contains two hunks, each with at most 3 context lines on either side

#### Scenario: Zero context
- **WHEN** N is 0
- **THEN** hunks contain only removed and added lines

#### Scenario: Insertion into empty text
- **WHEN** "from" is empty and "to" is `x\n`
- **THEN** the hunk range is `-0,0 +1`

#### Scenario: Line numbers deep in large input
- **WHEN** a single line is changed at line 150,000 of a multi-megabyte text
- **THEN** the hunk reports start lines and per-line numbers that match the line's actual position

### Requirement: Intra-line change emphasis
For changed lines, the system SHALL split each removed and added line into ordered segments whose concatenation equals the line text without its terminator, marking segments as emphasized when they differ from the paired line. Tokens SHALL be runs of word characters, runs of whitespace or single other characters. A removed line and an added line SHALL be paired only when they occupy corresponding positions in the same change block and at least half of their combined token content is shared; unpaired lines SHALL contain a single non-emphasized segment. Shared leading and trailing tokens of a pair SHALL always be identified exactly. When the remaining differing middle of either line exceeds 2,000 tokens, that whole middle SHALL be emphasized as one segment instead of being compared token by token.

#### Scenario: Word change within a line
- **WHEN** `let timeout = 30;` is replaced by `let timeout = 60;`
- **THEN** only `30` in the removed line and `60` in the added line are emphasized

#### Scenario: Unrelated replacement is not emphasized
- **WHEN** `alpha beta gamma` is replaced by `1234567`
- **THEN** neither line contains emphasized segments

#### Scenario: Edit inside a very long line
- **WHEN** one value changes inside a multi-megabyte single-line document such as minified JSON
- **THEN** only the changed token is emphasized and the operation stays within its performance budget

### Requirement: Unified patch rendering
The system SHALL render a diff as unified text compatible with `diff -u` and `git apply`: a `--- <from-label>` line, a `+++ <to-label>` line, then for each hunk a header `@@ -<start>[,<count>] +<start>[,<count>] @@` (omitting `,<count>` when the count is 1) followed by lines prefixed with a space, `-` or `+`. A line without a terminating newline SHALL be followed by `\ No newline at end of file`. Identical inputs SHALL render as empty output.

#### Scenario: Patch matches GNU diff
- **WHEN** two texts whose minimal line edit is unambiguous are rendered with labels `a` and `b`
- **THEN** the output is byte-identical to `diff -u --label a --label b` on the same content

#### Scenario: Patch applies cleanly
- **WHEN** the rendered patch is applied to the "from" text with a standard patch tool
- **THEN** the result equals the "to" text

### Requirement: Performance budgets
The project SHALL include a reproducible benchmark suite for the diff that generates deterministic inputs at 1 MB and 10 MB per side and measures the core comparison and the uncoloured unified rendering separately. On the reference machine (Apple Silicon, release build, single thread), the median core comparison time with default context SHALL meet these budgets:

| Scenario | 1 MB | 10 MB |
|---|---|---|
| Identical inputs | ≤ 0.1 ms | ≤ 1 ms |
| One localized edit (≤ 10 changed lines) in multi-line text | ≤ 0.2 ms | ≤ 1 ms |
| One edit inside a single-line document | ≤ 0.2 ms | ≤ 1 ms |
| 1% of lines changed, uniformly scattered | ≤ 3 ms | ≤ 30 ms |
| Completely different inputs | ≤ 50 ms | ≤ 1 s |

Unified rendering SHALL sustain at least 1 GB/s of output. Time SHALL grow no worse than linearly with input size for the identical, localized and single-line scenarios. Budgets for the scattered and completely different scenarios are initial targets; they SHALL be revised only with recorded measurements and maintainer approval. Measured results SHALL be recorded in the repository's performance documentation.

#### Scenario: Benchmarks are reproducible
- **WHEN** a maintainer runs the documented benchmark command twice on the reference machine
- **THEN** both runs use identical generated inputs and report medians per scenario and size

#### Scenario: Sub-millisecond localized diff
- **WHEN** a 10 MB text is compared with a copy containing one edited line in the middle
- **THEN** the median core comparison time is at most 1 ms

#### Scenario: No pathological blow-up
- **WHEN** two unrelated 10 MB texts are compared
- **THEN** the comparison completes within its budget and returns a valid diff

#### Scenario: WASM overhead is measured
- **WHEN** the browser benchmark runs the same scenarios through the browser WASM module
- **THEN** it reports the in-module comparison time and the end-to-end call time including string transfer, so overhead relative to native is visible

### Requirement: CLI diff command
The CLI SHALL provide `strapd text diff` (also under the `string` and `str` command aliases). The "from" side SHALL come from `--from-file <PATH>` or, otherwise, the first positional argument; the "to" side SHALL come from `--to-file <PATH>` or, otherwise, the next positional argument. A positional value of `-` SHALL read that side from stdin, which may be used for at most one side. Positional values SHALL otherwise be literal text and SHALL be used exactly as supplied. Stdin and file content SHALL be used exactly as read, without trimming. Default labels SHALL be the file path for files, `-` for stdin, and `a` and `b` for literal text; up to two `--label <TEXT>` options SHALL override the from and to labels in order.

#### Scenario: Two literal arguments
- **WHEN** a user runs `strapd text diff 'a b' 'a c'`
- **THEN** stdout contains a unified diff labelled `a` and `b`

#### Scenario: Files
- **WHEN** a user runs `strapd text diff --from-file old.yaml --to-file new.yaml`
- **THEN** both files are compared and the labels are their paths

#### Scenario: One side from stdin
- **WHEN** a user runs `cat new.txt | strapd text diff --from-file old.txt -`
- **THEN** the piped content, including trailing newlines, is the "to" side

#### Scenario: Invalid input sources
- **WHEN** a side is missing, more than two sides are supplied, both sides use `-`, a file cannot be read, a file or stdin is not valid UTF-8, or `-` is used while stdin is interactive
- **THEN** the command exits unsuccessfully with an error naming the affected side and writes nothing to stdout

### Requirement: CLI output formats
The CLI SHALL emit unified output by default. `-U/--unified <N>` SHALL set the context line count. `-y/--side-by-side` SHALL emit two columns in GNU `diff -y` style: each row shows the from line, a gutter marker and the to line, where the marker is a space for unchanged lines, `|` for paired changed lines, `<` for removed-only lines and `>` for added-only lines; hunks SHALL be separated by their `@@` header. `-W/--width <N>` SHALL set the total side-by-side width, defaulting to 130 columns; tabs SHALL be expanded to 8-column stops and column contents SHALL be truncated to the available display width. Identical inputs SHALL produce empty stdout in every format. Output SHALL end with exactly one newline when non-empty. Output SHALL be written through a buffered writer so large diffs do not incur per-line system calls.

#### Scenario: Custom context
- **WHEN** a user runs `strapd text diff -U 1 <from> <to>`
- **THEN** each hunk has at most 1 context line on either side

#### Scenario: Side-by-side output
- **WHEN** a user runs `strapd text diff -y` on texts with an edited line and an added line
- **THEN** the edited line shows `|` between both versions and the added line shows `>` with an empty left column

#### Scenario: Wide characters
- **WHEN** side-by-side output contains CJK or emoji characters wider than the column
- **THEN** every row keeps the gutter aligned at the same display column

### Requirement: CLI colour
The CLI SHALL accept `--color auto|always|never`, defaulting to `auto`. `auto` SHALL emit colour only when stdout is a terminal and `NO_COLOR` is not set to a non-empty value. Coloured output SHALL follow git's default scheme: bold file headers, cyan hunk headers, red removed lines, green added lines, and reverse-video emphasis for intra-line changed segments. Removing ANSI escape sequences from coloured output SHALL yield the uncoloured output exactly.

#### Scenario: Piped output is plain
- **WHEN** output is redirected to a file or pipe with the default colour mode
- **THEN** the output contains no ANSI escape sequences

#### Scenario: Forced colour
- **WHEN** a user runs with `--color always` and a word changed within a line
- **THEN** removed and added lines are red and green and only the changed word is reverse-video emphasized

### Requirement: CLI exit status
By default the diff command SHALL exit 0 whether or not differences exist, and exit 1 on error. With `--exit-code`, it SHALL exit 0 when the inputs are identical, 1 when they differ and 2 on error.

#### Scenario: Script detects differences
- **WHEN** a script runs `strapd text diff --exit-code` on differing inputs
- **THEN** the diff is printed and the exit status is 1

#### Scenario: Error with exit-code mode
- **WHEN** `--exit-code` is set and a file cannot be read
- **THEN** the exit status is 2

### Requirement: WASM interfaces
The browser WASM module and the portable WIT package SHALL each expose the structured diff (hunks with ranges, typed lines with kind, optional from/to line numbers, segments with emphasis, missing-newline flag, and added/removed totals) for a pair of texts and a context line count, and SHALL expose the unified patch text for a pair of texts, context count and two labels. A context value at or above the larger line count SHALL behave as full context. The size of returned data SHALL be proportional to the lines inside hunks, not to the input size. These operations SHALL return the same results as the CLI for the same inputs and SHALL not fail for valid UTF-8 input. Existing exports SHALL remain unchanged.

#### Scenario: Browser and portable parity
- **WHEN** the same texts are diffed through the browser module, the portable core module and the portable component
- **THEN** the structured results and unified texts are equivalent to each other and to the CLI's uncoloured unified output

#### Scenario: Small result for large input
- **WHEN** two 10 MB texts differing in one line are diffed with default context
- **THEN** the returned structured result contains only that hunk's lines

### Requirement: WebApp diff tool
The WebApp SHALL provide a "Text Diff" tool in the string category, discoverable by search for `diff`, `compare` and `patch`, with labelled "Original" and "Changed" monospace inputs. It SHALL update the diff automatically as either input changes. Removed lines SHALL use a red tint and added lines a green tint, with intra-line emphasized segments in a stronger tint of the same hue; each line SHALL also show a `-` or `+` marker and its line numbers so colour is never the only signal. The tool SHALL offer a unified/split view toggle, context selection of 3 lines, 10 lines or full text, a swap action that exchanges the inputs, `+added −removed` totals, and a copy action that copies the unified patch. The tool SHALL not be offered as a pipe step. For a 1 MB input pair with a localized edit, the diff SHALL be visible within one animation frame (16 ms) after processing starts; the viewer SHALL render at most 2,000 rows initially and lines longer than 2,000 characters SHALL be elided around their emphasized segments with an option to expand.

#### Scenario: Viewing a change
- **WHEN** a user pastes two versions of a config with one edited value
- **THEN** the diff shows the old line in red and new line in green with the edited value emphasized, and the totals read `+1 −1`

#### Scenario: Split view
- **WHEN** a user selects split view
- **THEN** removed lines appear in the left column and added lines in the right column, with paired lines on the same row and blank filler opposite unpaired lines

#### Scenario: No differences
- **WHEN** both inputs are non-empty and identical
- **THEN** the tool states that there are no differences instead of rendering an empty viewer

#### Scenario: Copy patch
- **WHEN** a user activates copy
- **THEN** the clipboard contains the unified patch labelled `original` and `changed`

#### Scenario: Large input remains responsive
- **WHEN** a user pastes a 1 MB document and a copy with one edited line
- **THEN** the diff appears without a perceptible stall and only the edited hunk is rendered

#### Scenario: Keyboard and assistive technology
- **WHEN** a keyboard-only or screen reader user operates the tool
- **THEN** every control is reachable and operable by keyboard with visible focus, and each changed line is announced as removed or added

#### Scenario: Narrow screens
- **WHEN** the viewport is narrower than the split breakpoint
- **THEN** inputs stack vertically and the diff is shown in unified view
