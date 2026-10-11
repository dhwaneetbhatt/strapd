use std::borrow::Cow;

use crate::{
    args::conversion::ConvertArgs,
    handlers::{CommandResult, text_result},
    input::piped_text,
};
use strapd_core::conversion;

pub fn handle(args: &ConvertArgs) -> CommandResult {
    let stdin = piped_text()?;
    let expression = build_expression(&args.expression, stdin.as_deref())?;
    let request = conversion::parser::parse_input(&expression)?;

    let results = if args.all {
        conversion::engine::convert_to_all(request.value, &request.from_unit)?
    } else {
        vec![conversion::engine::convert(&request)?]
    };

    let output = conversion::formatter::format_output(&results, args.precision)?;
    text_result(output)
}

/// Builds the conversion expression from stdin and/or command-line args.
///
/// Supports three input modes:
/// 1. Args only: `strapd convert "10 km to mi"` - use args as full expression
/// 2. Stdin only: `echo "10 km to mi" | strapd convert` - use stdin as full expression
/// 3. Combined: `echo "10 km" | strapd convert "mi"` - concatenate stdin + args
///    Example: stdin="10 km", args=["mi"] -> "10 km mi"
fn build_expression<'a>(args: &[String], stdin: Option<&'a str>) -> Result<Cow<'a, str>, String> {
    let stdin_content = stdin.unwrap_or_default().trim();
    let has_stdin = !stdin_content.is_empty();
    let has_args = !args.is_empty();

    if !has_stdin && !has_args {
        return Err("No input provided. Provide expression as argument or via stdin.".to_string());
    }

    if !has_stdin {
        return Ok(Cow::Owned(args.join(" ")));
    }

    if !has_args {
        return Ok(Cow::Borrowed(stdin_content));
    }

    // Both stdin and args present - combine them
    Ok(Cow::Owned(format!("{stdin_content} {}", args.join(" "))))
}
