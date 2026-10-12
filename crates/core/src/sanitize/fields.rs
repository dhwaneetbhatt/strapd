use super::syntax::{self, Value};
use super::{Categories, Category, Matches};

fn category(name: &str, original: &str) -> Option<Category> {
    let has_suffix = |suffix| semantic_suffix(original, name, suffix);
    match name.as_bytes().last()? {
        b'y' => {
            if has_suffix("apikey") || has_suffix("accesskey") || has_suffix("secretaccesskey") {
                Some(Category::ApiKeys)
            } else if has_suffix("privatekey")
                || has_suffix("encryptionkey")
                || has_suffix("signingkey")
                || name == "hmackey"
            {
                Some(Category::CryptoKeys)
            } else {
                None
            }
        }
        b'd' => {
            if has_suffix("accesskeyid") {
                Some(Category::ApiKeys)
            } else if has_suffix("password") || has_suffix("passwd") || name == "pwd" {
                Some(Category::Passwords)
            } else if name == "sessionid" {
                Some(Category::Tokens)
            } else {
                None
            }
        }
        b'e' => match name {
            "cookie" | "setcookie" => Some(Category::Cookies),
            _ if has_suffix("passphrase") => Some(Category::Passwords),
            _ => None,
        },
        b'n' => {
            if matches!(name, "authorization" | "proxyauthorization") {
                Some(Category::Auth)
            } else if matches!(name, "token" | "session")
                || has_suffix("accesstoken")
                || has_suffix("refreshtoken")
                || has_suffix("idtoken")
                || has_suffix("sessiontoken")
                || has_suffix("authtoken")
                || has_suffix("bearertoken")
            {
                Some(Category::Tokens)
            } else {
                None
            }
        }
        b't' => {
            if has_suffix("signingsecret")
                || has_suffix("encryptionsecret")
                || has_suffix("hmacsecret")
                || has_suffix("webhooksecret")
            {
                Some(Category::CryptoKeys)
            } else if has_suffix("secret") || has_suffix("clientsecret") {
                Some(Category::Tokens)
            } else {
                None
            }
        }
        _ => None,
    }
}

fn semantic_suffix(original: &str, normalized: &str, suffix: &str) -> bool {
    if !normalized.ends_with(suffix) {
        return false;
    }
    if normalized == suffix {
        return true;
    }
    let bytes = original.as_bytes();
    let mut remaining = suffix.len();
    for (offset, &byte) in bytes.iter().enumerate().rev() {
        if matches!(byte, b'_' | b'-' | b'.') {
            continue;
        }
        remaining -= 1;
        if remaining == 0 {
            return offset == 0
                || matches!(bytes[offset - 1], b'_' | b'-' | b'.')
                || (bytes[offset - 1].is_ascii_lowercase() && byte.is_ascii_uppercase())
                || (byte.is_ascii_uppercase()
                    && bytes.get(offset + 1).is_some_and(u8::is_ascii_lowercase))
                || original[..offset].eq_ignore_ascii_case("openai");
        }
    }
    false
}

pub(super) fn scan(matches: &mut Matches<'_>, categories: Categories) {
    scan_range(matches, categories, 0..matches.input.len(), true);
}

fn scan_range(
    matches: &mut Matches<'_>,
    categories: Categories,
    range: std::ops::Range<usize>,
    scan_enclosures: bool,
) {
    let input = matches.input;
    let bytes = &input.as_bytes()[..range.end];
    let mut offset = range.start;
    let mut normalized = [0; 128];
    while offset < bytes.len() {
        if !syntax::name_byte(bytes[offset]) && !matches!(bytes[offset], b'"' | b'\'') {
            offset += 1;
            continue;
        }
        let previous = bytes[..offset]
            .iter()
            .rposition(|byte| !byte.is_ascii_whitespace())
            .map(|index| bytes[index]);
        let context =
            if matches!(bytes[offset], b'"' | b'\'') || matches!(previous, Some(b'{' | b',')) {
                syntax::ValueContext::Json
            } else if matches!(previous, Some(b'?' | b'&')) {
                syntax::ValueContext::Query
            } else {
                syntax::ValueContext::Assignment
            };
        let (name, after_name) = if matches!(bytes[offset], b'"' | b'\'') {
            let quoted = syntax::quoted(bytes, offset);
            let after = syntax::json_whitespace(bytes, quoted.end);
            if !matches!(bytes.get(after), Some(b':' | b'=')) {
                if scan_enclosures {
                    scan_range(matches, categories, quoted.content, false);
                }
                offset = quoted.end;
                continue;
            }
            (quoted.content, after)
        } else if syntax::name_byte(bytes[offset]) {
            let start = offset;
            while bytes
                .get(offset)
                .is_some_and(|&byte| syntax::name_byte(byte))
            {
                offset += 1;
            }
            (start..offset, syntax::whitespace(bytes, offset))
        } else {
            offset += 1;
            continue;
        };
        if !matches!(bytes.get(after_name), Some(b':' | b'=')) {
            offset = after_name.max(offset + 1);
            continue;
        }
        let original = &input[name];
        if !original
            .trim_end_matches(['_', '-', '.'])
            .as_bytes()
            .last()
            .is_some_and(|byte| {
                matches!(byte.to_ascii_lowercase(), b'y' | b'd' | b'n' | b't' | b'e')
            })
        {
            offset = after_name + 1;
            continue;
        }
        let Some(name) = syntax::normalize(original, &mut normalized) else {
            offset = after_name + 1;
            continue;
        };
        let Some(category) = category(name, original) else {
            offset = after_name + 1;
            continue;
        };
        let start = if matches!(context, syntax::ValueContext::Json) {
            syntax::json_whitespace(bytes, after_name + 1)
        } else {
            syntax::whitespace(bytes, after_name + 1)
        };
        if !categories.contains(category) {
            offset = start;
            continue;
        }
        let value = if matches!(category, Category::Auth | Category::Cookies) {
            syntax::header_value(bytes, start)
        } else {
            syntax::value(bytes, start, context)
        };
        offset = value.end.max(start + 1);
        match category {
            Category::Auth => authorization(matches, &value),
            Category::Cookies => cookies(matches, &value, name == "setcookie"),
            _ => matches.add(value.content, category),
        }
    }
}

fn authorization(matches: &mut Matches<'_>, value: &Value) {
    let bytes = matches.input.as_bytes();
    let mut scheme_end = value.content.start;
    while scheme_end < value.content.end && syntax::name_byte(bytes[scheme_end]) {
        scheme_end += 1;
    }
    let credential_start = syntax::whitespace(bytes, scheme_end);
    let start = if scheme_end > value.content.start
        && credential_start > scheme_end
        && credential_start < value.content.end
    {
        credential_start
    } else {
        value.content.start
    };
    matches.add(start..value.content.end, Category::Auth);
}

fn cookies(matches: &mut Matches<'_>, value: &Value, response: bool) {
    let bytes = matches.input.as_bytes();
    let mut offset = value.content.start;
    while offset < value.content.end {
        let pair_start = syntax::whitespace(bytes, offset);
        let mut end = pair_start;
        let mut quote = None;
        let mut equals = None;
        while end < value.content.end {
            let byte = bytes[end];
            if byte == b'\\' {
                if let Some(&escaped) = bytes.get(end + 1)
                    && matches!(escaped, b'"' | b'\'')
                {
                    toggle_quote(&mut quote, escaped);
                }
                end = (end + 2).min(value.content.end);
                continue;
            }
            if matches!(byte, b'"' | b'\'') {
                toggle_quote(&mut quote, byte);
            }
            if quote.is_none() {
                if byte == b';' {
                    break;
                }
                if byte == b'=' && equals.is_none() {
                    equals = Some(end);
                }
            }
            end += 1;
        }
        if let Some(equals) = equals {
            let start = syntax::whitespace(bytes, equals + 1);
            let mut stop = end;
            while stop > start && matches!(bytes[stop - 1], b' ' | b'\t') {
                stop -= 1;
            }
            let content = if stop >= start + 4
                && bytes.get(start) == Some(&b'\\')
                && matches!(bytes.get(start + 1), Some(b'"' | b'\''))
                && bytes.get(stop - 2..stop) == bytes.get(start..start + 2)
            {
                start + 2..stop - 2
            } else if bytes
                .get(start)
                .is_some_and(|byte| matches!(byte, b'"' | b'\''))
            {
                syntax::quoted(&bytes[..stop], start).content
            } else {
                start..stop
            };
            matches.add(content, Category::Cookies);
        }
        if response {
            break;
        }
        offset = end + 1;
    }
}

fn toggle_quote(quote: &mut Option<u8>, delimiter: u8) {
    if *quote == Some(delimiter) {
        *quote = None;
    } else if quote.is_none() {
        *quote = Some(delimiter);
    }
}
