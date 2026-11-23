use super::{common_prefix, common_suffix};
use imara_diff::{Algorithm, Diff, InternedInput};
use std::ops::Range;

const TOKEN_LIMIT: usize = 2_000;

fn class(c: char) -> u8 {
    if c.is_alphanumeric() || c == '_' {
        1
    } else if c.is_whitespace() {
        2
    } else {
        0
    }
}

fn boundary(text: &str, pos: usize) -> bool {
    if pos == 0 || pos == text.len() {
        return true;
    }
    if !text.is_char_boundary(pos) {
        return false;
    }
    let left = class(text[..pos].chars().next_back().unwrap());
    let right = class(text[pos..].chars().next().unwrap());
    left == 0 || left != right
}

fn tokens(text: &str) -> Vec<&str> {
    let mut result = Vec::new();
    let mut start = 0;
    let mut previous = 0;
    for (i, c) in text.char_indices() {
        let current = class(c);
        if i != start && (current == 0 || current != previous) {
            result.push(&text[start..i]);
            start = i;
            if result.len() > TOKEN_LIMIT {
                return result;
            }
        }
        previous = current;
    }
    if start < text.len() {
        result.push(&text[start..]);
    }
    result
}

pub(super) fn compare(a: &str, b: &str) -> (Vec<Range<usize>>, Vec<Range<usize>>) {
    let prefix = common_prefix(a.as_bytes(), b.as_bytes());
    let suffix = common_suffix(a.as_bytes(), b.as_bytes());
    compare_with_edges(a, b, prefix, suffix)
}

pub(super) fn compare_with_edges(
    a: &str,
    b: &str,
    mut prefix: usize,
    suffix: usize,
) -> (Vec<Range<usize>>, Vec<Range<usize>>) {
    while !boundary(a, prefix) || !boundary(b, prefix) {
        prefix -= 1;
    }
    let mut suffix = suffix.min(a.len() - prefix).min(b.len() - prefix);
    while !boundary(a, a.len() - suffix) || !boundary(b, b.len() - suffix) {
        suffix -= 1;
    }
    let a_end = a.len() - suffix;
    let b_end = b.len() - suffix;
    let a_tokens = tokens(&a[prefix..a_end]);
    let b_tokens = tokens(&b[prefix..b_end]);
    let mut equal = prefix + suffix;
    let mut a_ranges = Vec::new();
    let mut b_ranges = Vec::new();
    if a_tokens.len() > TOKEN_LIMIT || b_tokens.len() > TOKEN_LIMIT {
        if prefix < a_end {
            a_ranges.push(prefix..a_end);
        }
        if prefix < b_end {
            b_ranges.push(prefix..b_end);
        }
    } else {
        let mut input = InternedInput::default();
        input.reserve(a_tokens.len() as u32, b_tokens.len() as u32);
        input.update_before(a_tokens.iter().copied());
        input.update_after(b_tokens.iter().copied());
        let changes = Diff::compute(Algorithm::Myers, &input);
        let a_offsets = offsets(&a_tokens, prefix);
        let b_offsets = offsets(&b_tokens, prefix);
        equal += a_end - prefix;
        for change in changes.hunks() {
            let ar = a_offsets[change.before.start as usize]..a_offsets[change.before.end as usize];
            let br = b_offsets[change.after.start as usize]..b_offsets[change.after.end as usize];
            equal -= ar.len();
            if !ar.is_empty() {
                a_ranges.push(ar);
            }
            if !br.is_empty() {
                b_ranges.push(br);
            }
        }
    }
    if equal.saturating_mul(4) < a.len() + b.len() {
        (Vec::new(), Vec::new())
    } else {
        (a_ranges, b_ranges)
    }
}

fn offsets(tokens: &[&str], start: usize) -> Vec<usize> {
    let mut position = start;
    std::iter::once(start)
        .chain(tokens.iter().map(|token| {
            position += token.len();
            position
        }))
        .collect()
}
