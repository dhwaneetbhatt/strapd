use std::{borrow::Cow, ops::Range};

pub(super) struct Span<T> {
    pub range: Range<usize>,
    pub value: T,
}

pub(super) fn resolve<T>(
    mut spans: Vec<Span<T>>,
    tie: impl Fn(&T, &T) -> std::cmp::Ordering,
) -> Vec<Span<T>> {
    if spans
        .windows(2)
        .all(|pair| pair[0].range.end <= pair[1].range.start)
    {
        return spans;
    }
    spans.sort_unstable_by(|a, b| {
        a.range
            .start
            .cmp(&b.range.start)
            .then_with(|| b.range.end.cmp(&a.range.end))
            .then_with(|| tie(&a.value, &b.value))
    });
    let mut resolved: Vec<Span<T>> = Vec::with_capacity(spans.len());
    for span in spans {
        if let Some(previous) = resolved.last_mut()
            && span.range.start < previous.range.end
        {
            previous.range.end = previous.range.end.max(span.range.end);
            continue;
        }
        resolved.push(span);
    }
    resolved
}

pub(super) fn render<'a, 's, T>(
    input: &'a str,
    spans: &'s [Span<T>],
    mut replacement: impl FnMut(&'s T, &mut String),
) -> Cow<'a, str> {
    if spans.is_empty() {
        return Cow::Borrowed(input);
    }
    let mut output = String::with_capacity(input.len());
    let mut cursor = 0;
    for span in spans {
        output.push_str(&input[cursor..span.range.start]);
        replacement(&span.value, &mut output);
        cursor = span.range.end;
    }
    output.push_str(&input[cursor..]);
    Cow::Owned(output)
}
