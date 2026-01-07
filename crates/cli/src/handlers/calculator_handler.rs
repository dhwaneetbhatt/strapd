use crate::handlers::{CommandResult, get_input_string, text_result};
use strapd_core::calculator;

pub fn handle(expression: &Option<String>) -> CommandResult {
    let expr = get_input_string(expression);
    let result = calculator::evaluate(&expr)?;
    text_result(result)
}
