use crate::{
    args::data_formats::{JsonOperation, SqlOperation, XmlOperation},
    handlers::{CommandResult, get_input_string, text_result},
};
use strapd_core::data_formats::{json, sql, xml};

pub fn handle_json(operation: &JsonOperation) -> CommandResult {
    match operation {
        JsonOperation::Beautify {
            input,
            spaces,
            sort,
        } => {
            let input = get_input_string(input);
            text_result(json::beautify(&input, *spaces, *sort)?)
        }
        JsonOperation::Minify { input, sort } => {
            let input = get_input_string(input);
            text_result(json::minify(&input, *sort)?)
        }
        JsonOperation::Sort { input, format } => {
            let input = get_input_string(input);
            text_result(json::sort(&input, *format)?)
        }
    }
}

pub fn handle_xml(operation: &XmlOperation) -> CommandResult {
    match operation {
        XmlOperation::Beautify { input, spaces } => {
            let input = get_input_string(input);
            text_result(xml::beautify(&input, *spaces)?)
        }
        XmlOperation::Minify { input } => {
            let input = get_input_string(input);
            text_result(xml::minify(&input)?)
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
