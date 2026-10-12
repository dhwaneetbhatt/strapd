use std::ops::Range;

pub(super) struct Value {
    pub content: Range<usize>,
    pub end: usize,
}

pub(super) fn placeholder(value: &str) -> bool {
    let value = value.trim_matches([' ', '\t', '\r', '\n', '"', '\'']);
    matches!(
        value,
        "[REDACTED_API_KEY]"
            | "[REDACTED_AUTH]"
            | "[REDACTED_COOKIE]"
            | "[REDACTED_DATABASE]"
            | "[REDACTED_CRYPTO_KEY]"
            | "[REDACTED_PASSWORD]"
            | "[REDACTED_TOKEN]"
            | "[REDACTED_SIGNED_URL]"
    )
}

pub(super) fn name_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-' | b'.')
}

pub(super) fn whitespace(bytes: &[u8], mut offset: usize) -> usize {
    while bytes
        .get(offset)
        .is_some_and(|byte| matches!(byte, b' ' | b'\t'))
    {
        offset += 1;
    }
    offset
}

pub(super) fn json_whitespace(bytes: &[u8], mut offset: usize) -> usize {
    while bytes.get(offset).is_some_and(u8::is_ascii_whitespace) {
        offset += 1;
    }
    offset
}

pub(super) fn quoted(bytes: &[u8], start: usize) -> Value {
    let quote = bytes[start];
    let mut offset = start + 1;
    while let Some(&byte) = bytes.get(offset) {
        if byte == b'\\' {
            offset = (offset + 2).min(bytes.len());
        } else if byte == quote {
            return Value {
                content: start + 1..offset,
                end: offset + 1,
            };
        } else {
            offset += 1;
        }
    }
    Value {
        content: start + 1..bytes.len(),
        end: bytes.len(),
    }
}

#[derive(Clone, Copy)]
pub(super) enum ValueContext {
    Assignment,
    Json,
    Query,
    Libpq,
}

pub(super) fn value(bytes: &[u8], start: usize, context: ValueContext) -> Value {
    let mut end = start;
    if bytes.get(start).is_some_and(|byte| {
        *byte == b'\'' || (*byte == b'"' && !matches!(context, ValueContext::Libpq))
    }) {
        return quoted(bytes, start);
    }
    if bytes.get(start) == Some(&b'{') && !matches!(context, ValueContext::Libpq) {
        let mut offset = start + 1;
        while let Some(&byte) = bytes.get(offset) {
            if byte == b'}' {
                if bytes.get(offset + 1) == Some(&b'}') {
                    offset += 2;
                    continue;
                }
                return Value {
                    content: start + 1..offset,
                    end: offset + 1,
                };
            }
            offset += 1;
        }
        return Value {
            content: start + 1..bytes.len(),
            end: bytes.len(),
        };
    }
    if bytes
        .get(start..)
        .is_some_and(|rest| rest.starts_with(b"[REDACTED_"))
    {
        end = bytes[start..]
            .iter()
            .position(|&byte| byte == b']')
            .map_or(bytes.len(), |length| start + length + 1);
        // A marker followed by more value bytes is still a secret value.
        // Include its closing bracket before scanning any suffix.
    }
    while let Some(&byte) = bytes.get(end) {
        if byte.is_ascii_whitespace()
            || (!matches!(context, ValueContext::Libpq)
                && matches!(byte, b';' | b'&' | b'}' | b']' | b'"' | b'\''))
            || (byte == b',' && matches!(context, ValueContext::Json))
            || (byte == b'#' && matches!(context, ValueContext::Query))
        {
            break;
        }
        if byte == b'\\' && bytes.get(end + 1).is_some() {
            end += 2;
        } else {
            end += 1;
        }
    }
    Value {
        content: start..end,
        end,
    }
}

pub(super) fn header_value(bytes: &[u8], start: usize) -> Value {
    if bytes
        .get(start)
        .is_some_and(|byte| matches!(byte, b'"' | b'\''))
    {
        return quoted(bytes, start);
    }
    let mut end = start;
    while bytes
        .get(end)
        .is_some_and(|byte| !matches!(byte, b'\r' | b'\n'))
    {
        end += 1;
    }
    let mut content_end = end;
    while content_end > start && matches!(bytes[content_end - 1], b' ' | b'\t') {
        content_end -= 1;
    }
    Value {
        content: start..content_end,
        end,
    }
}

pub(super) fn normalize<'a>(name: &str, buffer: &'a mut [u8; 128]) -> Option<&'a str> {
    let mut length = 0;
    for byte in name.bytes() {
        if matches!(byte, b'_' | b'-' | b'.') {
            continue;
        }
        if !byte.is_ascii_alphanumeric() || length == buffer.len() {
            return None;
        }
        buffer[length] = byte.to_ascii_lowercase();
        length += 1;
    }
    std::str::from_utf8(&buffer[..length]).ok()
}
