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

    let output = conversion::format_output(&results, args.explain, args.precision)?;
    text_result(output)
}

/// Builds the conversion expression from stdin and/or command-line args.
///
/// Supports three input modes:
/// 1. Args only: `strapd convert "10 km to mi"` - use args as full expression
/// 2. Stdin only: `echo "10 km to mi" | strapd convert` - use stdin as full expression
/// 3. Combined: `echo "10 km" | strapd convert "mi"` - concatenate stdin + args
///    Example: stdin="10 km", args=["mi"] -> "10 km mi"
fn build_expression(args: &[String]) -> Result<String, String> {
    let mut stdin_content = read_stdin_if_piped()?;
    let has_stdin = !stdin_content.is_empty();
    let has_args = !args.is_empty();

    if !has_stdin && !has_args {
        return Err("No input provided. Provide expression as argument or via stdin.".to_string());
    }

    if !has_stdin {
        return Ok(args.join(" "));
    }

    if !has_args {
        return Ok(stdin_content);
    }

    // Both stdin and args present - combine them
    let args_str = args.join(" ");
    stdin_content.push(' ');
    stdin_content.push_str(&args_str);
    Ok(stdin_content)
}
