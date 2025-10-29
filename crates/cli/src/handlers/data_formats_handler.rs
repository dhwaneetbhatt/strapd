use crate::{
    args::data_formats::{JsonOperation, SqlOperation, XmlOperation, YamlOperation},
    handlers::{CommandResult, error_result, get_input_string, text_result},
};
use strapd_core::data_formats::{json, sql, xml, yaml};

pub fn handle_json(operation: &JsonOperation) -> CommandResult {
    match operation {
        JsonOperation::Beautify {
            input,
            spaces,
            sort,
        } => {
            let input = get_input_string(input);
            match json::beautify(&input, *spaces, *sort) {
                Ok(json) => text_result(json),
                Err(e) => error_result(e),
            }
        }
        JsonOperation::Minify { input, sort } => {
            let input = get_input_string(input);
            match json::minify(&input, *sort) {
                Ok(json) => text_result(json),
                Err(e) => error_result(e),
            }
        }
        JsonOperation::Sort { input, format } => {
            let input = get_input_string(input);
            match json::sort(&input, *format) {
                Ok(json) => text_result(json),
                Err(e) => error_result(e),
            }
        }
        JsonOperation::Convert { input, to } => {
            if *to != "yaml" {
                return error_result("JSON can only be converted to yaml");
            }
            let input = get_input_string(input);
            match json::convert_to_yaml(&input) {
                Ok(json) => text_result(json),
                Err(e) => error_result(&e),
            }
        }
    }
}

pub fn handle_yaml(operation: &YamlOperation) -> CommandResult {
    match operation {
        YamlOperation::Convert { input, to } => {
            if *to != "json" {
                return error_result("YAML can only be converted to json");
            }
            let input = get_input_string(input);
            match yaml::convert_to_json(&input) {
                Ok(json) => text_result(json),
                Err(e) => error_result(&e),
            }
        }
    }
}

pub fn handle_xml(operation: &XmlOperation) -> CommandResult {
    match operation {
        XmlOperation::Beautify { input, spaces } => {
            let input = get_input_string(input);
            match xml::beautify(&input, *spaces) {
                Ok(xml) => text_result(xml),
                Err(e) => error_result(&e),
            }
        }
        XmlOperation::Minify { input } => {
            let input = get_input_string(input);
            match xml::minify(&input) {
                Ok(xml) => text_result(xml),
                Err(e) => error_result(&e),
            }
        }
    }
}

pub fn handle_sql(operation: &SqlOperation) -> CommandResult {
    match operation {
        SqlOperation::Beautify { input, spaces } => {
            let input = get_input_string(input);
            text_result(sql::beautify(&input, *spaces))
        }
        SqlOperation::Minify { input } => {
            let input = get_input_string(input);
            text_result(sql::minify(&input))
        }
    }
}
