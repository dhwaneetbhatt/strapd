use strapd_core::identifiers;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn uuid_generate_v4(count: usize) -> String {
    identifiers::uuid::generate_v4(count)
}

#[wasm_bindgen]
pub fn uuid_generate_v7(count: usize) -> String {
    identifiers::uuid::generate_v7(count)
}
