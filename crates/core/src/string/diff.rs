//! Borrowed line-oriented text differences.
use imara_diff::{Algorithm, Diff, InternedInput, Token, sources::lines};
use memchr::{memchr, memrchr};
use std::{io, ops::Range};

mod emphasis;

pub const DEFAULT_CONTEXT: usize = 3;

#[derive(Debug, Default, PartialEq, Eq)]
pub struct TextDiff<'a> {
    pub hunks: Vec<Hunk<'a>>,
    pub added: usize,
    pub removed: usize,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Hunk<'a> {
    pub from_start: usize,
    pub from_count: usize,
    pub to_start: usize,
    pub to_count: usize,
    pub lines: Vec<DiffLine<'a>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LineKind {
    Context,
    Removed,
    Added,
}

#[derive(Debug, PartialEq, Eq)]
pub struct DiffLine<'a> {
    pub kind: LineKind,
    pub from_line: Option<usize>,
    pub to_line: Option<usize>,
    /// Without LF; a CR belonging to a CRLF terminator is retained.
    pub text: &'a str,
    /// Sorted, non-adjacent byte ranges into the line content, on UTF-8 boundaries.
    pub emphasis: Vec<Range<usize>>,
    pub missing_newline: bool,
}

impl<'a> DiffLine<'a> {
    /// Returns the line text without its terminator.
    pub fn content(&self) -> &'a str {
        if self.missing_newline {
            self.text
        } else {
            self.text.strip_suffix('\r').unwrap_or(self.text)
        }
    }
}

/// Compares UTF-8 texts using heuristic Myers, without slider post-processing.
/// Context at or above the larger line count includes both complete texts.
pub fn diff<'a>(from: &'a str, to: &'a str, context: usize) -> TextDiff<'a> {
    if from == to {
        return TextDiff::default();
    }
    let byte_prefix = common_prefix(from.as_bytes(), to.as_bytes());
    let prefix = memrchr(b'\n', &from.as_bytes()[..byte_prefix]).map_or(0, |i| i + 1);
    let byte_suffix = common_suffix(&from.as_bytes()[prefix..], &to.as_bytes()[prefix..]);
    let suffix_start = from.len() - byte_suffix;
    let to_suffix_start = to.len() - byte_suffix;
    let suffix_start = if (suffix_start == prefix || from.as_bytes()[suffix_start - 1] == b'\n')
        && (to_suffix_start == prefix || to.as_bytes()[to_suffix_start - 1] == b'\n')
    {
        suffix_start
    } else {
        memchr(b'\n', &from.as_bytes()[suffix_start..]).map_or(from.len(), |i| suffix_start + i + 1)
    };
    let suffix = from.len() - suffix_start;
    let from_end = from.len() - suffix;
    let to_end = to.len() - suffix;
    let from_middle = &from[prefix..from_end];
    let to_middle = &to[prefix..to_end];
    let changes = if is_single_line(from_middle) && is_single_line(to_middle) {
        // The byte comparison has already proved these two line tokens unequal.
        // Supply their IDs directly instead of hashing two potentially enormous lines.
        let mut changes = Diff::default();
        changes.compute_with(Algorithm::Myers, &[Token(0)], &[Token(1)], 2);
        if prefix == 0 && suffix == 0 {
            let mut old = line(LineKind::Removed, from, Some(1), None);
            let mut new = line(LineKind::Added, to, None, Some(1));
            let (old_content, new_content) = (old.content(), new.content());
            let old_terminator = from.len() - old_content.len();
            let new_terminator = to.len() - new_content.len();
            let content_suffix = if old_terminator == new_terminator {
                byte_suffix.saturating_sub(old_terminator)
            } else {
                common_suffix(old_content.as_bytes(), new_content.as_bytes())
            };
            (old.emphasis, new.emphasis) = emphasis::compare_with_edges(
                old_content,
                new_content,
                byte_prefix.min(old_content.len()).min(new_content.len()),
                content_suffix,
            );
            return TextDiff {
                hunks: vec![Hunk {
                    from_start: 1,
                    from_count: 1,
                    to_start: 1,
                    to_count: 1,
                    lines: vec![old, new],
                }],
                added: changes.count_additions() as usize,
                removed: changes.count_removals() as usize,
            };
        }
        changes
    } else {
        let input = InternedInput::new(from_middle, to_middle);
        Diff::compute(Algorithm::Myers, &input)
    };
    let changes: Vec<_> = changes.hunks().collect();
    if changes.is_empty() {
        return TextDiff::default();
    }

    let window_start = context_start(from, prefix, context);
    let window_end = context_end(from, from_end, context);
    let leading = lines(&from[window_start..prefix]).count();
    let base = bytecount::count(&from.as_bytes()[..prefix], b'\n') - leading;
    let before: Vec<_> = lines(&from[window_start..window_end]).collect();
    let after_end = to_end + (window_end - from_end);
    let after: Vec<_> = lines(&to[window_start..after_end]).collect();
    let mut result = TextDiff::default();
    let mut index = 0;
    while index < changes.len() {
        let first = index;
        while index + 1 < changes.len()
            && (changes[index + 1].before.start - changes[index].before.end) as usize
                <= context.saturating_mul(2)
        {
            index += 1;
        }
        let last = index;
        let a_start = (leading + changes[first].before.start as usize).saturating_sub(context);
        let b_start = (leading + changes[first].after.start as usize).saturating_sub(context);
        let a_end = (leading + changes[last].before.end as usize)
            .saturating_add(context)
            .min(before.len());
        let b_end = (leading + changes[last].after.end as usize)
            .saturating_add(context)
            .min(after.len());
        let mut hunk = Hunk {
            from_start: base + a_start + usize::from(a_end != a_start),
            from_count: a_end - a_start,
            to_start: base + b_start + usize::from(b_end != b_start),
            to_count: b_end - b_start,
            lines: Vec::with_capacity(a_end - a_start + b_end - b_start),
        };
        let (mut a, mut b) = (a_start, b_start);
        for change in &changes[first..=last] {
            let remove_start = leading + change.before.start as usize;
            while a < remove_start {
                hunk.lines.push(line(
                    LineKind::Context,
                    before[a],
                    Some(base + a + 1),
                    Some(base + b + 1),
                ));
                a += 1;
                b += 1;
            }
            debug_assert_eq!(b, leading + change.after.start as usize);
            let run_start = hunk.lines.len();
            let remove_end = leading + change.before.end as usize;
            let add_end = leading + change.after.end as usize;
            while a < remove_end {
                hunk.lines
                    .push(line(LineKind::Removed, before[a], Some(base + a + 1), None));
                a += 1;
                result.removed += 1;
            }
            let added_start = hunk.lines.len();
            while b < add_end {
                hunk.lines
                    .push(line(LineKind::Added, after[b], None, Some(base + b + 1)));
                b += 1;
                result.added += 1;
            }
            let (removed, added) = hunk.lines[run_start..].split_at_mut(added_start - run_start);
            for (old, new) in removed.iter_mut().zip(added) {
                (old.emphasis, new.emphasis) = emphasis::compare(old.content(), new.content());
            }
        }
        while a < a_end {
            hunk.lines.push(line(
                LineKind::Context,
                before[a],
                Some(base + a + 1),
                Some(base + b + 1),
            ));
            a += 1;
            b += 1;
        }
        result.hunks.push(hunk);
        index += 1;
    }
    result
}

fn line(
    kind: LineKind,
    raw: &str,
    from_line: Option<usize>,
    to_line: Option<usize>,
) -> DiffLine<'_> {
    DiffLine {
        kind,
        from_line,
        to_line,
        text: raw.strip_suffix('\n').unwrap_or(raw),
        emphasis: Vec::new(),
        missing_newline: !raw.ends_with('\n'),
    }
}

fn is_single_line(text: &str) -> bool {
    !text.is_empty() && memchr(b'\n', text.as_bytes()).is_none_or(|i| i + 1 == text.len())
}

fn context_start(text: &str, mut end: usize, count: usize) -> usize {
    for _ in 0..count {
        if end == 0 {
            break;
        }
        end = memrchr(b'\n', &text.as_bytes()[..end - 1]).map_or(0, |i| i + 1);
    }
    end
}

fn context_end(text: &str, mut start: usize, count: usize) -> usize {
    for _ in 0..count {
        if start == text.len() {
            break;
        }
        start = memchr(b'\n', &text.as_bytes()[start..]).map_or(text.len(), |i| start + i + 1);
    }
    start
}

fn common_prefix(a: &[u8], b: &[u8]) -> usize {
    let len = a.len().min(b.len());
    let mut offset = 0;
    while offset + 64 <= len && a[offset..offset + 64] == b[offset..offset + 64] {
        offset += 64;
    }
    offset
        + a[offset..len]
            .iter()
            .zip(&b[offset..len])
            .take_while(|(a, b)| a == b)
            .count()
}

fn common_suffix(a: &[u8], b: &[u8]) -> usize {
    let len = a.len().min(b.len());
    let mut offset = 0;
    while offset + 64 <= len
        && a[a.len() - offset - 64..a.len() - offset] == b[b.len() - offset - 64..b.len() - offset]
    {
        offset += 64;
    }
    offset
        + a[..a.len() - offset]
            .iter()
            .rev()
            .zip(b[..b.len() - offset].iter().rev())
            .take(len - offset)
            .take_while(|(a, b)| a == b)
            .count()
}

/// Renders a patch with exactly one allocation for the output buffer.
pub fn unified(diff: &TextDiff<'_>, from_label: &str, to_label: &str) -> String {
    let mut length = Length(0);
    unified_into(diff, from_label, to_label, &mut length).expect("length counting cannot fail");
    let mut output = Vec::with_capacity(length.0);
    unified_into(diff, from_label, to_label, &mut output).expect("writing to a Vec cannot fail");
    String::from_utf8(output).expect("patch contains only UTF-8")
}

struct Length(usize);
impl io::Write for Length {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        self.0 += bytes.len();
        Ok(bytes.len())
    }
    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

/// Streams a patch. Callers writing to files or stdout should buffer the writer.
pub fn unified_into(
    diff: &TextDiff<'_>,
    from_label: &str,
    to_label: &str,
    out: &mut impl io::Write,
) -> io::Result<()> {
    if diff.hunks.is_empty() {
        return Ok(());
    }
    writeln!(out, "--- {from_label}\n+++ {to_label}")?;
    for hunk in &diff.hunks {
        write!(out, "@@ -{}", hunk.from_start)?;
        if hunk.from_count != 1 {
            write!(out, ",{}", hunk.from_count)?;
        }
        write!(out, " +{}", hunk.to_start)?;
        if hunk.to_count != 1 {
            write!(out, ",{}", hunk.to_count)?;
        }
        out.write_all(b" @@\n")?;
        for line in &hunk.lines {
            out.write_all(match line.kind {
                LineKind::Context => b" ",
                LineKind::Removed => b"-",
                LineKind::Added => b"+",
            })?;
            out.write_all(line.text.as_bytes())?;
            out.write_all(b"\n")?;
            if line.missing_newline {
                out.write_all(b"\\ No newline at end of file\n")?;
            }
        }
    }
    Ok(())
}
