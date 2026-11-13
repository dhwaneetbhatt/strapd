use strapd_core::sanitize::{Categories, secrets};
use wasm_bindgen::prelude::*;

/// Packed category/start/end triples; offsets count UTF-8 bytes, not JS characters.
#[wasm_bindgen]
pub fn detect_pii(input: &str, categories: u8) -> Vec<u32> {
    use strapd_core::sanitize::pii::{self, Categories};
    pii::detect(input, Categories::from_bits(categories))
        .into_iter()
        .flat_map(|found| {
            [
                found.category as u32,
                found.range.start as u32,
                found.range.end as u32,
            ]
        })
        .collect()
}

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
