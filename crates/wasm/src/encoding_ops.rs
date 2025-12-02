use strapd_core::encoding;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn base64_encode(input: &str) -> String {
    encoding::base64::encode(&input.as_bytes().to_vec())
}

#[wasm_bindgen]
pub fn base64_decode(input: &str) -> String {
    match encoding::base64::decode(input) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).to_string(),
        Err(e) => format!("Error: {}", e),
    }
}

#[wasm_bindgen]
pub fn url_encode(input: &str) -> String {
    encoding::url::encode(input)
}

#[wasm_bindgen]
pub fn url_decode(input: &str) -> String {
    match encoding::url::decode(input) {
        Ok(result) => result,
        Err(e) => format!("Error: {}", e),
    }
}

#[wasm_bindgen]
pub fn hex_encode(input: &str) -> String {
    encoding::hex::encode(&input.as_bytes().to_vec())
}

#[wasm_bindgen]
pub fn hex_decode(input: &str) -> String {
    match encoding::hex::decode(input) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).to_string(),
        Err(e) => format!("Error: {}", e),
    }
}
