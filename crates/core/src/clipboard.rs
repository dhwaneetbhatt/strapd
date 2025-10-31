use copypasta::{ClipboardContext, ClipboardProvider};

pub fn copy_to(input: &str) -> Result<(), String> {
    let mut ctx = ClipboardContext::new().map_err(|e| format!("Error accessing clipboard: {e}"))?;

    ctx.set_contents(input.to_string())
        .map_err(|e| format!("Error copying to clipboard: {e}"))?;

    Ok(())
}

pub fn paste_from() -> Result<String, String> {
    let mut ctx = ClipboardContext::new().map_err(|e| format!("Error accessing clipboard: {e}"))?;

    let text = ctx
        .get_contents()
        .map_err(|e| format!("Error copying to clipboard: {e}"))?;

    Ok(text)
}
