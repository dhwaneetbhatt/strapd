use super::{Canonical, Categories, Category, Identity, candidate, contacts, numbers};
use crate::sanitize::spans::Span;
use std::borrow::Cow;

pub(super) fn scan(
    input: &str,
    categories: Categories,
    pseudonymize: bool,
) -> Vec<Span<Identity<'_>>> {
    let bytes = input.as_bytes();
    let mut matches = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'['
            && let Some(length) = marker(&input[i..])
        {
            i += length;
            continue;
        }
        if !token_byte(bytes[i]) && bytes[i] != b'(' {
            i += 1;
            continue;
        }
        if bytes[i] == b'\'' {
            i += 1;
            continue;
        }
        let start = i;
        let mut end = i;
        let mut ip_prefix = true;
        let mut email_domain = false;
        while end < bytes.len() && token_byte(bytes[end]) {
            if bytes[end] == b'\''
                && (email_domain || !bytes.get(end + 1).is_some_and(u8::is_ascii_alphanumeric))
            {
                break;
            }
            if bytes[end] == b'@' {
                email_domain = true;
            }
            if bytes[end] == b':' && end > start && !ip_prefix {
                break;
            }
            ip_prefix &= bytes[end].is_ascii_hexdigit() || matches!(bytes[end], b':' | b'.');
            end += 1;
        }
        let token = &input[start..end];
        let identifier =
            token.trim_end_matches(['.', '!', '#', '$', '%', '^', '`', '~', '*', '\'', '&']);
        let mut found = None;
        if categories.contains(Category::Emails)
            && token.contains('@')
            && let Some((local, domain)) = contacts::email(token)
        {
            found = Some(candidate(
                start..start + local.len() + 1 + domain.len(),
                Category::Emails,
                Canonical::Text(if !pseudonymize {
                    Cow::Borrowed("")
                } else if domain.bytes().any(|b| b.is_ascii_uppercase()) {
                    Cow::Owned(format!("{}@{}", local, domain.to_ascii_lowercase()))
                } else {
                    Cow::Borrowed(&input[start..start + local.len() + 1 + domain.len()])
                }),
            ));
        }
        if found.is_none()
            && categories.contains(Category::IpAddresses)
            && (token.contains('.') || token.contains(':'))
            && let Some((length, address)) = contacts::ip(identifier)
        {
            found = Some(candidate(
                start..start + length,
                Category::IpAddresses,
                if pseudonymize {
                    Canonical::Ip(address)
                } else {
                    Canonical::Text(Cow::Borrowed(""))
                },
            ));
        }
        if found.is_none()
            && categories.contains(Category::Pan)
            && identifier.len() == 10
            && (contacts::pan(identifier, false)
                || (contacts::pan(identifier, true) && label(bytes, start) == Some(Category::Pan)))
        {
            found = Some(candidate(
                start..start + identifier.len(),
                Category::Pan,
                Canonical::Text(if !pseudonymize {
                    Cow::Borrowed("")
                } else if identifier.bytes().any(|b| b.is_ascii_lowercase()) {
                    Cow::Owned(identifier.to_ascii_uppercase())
                } else {
                    Cow::Borrowed(identifier)
                }),
            ));
        }
        let numeric_categories =
            Category::PhoneNumbers as u8 | Category::PaymentCards as u8 | Category::Aadhaar as u8;
        if found.is_none()
            && categories.bits() & numeric_categories != 0
            && (bytes[start].is_ascii_digit() || matches!(bytes[start], b'+' | b'('))
            && !token.bytes().any(|b| matches!(b, b'@' | b'_' | b':'))
            && let Some(number) = numbers::parse(bytes, start)
        {
            let extension_end = numbers::extension(bytes, number.end);
            let boundary = bytes
                .get(extension_end)
                .is_none_or(|b| !b.is_ascii_alphanumeric() && !matches!(b, b'_' | b'+' | b'@'));
            if boundary
                && let Some(category) =
                    numbers::classify(&number, || label(bytes, start), categories)
            {
                let finish = if category == Category::PhoneNumbers {
                    extension_end
                } else {
                    number.end
                };
                let canonical = if !pseudonymize {
                    Cow::Borrowed("")
                } else if finish == number.end
                    && finish - start == number.count + usize::from(number.international)
                {
                    Cow::Borrowed(&input[start..finish])
                } else {
                    let mut canonical = String::with_capacity(24);
                    if number.international {
                        canonical.push('+');
                    }
                    canonical.extend(
                        number.digits[..number.count]
                            .iter()
                            .map(|d| char::from(d + b'0')),
                    );
                    if finish > number.end {
                        canonical.push('x');
                        canonical.extend(
                            bytes[number.end..finish]
                                .iter()
                                .filter(|b| b.is_ascii_digit())
                                .map(|&b| char::from(b)),
                        );
                    }
                    Cow::Owned(canonical)
                };
                found = Some(candidate(
                    start..finish,
                    category,
                    Canonical::Text(canonical),
                ));
            }
            end = end.max(number.end);
        }
        if let Some(span) = found {
            end = end.max(span.range.end);
            matches.push(span);
        }
        i = end.max(start + 1);
        if bytes.get(i) == Some(&b':') && !token.contains(':') {
            i += 1;
        }
    }
    matches
}

fn token_byte(b: u8) -> bool {
    b.is_ascii_alphanumeric()
        || matches!(
            b,
            b'.' | b'_'
                | b'-'
                | b'+'
                | b'@'
                | b':'
                | b'!'
                | b'#'
                | b'$'
                | b'%'
                | b'^'
                | b'`'
                | b'~'
                | b'*'
                | b'\''
                | b'&'
        )
}

fn marker(input: &str) -> Option<usize> {
    let end = input.bytes().take(48).position(|b| b == b']')?;
    let token = &input[1..end];
    for category in [
        Category::IpAddresses,
        Category::Emails,
        Category::PhoneNumbers,
        Category::PaymentCards,
        Category::Aadhaar,
        Category::Pan,
    ] {
        if &input[..end + 1] == category.placeholder() {
            return Some(end + 1);
        }
        if let Some(ordinal) = token
            .strip_prefix(category.name())
            .and_then(|s| s.strip_prefix('_'))
            && !ordinal.is_empty()
            && ordinal.bytes().all(|b| b.is_ascii_digit())
        {
            return Some(end + 1);
        }
    }
    None
}

fn label(bytes: &[u8], start: usize) -> Option<Category> {
    let mut end = start;
    while end > 0 && matches!(bytes[end - 1], b' ' | b'\t' | b'"' | b'\'' | b':' | b'=') {
        end -= 1;
    }
    let mut begin = end;
    while begin > 0
        && end - begin < 48
        && (bytes[begin - 1].is_ascii_alphanumeric()
            || matches!(bytes[begin - 1], b'_' | b'-' | b' ' | b'.'))
    {
        begin -= 1;
    }
    let mut key = &bytes[begin..end];
    if let Some(suffix) = key.iter().rposition(|b| !b.is_ascii_digit())
        && suffix + 1 < key.len()
        && matches!(key[suffix], b'_' | b'-')
    {
        key = &key[..suffix];
    }
    // Match complete semantic keys, including a final two-word label in prose.
    let mut normalized = [0; 48];
    let mut count = 0;
    for &b in key {
        if b.is_ascii_alphanumeric() || b == b'.' {
            normalized[count] = b.to_ascii_lowercase();
            count += 1;
        }
    }
    let classify = |key: &[u8]| match key {
        b"aadhaar" | b"aadhaarnumber" | b"uid" | b"uidnumber" => Some(Category::Aadhaar),
        b"pan" | b"pannumber" => Some(Category::Pan),
        b"cardnumber" | b"paymentcard" | b"paymentcardnumber" | b"creditcard"
        | b"creditcardnumber" | b"debitcard" | b"debitcardnumber" | b"ccnumber" => {
            Some(Category::PaymentCards)
        }
        b"phone" | b"phonenumber" | b"mobile" | b"mobilenumber" | b"telephone"
        | b"telephonenumber" | b"contactnumber" | b"tel" => Some(Category::PhoneNumbers),
        _ => None,
    };
    classify(&normalized[..count]).or_else(|| {
        let word_start = key.iter().rposition(|&b| b == b' ')? + 1;
        let mut word = [0; 48];
        let mut length = 0;
        for &b in &key[word_start..] {
            if b.is_ascii_alphanumeric() || b == b'.' {
                word[length] = b.to_ascii_lowercase();
                length += 1;
            }
        }
        classify(&word[..length])
    })
}
