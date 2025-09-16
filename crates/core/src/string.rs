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

pub fn trim(input: &str, left: bool, right: bool, all: bool) -> String {
    if left {
        input.trim_start().to_string()
    } else if right {
        input.trim_end().to_string()
    } else if all {
        collapse_whitspace(input.trim())
    } else {
        input.trim().to_string()
    }
}

fn collapse_whitspace(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut previous_ws = false;

    for ch in input.chars() {
        if ch.is_whitespace() {
            if !previous_ws {
                out.push(ch);
                previous_ws = true;
            }
        } else {
            out.push(ch);
            previous_ws = false;
        }
    }
    out
}
