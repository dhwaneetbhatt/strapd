use crate::{
    handlers::{CommandResult, text_result},
    input::{required_text, text_with_piped_trim},
};
use strapd_core::calculator;

pub fn handle(expression: &Option<String>) -> CommandResult {
    let expr = required_text(expression.as_deref(), "expression")?;
    let result = calculator::evaluate(text_with_piped_trim(&expr))?;
    text_result(result)
}
