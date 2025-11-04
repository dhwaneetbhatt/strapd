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
