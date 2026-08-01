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
) -> Result<String, JsValue> {
    random::string(
        count,
        length,
        lowercase,
        uppercase,
        digits,
        symbols,
        custom_charset.as_deref(),
    )
    .map(|values| values.join("\n"))
    .map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn random_number(min: i64, max: i64, count: usize) -> Vec<i64> {
    random::number(min, max, count)
}
