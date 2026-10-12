use super::syntax;
use super::{Categories, Category, Matches};

pub(super) fn scan(matches: &mut Matches<'_>, categories: Categories) {
    urls(matches, categories);
    if categories.contains(Category::Databases) {
        connection_strings(matches);
    }
}

fn database_scheme(scheme: &str) -> bool {
    let scheme = scheme.strip_prefix("jdbc:").unwrap_or(scheme);
    let base = scheme.split('+').next().unwrap_or(scheme);
    [
        "postgres",
        "postgresql",
        "mysql",
        "mariadb",
        "mongodb",
        "redis",
        "rediss",
        "sqlserver",
        "mssql",
    ]
    .iter()
    .any(|known| base.eq_ignore_ascii_case(known))
}

fn urls(matches: &mut Matches<'_>, categories: Categories) {
    let input = matches.input;
    let bytes = input.as_bytes();
    let mut offset = 0;
    while let Some(length) = input[offset..].find("://") {
        offset += length;
        let mut start = offset;
        while start > 0
            && (bytes[start - 1].is_ascii_alphanumeric()
                || matches!(bytes[start - 1], b'+' | b'-' | b':' | b'.'))
        {
            start -= 1;
        }
        let database = database_scheme(&input[start..offset]);
        let authority_start = offset + 3;
        let mut end = authority_start;
        while bytes.get(end).is_some_and(|byte| {
            !byte.is_ascii_whitespace() && !matches!(byte, b'"' | b'\'' | b'<' | b'>')
        }) {
            end += 1;
        }
        if database && categories.contains(Category::Databases) {
            let authority_end = bytes[authority_start..end]
                .iter()
                .position(|byte| matches!(byte, b'/' | b'?' | b'#'))
                .map_or(end, |length| authority_start + length);
            if let Some(length) = bytes[authority_start..authority_end]
                .iter()
                .rposition(|&byte| byte == b'@')
            {
                let credentials_end = authority_start + length;
                if let Some(length) = bytes[authority_start..credentials_end]
                    .iter()
                    .position(|&byte| byte == b':')
                {
                    let colon = authority_start + length;
                    matches.add(authority_start..colon, Category::Databases);
                    matches.add(colon + 1..credentials_end, Category::Databases);
                } else {
                    matches.add(authority_start..credentials_end, Category::Databases);
                }
            }
            database_parameters(matches, authority_start..end);
        }
        if categories.contains(Category::SignedUrls) {
            signed_parameters(matches, authority_start..end);
        }
        offset = end;
    }
}

#[derive(Clone, Copy)]
struct Parameter<'a> {
    name: &'a str,
    value_start: usize,
    value_end: usize,
}

fn parameters(input: &str, range: std::ops::Range<usize>) -> impl Iterator<Item = Parameter<'_>> {
    let bytes = input.as_bytes();
    let range = range.start
        ..bytes[range.clone()]
            .iter()
            .position(|&byte| byte == b'#')
            .map_or(range.end, |length| range.start + length);
    let mut offset = range.start;
    std::iter::from_fn(move || {
        while offset < range.end {
            if !matches!(bytes[offset], b'?' | b'&' | b';') {
                offset += 1;
                continue;
            }
            let name_start = offset + 1;
            offset = name_start;
            while offset < range.end && !matches!(bytes[offset], b'=' | b'&' | b';' | b'#') {
                offset += 1;
            }
            if bytes.get(offset) != Some(&b'=') {
                continue;
            }
            let name = &input[name_start..offset];
            let value_start = offset + 1;
            offset = value_start;
            while offset < range.end && !matches!(bytes[offset], b'&' | b';' | b'#') {
                offset += 1;
            }
            return Some(Parameter {
                name,
                value_start,
                value_end: offset,
            });
        }
        None
    })
}

fn decoded_name(name: &str) -> std::borrow::Cow<'_, str> {
    urlencoding::decode(name).unwrap_or(std::borrow::Cow::Borrowed(name))
}

fn database_parameters(matches: &mut Matches<'_>, range: std::ops::Range<usize>) {
    let input = matches.input;
    for parameter in parameters(input, range) {
        let name = decoded_name(parameter.name);
        if [
            "user", "username", "password", "passwd", "pwd", "uid", "userid",
        ]
        .iter()
        .any(|known| name.eq_ignore_ascii_case(known))
        {
            let mut content = parameter.value_start..parameter.value_end;
            if input.as_bytes().get(content.start) == Some(&b'{') {
                content =
                    syntax::value(input.as_bytes(), content.start, syntax::ValueContext::Query)
                        .content;
            }
            matches.add(content, Category::Databases);
        }
    }
}

fn signed_parameters(matches: &mut Matches<'_>, range: std::ops::Range<usize>) {
    let input = matches.input;
    let mut aws = false;
    let mut azure_version = false;
    let mut azure_scope = false;
    for parameter in parameters(input, range.clone()) {
        let name = decoded_name(parameter.name);
        aws |= name.eq_ignore_ascii_case("x-amz-signature")
            || name.eq_ignore_ascii_case("x-amz-algorithm")
            || name.eq_ignore_ascii_case("AWSAccessKeyId");
        azure_version |= name.eq_ignore_ascii_case("sv");
        azure_scope |= ["sr", "ss", "srt", "sp"]
            .iter()
            .any(|known| name.eq_ignore_ascii_case(known));
    }
    if !aws && !(azure_version && azure_scope) {
        return;
    }
    for parameter in parameters(input, range) {
        let name = decoded_name(parameter.name);
        let sensitive = (aws
            && [
                "x-amz-credential",
                "x-amz-signature",
                "x-amz-security-token",
                "AWSAccessKeyId",
                "Signature",
                "SecurityToken",
            ]
            .iter()
            .any(|known| name.eq_ignore_ascii_case(known)))
            || (azure_version && azure_scope && name.eq_ignore_ascii_case("sig"));
        if sensitive {
            matches.add(
                parameter.value_start..parameter.value_end,
                Category::SignedUrls,
            );
        }
    }
}

fn connection_strings(matches: &mut Matches<'_>) {
    let input = matches.input;
    let lower = input.to_ascii_lowercase();
    if !["host", "server", "data source", "jdbc:", "dbname"]
        .iter()
        .any(|keyword| lower.contains(keyword))
    {
        return;
    }
    let mut line_start = 0;
    for line in input.split_inclusive('\n') {
        // Username has no secret meaning outside an identified connection string.
        if let Some(context) = connection_context(line, true) {
            connection_fields(matches, line_start, line, true, context);
        }
        line_start += line.len();
    }
}

fn connection_context(line: &str, scan_enclosures: bool) -> Option<syntax::ValueContext> {
    let bytes = line.as_bytes();
    let mut offset = 0;
    while offset < bytes.len() {
        if matches!(bytes[offset], b'"' | b'\'') {
            let value = syntax::quoted(bytes, offset);
            if scan_enclosures
                && let Some(context) = connection_context(&line[value.content], false)
            {
                return Some(context);
            }
            offset = value.end;
            continue;
        }
        if !syntax::name_byte(bytes[offset]) {
            offset += 1;
            continue;
        }
        let start = offset;
        while bytes
            .get(offset)
            .is_some_and(|&byte| syntax::name_byte(byte))
        {
            offset += 1;
        }
        if line[start..offset].eq_ignore_ascii_case("data") {
            let next = syntax::whitespace(bytes, offset);
            if line[next..]
                .get(..6)
                .is_some_and(|word| word.eq_ignore_ascii_case("source"))
            {
                offset = next + 6;
            }
        }
        let end = offset;
        offset = syntax::whitespace(bytes, offset);
        if bytes.get(offset) != Some(&b'=') {
            continue;
        }
        let name = &line[start..end];
        if ["host", "hostaddr", "dbname"]
            .iter()
            .any(|known| name.eq_ignore_ascii_case(known))
        {
            return Some(syntax::ValueContext::Libpq);
        }
        if ["server", "data source"]
            .iter()
            .any(|known| name.eq_ignore_ascii_case(known))
        {
            return Some(syntax::ValueContext::Assignment);
        }
        let sensitive = credential_name(name);
        let value_start = syntax::whitespace(bytes, offset + 1);
        let value = if !sensitive && matches!(bytes.get(value_start), Some(b'"' | b'\'')) {
            syntax::quoted(bytes, value_start)
        } else {
            syntax::value(bytes, value_start, syntax::ValueContext::Libpq)
        };
        if scan_enclosures
            && !sensitive
            && value.content.start > offset + 1
            && let Some(context) = connection_context(&line[value.content.clone()], false)
        {
            return Some(context);
        }
        offset = value.end.max(offset + 1);
    }
    None
}

fn credential_name(name: &str) -> bool {
    [
        "user", "username", "user id", "password", "passwd", "pwd", "uid",
    ]
    .iter()
    .any(|known| name.eq_ignore_ascii_case(known))
}

fn connection_fields(
    matches: &mut Matches<'_>,
    base: usize,
    line: &str,
    scan_enclosures: bool,
    context: syntax::ValueContext,
) {
    let bytes = line.as_bytes();
    let mut offset = 0;
    while offset < bytes.len() {
        if matches!(bytes[offset], b'"' | b'\'') {
            let value = syntax::quoted(bytes, offset);
            if scan_enclosures {
                let content = &line[value.content.clone()];
                connection_fields(
                    matches,
                    base + value.content.start,
                    content,
                    false,
                    connection_context(content, false).unwrap_or(context),
                );
            }
            offset = value.end;
            continue;
        }
        if !syntax::name_byte(bytes[offset]) {
            offset += 1;
            continue;
        }
        let start = offset;
        while bytes
            .get(offset)
            .is_some_and(|byte| syntax::name_byte(*byte) || matches!(*byte, b' ' | b'\t'))
        {
            offset += 1;
        }
        let end = offset;
        if bytes.get(offset) != Some(&b'=') {
            continue;
        }
        let name = line[start..end].trim();
        let sensitive = credential_name(name);
        let value_start = syntax::whitespace(bytes, offset + 1);
        let value = if !sensitive && matches!(bytes.get(value_start), Some(b'"' | b'\'')) {
            syntax::quoted(bytes, value_start)
        } else {
            syntax::value(bytes, value_start, context)
        };
        offset = value.end.max(offset + 1);
        if sensitive {
            matches.add(
                base + value.content.start..base + value.content.end,
                Category::Databases,
            );
        } else if scan_enclosures && value.content.start > end + 1 {
            let content = &line[value.content.clone()];
            connection_fields(
                matches,
                base + value.content.start,
                content,
                false,
                connection_context(content, false).unwrap_or(context),
            );
        }
    }
}
