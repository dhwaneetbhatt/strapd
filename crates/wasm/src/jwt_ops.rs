use std::str::FromStr;

use strapd_core::jwt::{self, Algorithm, SignOptions};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn jwt_decode(input: &str) -> Result<String, JsValue> {
    jwt::decode_json(input, false).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn jwt_decode_with_analysis(input: &str) -> Result<String, JsValue> {
    jwt::decode_json(input, true).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn jwt_header(input: &str) -> Result<String, JsValue> {
    jwt::header_json(input).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn jwt_payload(input: &str) -> Result<String, JsValue> {
    jwt::payload_json(input).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn jwt_verify(input: &str, secret: &str) -> Result<String, JsValue> {
    let verification = jwt::verify(input, secret).map_err(crate::wasm_error)?;
    serde_json::to_string(&verification).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn jwt_sign(
    payload: &str,
    secret: &str,
    algorithm: &str,
    expires_in_seconds: Option<i64>,
) -> Result<String, JsValue> {
    let algorithm = Algorithm::from_str(algorithm).map_err(crate::wasm_error)?;
    jwt::sign(
        payload,
        secret,
        SignOptions {
            algorithm,
            expires_in_seconds,
        },
    )
    .map_err(crate::wasm_error)
}
