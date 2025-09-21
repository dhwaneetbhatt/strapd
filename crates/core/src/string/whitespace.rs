// whitespace.rs
// String whitespace manipulation utilities

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
