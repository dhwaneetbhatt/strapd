use strapd_core::data_formats;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn json_beautify(input: &str, sort: bool) -> String {
    match data_formats::json::beautify(input, 2, sort) {
        Ok(result) => result,
        Err(e) => format!("Error: {}", e),
    }
}

#[wasm_bindgen]
pub fn json_minify(input: &str, sort: bool) -> String {
    match data_formats::json::minify(input, sort) {
        Ok(result) => result,
        Err(e) => format!("Error: {}", e),
    }
}
