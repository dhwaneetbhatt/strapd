use std::{
    io::{self, Write},
    ops::Range,
};

use strapd_core::string::diff::{DiffLine, Hunk, LineKind, TextDiff, unified_into};
use unicode_width::UnicodeWidthChar;

const BOLD: &[u8] = b"\x1b[1m";
const CYAN: &[u8] = b"\x1b[36m";
const RED: &[u8] = b"\x1b[31m";
const GREEN: &[u8] = b"\x1b[32m";
const REVERSE: &[u8] = b"\x1b[7m";
const END_REVERSE: &[u8] = b"\x1b[27m";
const RESET: &[u8] = b"\x1b[m";
const SPACES: &[u8] = &[b' '; 64];

pub(super) fn unified(
    diff: &TextDiff<'_>,
    from_label: &str,
    to_label: &str,
    color: bool,
    out: &mut impl Write,
) -> io::Result<()> {
    if !color {
        return unified_into(diff, from_label, to_label, out);
    }
    if diff.hunks.is_empty() {
        return Ok(());
    }
    for (prefix, label) in [("---", from_label), ("+++", to_label)] {
        out.write_all(BOLD)?;
        write!(out, "{prefix} {label}")?;
        out.write_all(RESET)?;
        out.write_all(b"\n")?;
    }
    for hunk in &diff.hunks {
        hunk_header(hunk, color, out)?;
        for line in &hunk.lines {
            let (sign, style) = match line.kind {
                LineKind::Context => (b" ", &[][..]),
                LineKind::Removed => (b"-", RED),
                LineKind::Added => (b"+", GREEN),
            };
            out.write_all(style)?;
            out.write_all(sign)?;
            for (text, emphasized) in segments(line.text, &line.emphasis) {
                if emphasized {
                    out.write_all(REVERSE)?;
                }
                out.write_all(text.as_bytes())?;
                if emphasized {
                    out.write_all(END_REVERSE)?;
                }
            }
            if !style.is_empty() {
                out.write_all(RESET)?;
            }
            out.write_all(b"\n")?;
            if line.missing_newline {
                out.write_all(b"\\ No newline at end of file\n")?;
            }
        }
    }
    Ok(())
}

pub(super) fn side_by_side(
    diff: &TextDiff<'_>,
    width: usize,
    color: bool,
    out: &mut impl Write,
) -> io::Result<()> {
    let column_width = (width - 3) / 2;
    for hunk in &diff.hunks {
        hunk_header(hunk, color, out)?;
        let mut lines = hunk.lines.as_slice();
        while let Some(first) = lines.first() {
            if first.kind == LineKind::Context {
                render_row(Some(first), Some(first), column_width, color, out)?;
                lines = &lines[1..];
                continue;
            }

            let removed = run_len(lines, LineKind::Removed);
            let added = run_len(&lines[removed..], LineKind::Added);
            let (left, right) = lines[..removed + added].split_at(removed);
            for i in 0..left.len().max(right.len()) {
                render_row(left.get(i), right.get(i), column_width, color, out)?;
            }
            lines = &lines[removed + added..];
        }
    }
    Ok(())
}

fn hunk_header(hunk: &Hunk<'_>, color: bool, out: &mut impl Write) -> io::Result<()> {
    if color {
        out.write_all(CYAN)?;
    }
    write!(out, "@@ -{}", hunk.from_start)?;
    if hunk.from_count != 1 {
        write!(out, ",{}", hunk.from_count)?;
    }
    write!(out, " +{}", hunk.to_start)?;
    if hunk.to_count != 1 {
        write!(out, ",{}", hunk.to_count)?;
    }
    out.write_all(b" @@")?;
    if color {
        out.write_all(RESET)?;
    }
    out.write_all(b"\n")
}

fn render_row(
    left: Option<&DiffLine<'_>>,
    right: Option<&DiffLine<'_>>,
    width: usize,
    color: bool,
    out: &mut impl Write,
) -> io::Result<()> {
    let used = render_column(left, width, color, out)?;
    spaces(width - used, out)?;
    out.write_all(match (left, right) {
        (Some(line), _) if line.kind == LineKind::Context => b"   ",
        (Some(_), Some(_)) => b" | ",
        (Some(_), None) => b" < ",
        (None, _) => b" > ",
    })?;
    render_column(right, width, color, out)?;
    out.write_all(b"\n")
}

fn render_column(
    line: Option<&DiffLine<'_>>,
    width: usize,
    color: bool,
    out: &mut impl Write,
) -> io::Result<usize> {
    let Some(line) = line else { return Ok(0) };
    let style = match (color, line.kind) {
        (true, LineKind::Removed) => RED,
        (true, LineKind::Added) => GREEN,
        _ => &[],
    };
    let mut used = 0;
    out.write_all(style)?;
    let text = if line.missing_newline {
        line.text
    } else {
        line.text.strip_suffix('\r').unwrap_or(line.text)
    };
    let ranges = if color { &line.emphasis[..] } else { &[] };
    for (segment, emphasized) in segments(text, ranges) {
        if emphasized {
            out.write_all(REVERSE)?;
        }
        let fits = render_segment(segment, width, &mut used, out)?;
        if emphasized {
            out.write_all(END_REVERSE)?;
        }
        if !fits {
            break;
        }
    }
    if !style.is_empty() {
        out.write_all(RESET)?;
    }
    Ok(used)
}

fn render_segment(
    text: &str,
    width: usize,
    used: &mut usize,
    out: &mut impl Write,
) -> io::Result<bool> {
    let mut start = 0;
    for (i, ch) in text.char_indices() {
        if ch == '\t' {
            out.write_all(&text.as_bytes()[start..i])?;
            let tab_width = 8 - *used % 8;
            let available = (width - *used).min(tab_width);
            spaces(available, out)?;
            *used += available;
            if available < tab_width {
                return Ok(false);
            }
            start = i + 1;
        } else {
            let ch_width = ch.width().unwrap_or(0);
            if ch_width > width - *used {
                out.write_all(&text.as_bytes()[start..i])?;
                return Ok(false);
            }
            *used += ch_width;
        }
    }
    out.write_all(&text.as_bytes()[start..])?;
    Ok(true)
}

fn spaces(mut count: usize, out: &mut impl Write) -> io::Result<()> {
    while count > 0 {
        let chunk = count.min(SPACES.len());
        out.write_all(&SPACES[..chunk])?;
        count -= chunk;
    }
    Ok(())
}

fn segments<'a>(
    text: &'a str,
    ranges: &'a [Range<usize>],
) -> impl Iterator<Item = (&'a str, bool)> {
    let mut start = 0;
    ranges
        .iter()
        .flat_map(move |range| {
            let lo = range.start.min(text.len());
            let hi = range.end.min(text.len());
            let pieces = [(&text[start..lo], false), (&text[lo..hi], true)];
            start = hi;
            pieces
        })
        .chain(std::iter::once_with(|| {
            let tail = ranges.last().map_or(0, |range| range.end.min(text.len()));
            (&text[tail..], false)
        }))
        .filter(|(text, _)| !text.is_empty())
}

fn run_len(lines: &[DiffLine<'_>], kind: LineKind) -> usize {
    lines.iter().take_while(|line| line.kind == kind).count()
}
