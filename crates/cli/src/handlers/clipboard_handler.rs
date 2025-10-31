use strapd_core::clipboard;

use crate::handlers::{CommandResult, error_result, get_input_string, text_result};

pub fn handle_copy(input: &Option<String>) -> CommandResult {
    let input = get_input_string(input);
    match clipboard::copy_to(&input) {
        Ok(_) => Ok(Vec::with_capacity(0)),
        Err(msg) => error_result(&msg),
    }
}

pub fn handle_paste() -> CommandResult {
    match clipboard::paste_from() {
        Ok(s) => text_result(s),
        Err(msg) => error_result(&msg),
    }
}
