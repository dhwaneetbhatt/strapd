use strapd_core::string;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn uppercase(input: &str) -> String {
    string::case::to_uppercase(input)
}
