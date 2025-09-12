// string.rs
// Utility functions and command handlers for string operations

pub fn to_uppercase(input: &str) -> String {
    input.to_uppercase()
}

pub fn to_lowercase(input: &str) -> String {
    input.to_lowercase()
}

pub fn to_capitalcase(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut start = true;

    for ch in input.chars() {
        if ch.is_whitespace() {
            out.push(ch);
            start = true;
        } else if start {
            out.extend(ch.to_uppercase());
            start = false;
        } else {
            out.extend(ch.to_lowercase());
        }
    }
    out
}
