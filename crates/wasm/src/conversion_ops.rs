use serde::{Deserialize, Serialize};
use strapd_core::conversion;
use wasm_bindgen::prelude::*;

// Serializable structs for JS interop
#[derive(Serialize, Deserialize)]
pub struct WasmUnit {
    pub canonical_name: String,
    pub aliases: Vec<String>,
    pub category: String,
}

// Convert a single value between units
#[wasm_bindgen]
pub fn convert(value: f64, from_unit: &str, to_unit: &str) -> Result<String, JsValue> {
    let request = conversion::types::ConversionRequest {
        value,
        from_unit: from_unit.to_string(),
        to_unit: Some(to_unit.to_string()),
    };

    let result = conversion::engine::convert(&request).map_err(crate::wasm_error)?;
    conversion::formatter::format_output(&[result], None)
        .map_err(|error| crate::wasm_error(format!("Failed to format result: {error}")))
}

// Get all units in a category
#[wasm_bindgen]
pub fn get_units_in_category(category: &str) -> Result<String, JsValue> {
    let category_enum = match category.to_lowercase().as_str() {
        "bytes" => conversion::types::UnitCategory::Bytes,
        "time" => conversion::types::UnitCategory::Time,
        "length" => conversion::types::UnitCategory::Length,
        "temperature" => conversion::types::UnitCategory::Temperature,
        _ => return Err(crate::wasm_error(format!("Unknown category: {category}"))),
    };

    let units = conversion::types::get_units_in_category(category_enum);

    let wasm_units: Vec<WasmUnit> = units
        .iter()
        .map(|u| WasmUnit {
            canonical_name: u.canonical_name.to_string(),
            aliases: u.aliases.iter().map(|s| s.to_string()).collect(),
            category: format!("{:?}", u.category),
        })
        .collect();

    serde_json::to_string(&wasm_units)
        .map_err(|error| crate::wasm_error(format!("Failed to serialize units: {error}")))
}

// Convert to all units in the same category
#[wasm_bindgen]
pub fn convert_all(value: f64, from_unit: &str) -> Result<String, JsValue> {
    let results =
        conversion::engine::convert_to_all(value, from_unit).map_err(crate::wasm_error)?;
    conversion::formatter::format_output(&results, None)
        .map_err(|error| crate::wasm_error(format!("Failed to format results: {error}")))
}
