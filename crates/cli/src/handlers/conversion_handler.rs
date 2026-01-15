use crate::{
    args::conversion::ConvertArgs,
    handlers::{CommandResult, read_stdin_if_piped, text_result},
};
use strapd_core::conversion;

pub fn handle(args: &ConvertArgs) -> CommandResult {
    let expression = build_expression(&args.expression)?;
    let request = conversion::parse_input(&expression)?;

    let results = if args.all {
        conversion::convert_to_all(request.value, &request.from_unit)?
    } else {
        vec![conversion::convert(&request)?]
    };

    let output = conversion::format_output(&results, args.explain, args.precision);
    text_result(output)
}

fn build_expression(args: &[String]) -> Result<String, String> {
    let args_str = args.join(" ");
    let stdin_content = read_stdin_if_piped()?;

    match (args_str.is_empty(), stdin_content.is_empty()) {
        (true, false) => Ok(stdin_content),
        (false, true) => Ok(args_str),
        (false, false) => Ok(format!("{} {}", stdin_content, args_str)),
        (true, true) => {
            Err("No input provided. Provide expression as argument or via stdin.".to_string())
        }
    }
}
