use strapd_core::data_formats;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn json_beautify(input: &str, sort: bool, spaces: u8) -> String {
    match data_formats::json::beautify(input, spaces, sort) {
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

#[wasm_bindgen]
pub fn xml_beautify(input: &str, spaces: u8) -> String {
    match data_formats::xml::beautify(input, spaces) {
        Ok(result) => result,
        Err(e) => format!("Error: {}", e),
    }
}

#[wasm_bindgen]
pub fn xml_minify(input: &str) -> String {
    match data_formats::xml::minify(input) {
        Ok(result) => result,
        Err(e) => format!("Error: {}", e),
    }
}
