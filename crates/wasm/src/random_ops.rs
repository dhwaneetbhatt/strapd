use strapd_core::random;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn random_string(
    length: u8,
    lowercase: bool,
    uppercase: bool,
    digits: bool,
    symbols: bool,
) -> String {
    match random::string(length, lowercase, uppercase, digits, symbols) {
        Ok(s) => s,
        Err(e) => format!("Error: {}", e),
    }
}

#[wasm_bindgen]
pub fn random_number(min: i64, max: i64, count: usize) -> Vec<i64> {
    random::number(min, max, count)
}
