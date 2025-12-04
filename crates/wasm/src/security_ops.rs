use strapd_core::security::hash;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn hash_md5(input: &str) -> String {
    hash::md5(input)
}

#[wasm_bindgen]
pub fn hash_sha1(input: &str) -> String {
    hash::sha1(input)
}

#[wasm_bindgen]
pub fn hash_sha256(input: &str) -> String {
    hash::sha256(input)
}

#[wasm_bindgen]
pub fn hash_sha512(input: &str) -> String {
    hash::sha512(input)
}
