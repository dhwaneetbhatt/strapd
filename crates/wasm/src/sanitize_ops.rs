use strapd_core::sanitize::{Categories, secrets};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn sanitize_secrets(input: &str, categories: u8) -> String {
    secrets(input, Categories::from_bits(categories)).into_owned()
}

#[wasm_bindgen]
pub fn sanitize_pii(input: &str, categories: u8, pseudonymize: bool) -> String {
    use strapd_core::sanitize::pii::{self, Categories, Mode};
    pii::sanitize(
        input,
        Categories::from_bits(categories),
        if pseudonymize {
            Mode::Pseudonymize
        } else {
            Mode::Mask
        },
    )
    .into_owned()
}
