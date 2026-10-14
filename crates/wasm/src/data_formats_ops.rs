use strapd_core::data_formats;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn json_beautify(input: &str, sort: bool, spaces: u8) -> Result<String, JsValue> {
    data_formats::json::beautify(input, spaces, sort).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn json_minify(input: &str, sort: bool) -> Result<String, JsValue> {
    data_formats::json::minify(input, sort).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn json_sample(input: &str, size: usize, seed: u64) -> Result<String, JsValue> {
    let outcome =
        data_formats::json_sample::sample(input, size, seed).map_err(crate::wasm_error)?;
    serde_json::to_string(&serde_json::json!({
        "output": outcome.output,
        "filtered": {
            "nulls": outcome.filtered.nulls,
            "emptyArrays": outcome.filtered.empty_arrays,
        },
        "sampling": {
            "omittedTotal": outcome.sampling.omitted_total,
            "arrays": outcome.sampling.arrays.iter().map(|array| serde_json::json!({
                "path": array.path,
                "omitted": array.omitted,
            })).collect::<Vec<_>>(),
        },
    }))
    .map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn xml_beautify(input: &str, spaces: u8) -> Result<String, JsValue> {
    data_formats::xml::beautify(input, spaces).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn xml_minify(input: &str) -> Result<String, JsValue> {
    data_formats::xml::minify(input).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn json_to_yaml(input: &str) -> Result<String, JsValue> {
    data_formats::json::convert_to_yaml(input).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn yaml_to_json(input: &str) -> Result<String, JsValue> {
    data_formats::yaml::convert_to_json(input).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn json_to_xml(input: &str, root: Option<String>) -> Result<String, JsValue> {
    data_formats::json::convert_to_xml(input, root.as_deref()).map_err(crate::wasm_error)
}

#[wasm_bindgen]
pub fn xml_to_json(input: &str) -> Result<String, JsValue> {
    data_formats::xml::convert_to_json(input).map_err(crate::wasm_error)
}
