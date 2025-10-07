use crate::{
    args::string::StringOperation,
    handlers::{CommandResult, get_input_string, text_result},
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
        StringOperation::Replace {
            input,
            find,
            replace,
        } => {
            let input = get_input_string(input);
            text_result(string::transform::replace(&input, find, replace))
        }
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
        StringOperation::Random { args } => super::random_handler::handle_random_string(args),
    }
}
