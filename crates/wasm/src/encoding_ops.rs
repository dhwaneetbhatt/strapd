use strapd_core::encoding;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn base64_encode(input: &str) -> String {
    encoding::base64::encode(&input.as_bytes().to_vec())
}

#[wasm_bindgen]
pub fn base64_decode(input: &str) -> Result<String, JsValue> {
    encoding::base64::decode(input)
        .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
        .map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn url_encode(input: &str) -> String {
    encoding::url::encode(input)
}

#[wasm_bindgen]
pub fn url_decode(input: &str) -> Result<String, JsValue> {
    encoding::url::decode(input).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn hex_encode(input: &str) -> String {
    encoding::hex::encode(&input.as_bytes().to_vec())
}

#[wasm_bindgen]
pub fn hex_decode(input: &str) -> Result<String, JsValue> {
    encoding::hex::decode(input)
        .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
        .map_err(crate::wasm_error)
}
