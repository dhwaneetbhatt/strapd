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
        StringOperation::Count {
            input,
            lines,
            words,
            chars,
            bytes,
        } => {
            let input = get_input_string(input);

            // If no flags set, show all
            let show_all = !(*lines || *words || *chars || *bytes);

            let mut output = Vec::new();
            if show_all || *lines {
                output.push(format!("Lines: {}", string::analysis::count_lines(&input)));
            }
            if show_all || *words {
                output.push(format!("Words: {}", string::analysis::count_words(&input)));
            }
            if show_all || *chars {
                output.push(format!(
                    "Characters: {}",
                    string::analysis::count_chars(&input)
                ));
            }
            if show_all || *bytes {
                output.push(format!("Bytes: {}", string::analysis::count_bytes(&input)));
            }
            text_result(output.join("\n"))
        }
        StringOperation::Frequency {
            input,
            words,
            chars,
        } => {
            let input = get_input_string(input);
            let mut output = Vec::new();
            if *words {
                let result = string::analysis::word_frequency(&input);
                for (k, v) in result {
                    output.push(format!("{k}: {v}"));
                }
            } else if *chars {
                let result = string::analysis::char_frequency(&input);
                for (k, v) in result {
                    output.push(format!("{k}: {v}"));
                }
            }
            text_result(output.join("\n"))
        }
    }
}
