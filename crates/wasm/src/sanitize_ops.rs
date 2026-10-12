use strapd_core::sanitize::{Categories, secrets};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn sanitize_secrets(input: &str, categories: u8) -> String {
    secrets(input, Categories::from_bits(categories)).into_owned()
}
