use strapd_core::datetime::timestamp::{self, TimestampFormat};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn datetime_now(millis: bool) -> i64 {
    match millis {
        true => timestamp::now_millis(),
        false => timestamp::now(),
    }
}

#[wasm_bindgen]
pub fn datetime_from_timestamp(timestamp: i64, format: &str) -> String {
    let format = match format {
        "Iso" => TimestampFormat::Iso,
        _ => TimestampFormat::Human,
    };

    match timestamp::from_timestamp(timestamp, format) {
        Ok(s) => s,
        Err(e) => format!("Error: {}", e),
    }
}

#[wasm_bindgen]
pub fn datetime_from_timestamp_millis(timestamp: i64, format: &str) -> String {
    let format = match format {
        "Iso" => TimestampFormat::Iso,
        _ => TimestampFormat::Human,
    };

    match timestamp::from_timestamp_millis(timestamp, format) {
        Ok(s) => s,
        Err(e) => format!("Error: {}", e),
    }
}
