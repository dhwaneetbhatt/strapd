// Handlers for various command line operations
use std::io::{self, Read};

pub mod base64_handler;
pub mod hash_handler;
pub mod json_handler;
pub mod string_handler;
pub mod url_handler;
pub mod uuid_handler;
pub mod xml_handler;

pub type CommandResult = Result<Vec<u8>, String>;

pub fn text_result(s: String) -> CommandResult {
    Ok(s.into_bytes())
}

pub fn binary_result(bytes: Vec<u8>) -> CommandResult {
    Ok(bytes)
}

pub fn get_input_string(input: &Option<String>) -> String {
    match input.as_ref() {
        Some(s) => s.clone(),
        None => {
            let mut buf = String::new();
            io::stdin()
                .read_to_string(&mut buf)
                .expect("Failed to read from stdin");
            buf.trim().to_string()
        }
    }
}

pub fn get_input_bytes(input: &Option<String>) -> Result<Vec<u8>, String> {
    match input.as_ref() {
        Some(s) => Ok(s.as_bytes().to_vec()),
        None => {
            let mut buf = Vec::new();
            io::stdin()
                .read_to_end(&mut buf)
                .map_err(|e| format!("Failed to read from stdin: {}", e))?;
            Ok(buf)
        }
    }
}
