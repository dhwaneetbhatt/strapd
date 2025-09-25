use crate::{
    args::string::StringOperation,
    handlers::{CommandResult, error_result, get_input_string, text_result},
};
use strapd_core::string;

pub fn handle(operation: &StringOperation) -> CommandResult {
    match operation {
        StringOperation::Uppercase { input } => {
            let input = get_input_string(input);
            text_result(string::case::to_uppercase(&input))
        }
        StringOperation::Lowercase { input } => {
            let input = get_input_string(input);
            text_result(string::case::to_lowercase(&input))
        }
        StringOperation::CapitalCase { input } => {
            let input = get_input_string(input);
            text_result(string::case::to_capitalcase(&input))
        }
        StringOperation::Reverse { input } => {
            let input = get_input_string(input);
            text_result(string::transform::reverse(&input))
        }
        StringOperation::Replace { params } => match params.as_slice() {
            [search, replacement] => {
                let input = get_input_string(&None);
                text_result(string::transform::replace(&input, search, replacement))
            }
            [input, search, replacement] => {
                text_result(string::transform::replace(input, search, replacement))
            }
            _ => error_result("Invalid number of arguments to replace"),
        },
        StringOperation::Trim {
            input,
            left,
            right,
            all,
        } => {
            let input = get_input_string(input);
            text_result(string::whitespace::trim(&input, *left, *right, *all))
        }
        StringOperation::Slugify { input, separator } => {
            let input = get_input_string(input);
            text_result(string::transform::slugify(&input, *separator))
        }
    }
}
