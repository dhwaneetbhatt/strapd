use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};

use super::{Categories, Category, Matches};

pub(super) fn scan(matches: &mut Matches<'_>, categories: Categories) {
    let input = matches.input;
    let bytes = input.as_bytes();
    let mut offset = 0;
    while offset < bytes.len() {
        if !candidate_byte(bytes[offset]) {
            offset += 1;
            continue;
        }
        let start = offset;
        while bytes.get(offset).is_some_and(|&byte| candidate_byte(byte)) {
            offset += 1;
        }
        let candidate = input[start..offset].trim_end_matches('.');
        if categories.contains(Category::ApiKeys) && api_key(candidate) {
            matches.add(start..start + candidate.len(), Category::ApiKeys);
        } else if categories.contains(Category::CryptoKeys)
            && candidate.starts_with('A')
            && age_identity(candidate)
        {
            matches.add(start..start + candidate.len(), Category::CryptoKeys);
        } else if categories.contains(Category::Tokens) && possible_json_header(candidate) {
            let original = &input[start..offset];
            if compact_token(original) {
                matches.add(start..offset, Category::Tokens);
            } else if candidate.len() != original.len() && compact_token(candidate) {
                matches.add(start..start + candidate.len(), Category::Tokens);
            } else if candidate.len() < original.len()
                && compact_token(&original[..candidate.len() + 1])
            {
                // Empty signatures are part of unsigned compact JWS. Preserve
                // punctuation after that required final separator.
                matches.add(start..start + candidate.len() + 1, Category::Tokens);
            }
        }
    }
}

fn candidate_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-' | b'.')
}

fn prefixed(candidate: &str, prefixes: &[&str], minimum_suffix: usize) -> bool {
    prefixes.iter().any(|prefix| {
        candidate
            .strip_prefix(prefix)
            .is_some_and(|suffix| suffix.len() >= minimum_suffix)
    })
}

fn api_key(candidate: &str) -> bool {
    match candidate.as_bytes().first() {
        Some(b'g') => {
            prefixed(
                candidate,
                &["ghp_", "github_pat_", "gho_", "ghu_", "ghs_", "ghr_"],
                20,
            ) || prefixed(
                candidate,
                &[
                    "glpat-", "gloas-", "gldt-", "glrt-", "glptt-", "glft-", "glcbt-", "glimt-",
                    "glagent-",
                ],
                16,
            )
        }
        Some(b'x') => prefixed(
            candidate,
            &[
                "xoxb-", "xoxp-", "xoxa-", "xoxr-", "xoxs-", "xapp-", "xoxe.", "xwfp-",
            ],
            16,
        ),
        Some(b's' | b'r' | b'w') => {
            prefixed(
                candidate,
                &[
                    "sk_live_", "sk_test_", "rk_live_", "rk_test_", "sk_org_", "whsec_",
                ],
                16,
            ) || prefixed(
                candidate,
                &["sk-proj-", "sk-svcacct-", "sk-admin-", "sk-ant-api"],
                16,
            ) || (candidate.starts_with("sk-")
                && candidate.len() >= 40
                && candidate.contains("T3BlbkFJ"))
        }
        Some(b'n') => prefixed(candidate, &["npm_"], 30),
        Some(b'S') => {
            candidate.starts_with("SG.") && candidate.len() >= 40 && candidate[3..].contains('.')
        }
        Some(b'A') => {
            (candidate.starts_with("AIza") && candidate.len() >= 39)
                || (candidate.len() >= 20
                    && (candidate.starts_with("AKIA") || candidate.starts_with("ASIA"))
                    && candidate
                        .bytes()
                        .all(|byte| byte.is_ascii_uppercase() || byte.is_ascii_digit()))
        }
        _ => false,
    }
}

fn age_identity(candidate: &str) -> bool {
    prefixed(candidate, &["AGE-SECRET-KEY-1", "AGE-SECRET-KEY-PQ-1"], 32)
}

fn possible_json_header(candidate: &str) -> bool {
    // A JSON object starts with '{' or JSON whitespace. Their base64url first
    // characters are e, I, C, or D. This avoids token parsing for ordinary words.
    matches!(
        candidate.as_bytes().first(),
        Some(b'e' | b'I' | b'C' | b'D')
    ) && candidate.contains('.')
}

fn compact_token(candidate: &str) -> bool {
    if !candidate.contains('.') {
        return false;
    }
    let mut segments = candidate.split('.');
    let Some(header) = segments.next() else {
        return false;
    };
    // Bound decoding work per candidate. The rest of each candidate is visited
    // once, even for malformed input with many separators.
    if header.len() < 8 || header.len() > 16_384 {
        return false;
    }
    let mut count = 1;
    for segment in segments {
        if !segment
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
        {
            return false;
        }
        count += 1;
        if count > 5 {
            return false;
        }
    }
    if !matches!(count, 3 | 5) {
        return false;
    }
    let Ok(decoded) = URL_SAFE_NO_PAD.decode(header) else {
        return false;
    };
    let Ok(header) = serde_json::from_slice::<serde_json::Value>(&decoded) else {
        return false;
    };
    header
        .get("alg")
        .is_some_and(|value| value.as_str().is_some())
        && (count == 3
            || header
                .get("enc")
                .is_some_and(|value| value.as_str().is_some()))
}
