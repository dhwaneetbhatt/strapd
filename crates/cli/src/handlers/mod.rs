pub mod calculator_handler;
pub mod clipboard_handler;
pub mod conversion_handler;
pub mod data_formats_handler;
pub mod datetime_handler;
pub mod encoding_handler;
pub mod identifiers_handler;
pub mod jwt_handler;
pub mod random_handler;
pub mod security_handler;
pub mod string_handler;

pub type CommandResult = Result<Vec<u8>, String>;

pub fn text_result(s: String) -> CommandResult {
    Ok(s.into_bytes())
}

pub fn binary_result(bytes: Vec<u8>) -> CommandResult {
    Ok(bytes)
}

pub fn error_result(msg: &str) -> CommandResult {
    Err(msg.to_string())
}
