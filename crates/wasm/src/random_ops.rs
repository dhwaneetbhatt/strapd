use strapd_core::random;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn random_string(
    count: usize,
    length: u8,
    lowercase: bool,
    uppercase: bool,
    digits: bool,
    symbols: bool,
    custom_charset: Option<String>,
) -> String {
    match random::string(
        count,
        length,
        lowercase,
        uppercase,
        digits,
        symbols,
        custom_charset.as_deref(),
    ) {
        Ok(v) => v.join("\n"),
        Err(e) => format!("Error: {}", e),
    }
}

#[wasm_bindgen]
pub fn random_number(min: i64, max: i64, count: usize) -> Vec<i64> {
    random::number(min, max, count)
}
