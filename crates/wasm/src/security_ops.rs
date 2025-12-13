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

#[wasm_bindgen]
pub fn hmac_sha256(input: &str, key: &str) -> String {
    match strapd_core::security::hmac::sha256(input, key) {
        Ok(result) => result,
        Err(e) => format!("Error: {}", e),
    }
}

#[wasm_bindgen]
pub fn hmac_sha512(input: &str, key: &str) -> String {
    match strapd_core::security::hmac::sha512(input, key) {
        Ok(result) => result,
        Err(e) => format!("Error: {}", e),
    }
}
