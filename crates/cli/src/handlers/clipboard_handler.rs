use copypasta::{ClipboardContext, ClipboardProvider};

use crate::{
    handlers::{CommandResult, text_result},
    input::{required_text, text_with_piped_trim},
};

pub fn handle_copy(input: &Option<String>) -> CommandResult {
    let input = required_text(input.as_deref(), "input")?;

    let mut ctx = ClipboardContext::new().map_err(|e| format!("Error accessing clipboard: {e}"))?;
    ctx.set_contents(text_with_piped_trim(&input).to_string())
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
