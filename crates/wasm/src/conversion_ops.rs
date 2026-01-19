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
pub fn convert(value: f64, from_unit: &str, to_unit: &str) -> String {
    let request = conversion::types::ConversionRequest {
        value,
        from_unit: from_unit.to_string(),
        to_unit: Some(to_unit.to_string()),
    };

    match conversion::engine::convert(&request) {
        Ok(result) => {
            // Format the result internally before returning
            match conversion::formatter::format_output(&[result], None) {
                Ok(formatted) => formatted,
                Err(e) => format!("Error: Failed to format result: {}", e),
            }
        }
        Err(e) => format!("Error: {}", e),
    }
}

// Get all units in a category
#[wasm_bindgen]
pub fn get_units_in_category(category: &str) -> String {
    let category_enum = match category.to_lowercase().as_str() {
        "bytes" => conversion::types::UnitCategory::Bytes,
        "time" => conversion::types::UnitCategory::Time,
        "length" => conversion::types::UnitCategory::Length,
        "temperature" => conversion::types::UnitCategory::Temperature,
        _ => return format!("Error: Unknown category: {}", category),
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

    match serde_json::to_string(&wasm_units) {
        Ok(json) => json,
        Err(e) => format!("Error: Failed to serialize units: {}", e),
    }
}

// Convert to all units in the same category
#[wasm_bindgen]
pub fn convert_all(value: f64, from_unit: &str) -> String {
    match conversion::engine::convert_to_all(value, from_unit) {
        Ok(results) => {
            // Format the results internally before returning
            match conversion::formatter::format_output(&results, None) {
                Ok(formatted) => formatted,
                Err(e) => format!("Error: Failed to format results: {}", e),
            }
        }
        Err(e) => format!("Error: {}", e),
    }
}
