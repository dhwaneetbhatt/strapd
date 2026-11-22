use crate::{DiffHunk, DiffLine, DiffLineKind, DiffSegment, TextDiffResult};
use strapd_core::string::diff;

impl From<diff::TextDiff<'_>> for TextDiffResult {
    fn from(diff: diff::TextDiff<'_>) -> Self {
        Self {
            hunks: diff.hunks.into_iter().map(DiffHunk::from).collect(),
            added: diff.added as u32,
            removed: diff.removed as u32,
        }
    }
}

impl From<diff::Hunk<'_>> for DiffHunk {
    fn from(hunk: diff::Hunk<'_>) -> Self {
        Self {
            from_start: hunk.from_start as u32,
            from_count: hunk.from_count as u32,
            to_start: hunk.to_start as u32,
            to_count: hunk.to_count as u32,
            lines: hunk.lines.into_iter().map(DiffLine::from).collect(),
        }
    }
}

impl From<diff::DiffLine<'_>> for DiffLine {
    fn from(line: diff::DiffLine<'_>) -> Self {
        let mut segments = Vec::new();
        let mut offset = 0;
        for range in line.emphasis {
            if offset < range.start {
                segments.push(DiffSegment {
                    text: line.text[offset..range.start].into(),
                    emphasized: false,
                });
            }
            offset = range.end;
            segments.push(DiffSegment {
                text: line.text[range].into(),
                emphasized: true,
            });
        }
        if offset < line.text.len() || segments.is_empty() {
            segments.push(DiffSegment {
                text: line.text[offset..].into(),
                emphasized: false,
            });
        }
        Self {
            kind: match line.kind {
                diff::LineKind::Context => DiffLineKind::Context,
                diff::LineKind::Removed => DiffLineKind::Removed,
                diff::LineKind::Added => DiffLineKind::Added,
            },
            from_line: line.from_line.map(|line| line as u32),
            to_line: line.to_line.map(|line| line as u32),
            segments,
            missing_newline: line.missing_newline,
        }
    }
}
