use copypasta::{ClipboardContext, ClipboardProvider};

use crate::handlers::{CommandResult, get_input_string, text_result};

pub fn handle_copy(input: &Option<String>) -> CommandResult {
    let input = get_input_string(input);

    let mut ctx = ClipboardContext::new().map_err(|e| format!("Error accessing clipboard: {e}"))?;
    ctx.set_contents(input.to_string())
        .map_err(|e| format!("Error copying to clipboard: {e}"))?;

    Ok(Vec::with_capacity(0))
}

pub fn handle_paste() -> CommandResult {
    let mut ctx = ClipboardContext::new().map_err(|e| format!("Error accessing clipboard: {e}"))?;

    let text = ctx
        .get_contents()
        .map_err(|e| format!("Error copying to clipboard: {e}"))?;

    text_result(text)
}
