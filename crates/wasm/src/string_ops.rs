use strapd_core::string;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn string_to_uppercase(input: &str) -> String {
    string::case::to_uppercase(input)
}

#[wasm_bindgen]
pub fn string_to_lowercase(input: &str) -> String {
    string::case::to_lowercase(input)
}

#[wasm_bindgen]
pub fn string_to_capitalcase(input: &str) -> String {
    string::case::to_capitalcase(input)
}

// Analysis
#[wasm_bindgen]
pub fn string_count_lines(input: &str) -> usize {
    string::analysis::count_lines(input)
}

#[wasm_bindgen]
pub fn string_count_words(input: &str) -> usize {
    string::analysis::count_words(input)
}

#[wasm_bindgen]
pub fn string_count_chars(input: &str) -> usize {
    string::analysis::count_chars(input)
}

#[wasm_bindgen]
pub fn string_count_bytes(input: &str) -> usize {
    string::analysis::count_bytes(input)
}

// Transform
#[wasm_bindgen]
pub fn string_reverse(input: &str) -> String {
    string::transform::reverse(input)
}

#[wasm_bindgen]
pub fn string_replace(input: &str, search: &str, replacement: &str) -> String {
    string::transform::replace(input, search, replacement)
}

#[wasm_bindgen]
pub fn string_slugify(input: &str, separator: char) -> String {
    string::transform::slugify(input, separator)
}

// Whitespace
#[wasm_bindgen]
pub fn string_trim(input: &str, left: bool, right: bool, all: bool) -> String {
    string::whitespace::trim(input, left, right, all)
}
