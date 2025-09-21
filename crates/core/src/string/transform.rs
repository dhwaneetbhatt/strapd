// transform.rs
// String transformation utilities

pub fn reverse(input: &str) -> String {
    input.chars().rev().collect()
}

pub fn replace(input: &str, search: &str, replacement: &str) -> String {
    input.replace(search, replacement)
}

pub fn slugify(input: &str, separator: char) -> String {
    let mut out = String::with_capacity(input.len());
    let mut prev_sep = false;

    for ch in input.trim().chars().flat_map(|c| c.to_lowercase()) {
        if ch.is_alphanumeric() {
            out.push(ch);
            prev_sep = false;
        } else if ch.is_whitespace() && !prev_sep {
            out.push(separator);
            prev_sep = true;
        }
    }

    // Remove trailing separator if present
    if out.ends_with(separator) {
        out.pop();
    }

    out
}
