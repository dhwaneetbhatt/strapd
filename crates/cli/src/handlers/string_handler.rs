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
        StringOperation::Random {
            length,
            lowercase,
            uppercase,
            digits,
            symbols,
            count,
        } => {
            // If no flags specified, use all character types
            let any_flag_set = *lowercase || *uppercase || *digits || *symbols;
            let (lower, upper, digit, symbol) = if any_flag_set {
                (*lowercase, *uppercase, *digits, *symbols)
            } else {
                (true, true, true, true)
            };

            let mut results = Vec::new();
            for _ in 0..*count {
                let result = string::random::generate(*length, lower, upper, digit, symbol);
                match result {
                    Ok(s) => results.push(s),
                    Err(e) => return error_result(&e),
                }
            }
            text_result(results.join("\n"))
        }
    }
}
