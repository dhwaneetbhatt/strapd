use crate::{
    args::data_formats::JsonOperation,
    handlers::{CommandResult, get_input_string, text_result},
};
use strapd_core::data_formats::json;

pub fn handle(operation: &JsonOperation) -> CommandResult {
    match operation {
        JsonOperation::Beautify { input, spaces } => {
            let input = get_input_string(input);
            text_result(json::beautify(&input, *spaces)?)
        }
        JsonOperation::Minify { input } => {
            let input = get_input_string(input);
            text_result(json::minify(&input)?)
        }
    }
}
