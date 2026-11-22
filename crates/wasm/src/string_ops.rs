use serde::Serialize;
use strapd_core::string::{
    self,
    diff::{self, DiffLine, LineKind},
};
use wasm_bindgen::prelude::*;

#[cfg(test)]
#[path = "../tests/unit/text_diff.rs"]
mod tests;

#[wasm_bindgen]
pub fn string_to_uppercase(input: &str) -> String {
    string::case::to_uppercase(input)
}

#[wasm_bindgen]
pub fn string_to_lowercase(input: &str) -> String {
    string::case::to_lowercase(input)
}

#[wasm_bindgen]
pub fn string_to_capitalcase(input: &str) -> String {
    string::case::to_capitalcase(input)
}

// Analysis
#[wasm_bindgen]
pub fn string_count_lines(input: &str) -> usize {
    string::analysis::count_lines(input)
}

#[wasm_bindgen]
pub fn string_count_words(input: &str) -> usize {
    string::analysis::count_words(input)
}

#[wasm_bindgen]
pub fn string_count_chars(input: &str) -> usize {
    string::analysis::count_chars(input)
}

#[wasm_bindgen]
pub fn string_count_bytes(input: &str) -> usize {
    string::analysis::count_bytes(input)
}

// Transform
#[wasm_bindgen]
pub fn string_reverse(input: &str) -> String {
    string::transform::reverse(input)
}

#[wasm_bindgen]
pub fn string_replace(input: &str, search: &str, replacement: &str) -> String {
    string::transform::replace(input, search, replacement)
}

#[wasm_bindgen]
pub fn string_slugify(input: &str, separator: char) -> String {
    string::transform::slugify(input, separator)
}

// Whitespace
#[wasm_bindgen]
pub fn string_trim(input: &str, left: bool, right: bool, all: bool) -> String {
    string::whitespace::trim(input, left, right, all)
}

#[derive(Serialize)]
struct DiffResult<'a> {
    hunks: Vec<DiffHunk<'a>>,
    added: usize,
    removed: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DiffHunk<'a> {
    from_start: usize,
    from_count: usize,
    to_start: usize,
    to_count: usize,
    lines: Vec<WireLine<'a>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WireLine<'a> {
    kind: &'static str,
    from_line: Option<usize>,
    to_line: Option<usize>,
    segments: Vec<DiffSegment<'a>>,
    missing_newline: bool,
}

#[derive(Serialize)]
struct DiffSegment<'a> {
    text: &'a str,
    emphasized: bool,
}

impl<'a> From<DiffLine<'a>> for WireLine<'a> {
    fn from(line: DiffLine<'a>) -> Self {
        let content = line.content();
        let mut segments = Vec::with_capacity(line.emphasis.len() * 2 + 1);
        let mut end = 0;
        for range in line.emphasis {
            if end < range.start {
                segments.push(DiffSegment {
                    text: &content[end..range.start],
                    emphasized: false,
                });
            }
            end = range.end;
            segments.push(DiffSegment {
                text: &content[range],
                emphasized: true,
            });
        }
        if end < content.len() || segments.is_empty() {
            segments.push(DiffSegment {
                text: &content[end..],
                emphasized: false,
            });
        }
        Self {
            kind: match line.kind {
                LineKind::Context => "context",
                LineKind::Removed => "removed",
                LineKind::Added => "added",
            },
            from_line: line.from_line,
            to_line: line.to_line,
            segments,
            missing_newline: line.missing_newline,
        }
    }
}

#[wasm_bindgen]
pub fn text_diff(from: &str, to: &str, context: u32) -> String {
    let result = diff::diff(from, to, context as usize);
    let wire = DiffResult {
        hunks: result
            .hunks
            .into_iter()
            .map(|hunk| DiffHunk {
                from_start: hunk.from_start,
                from_count: hunk.from_count,
                to_start: hunk.to_start,
                to_count: hunk.to_count,
                lines: hunk.lines.into_iter().map(WireLine::from).collect(),
            })
            .collect(),
        added: result.added,
        removed: result.removed,
    };
    serde_json::to_string(&wire).expect("the diff wire model is JSON serializable")
}

#[wasm_bindgen]
pub fn text_diff_unified(
    from: &str,
    to: &str,
    context: u32,
    from_label: &str,
    to_label: &str,
) -> String {
    diff::unified(
        &diff::diff(from, to, context as usize),
        from_label,
        to_label,
    )
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = performance, js_name = now)]
    fn performance_now() -> f64;
}

/// Measures a batch after the input strings have crossed the WASM boundary.
#[wasm_bindgen]
pub fn text_diff_benchmark(from: &str, to: &str, context: u32, iterations: u32) -> f64 {
    let start = performance_now();
    for _ in 0..iterations {
        let result = diff::diff(
            std::hint::black_box(from),
            std::hint::black_box(to),
            context as usize,
        );
        std::hint::black_box(result);
    }
    (performance_now() - start) / f64::from(iterations.max(1))
}
