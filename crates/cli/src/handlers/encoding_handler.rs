use crate::{
    args::encoding::{Base64Operation, HexOperation, UrlOperation},
    handlers::{CommandResult, binary_result, text_result},
    input::{required_bytes, required_text, text_with_piped_trim},
};
use strapd_core::encoding::{base64, hex, url};

pub fn handle_base64(operation: &Base64Operation) -> CommandResult {
    match operation {
        Base64Operation::Encode { input } => {
            let input = required_bytes(input.as_deref(), "input")?;
            text_result(base64::encode(input.as_ref()))
        }
        Base64Operation::Decode { input } => {
            let input = required_text(input.as_deref(), "input")?;
            binary_result(base64::decode(text_with_piped_trim(&input))?)
        }
    }
}

pub fn handle_url(operation: &UrlOperation) -> CommandResult {
    match operation {
        UrlOperation::Encode { input } => {
            let input = required_text(input.as_deref(), "input")?;
            text_result(url::encode(text_with_piped_trim(&input)))
        }
        UrlOperation::Decode { input } => {
            let input = required_text(input.as_deref(), "input")?;
            text_result(url::decode(text_with_piped_trim(&input))?)
        }
    }
}

pub fn handle_hex(operation: &HexOperation) -> CommandResult {
    match operation {
        HexOperation::Encode { input } => {
            let input = required_bytes(input.as_deref(), "input")?;
            text_result(hex::encode(input.as_ref()))
        }
        HexOperation::Decode { input } => {
            let input = required_text(input.as_deref(), "input")?;
            binary_result(hex::decode(text_with_piped_trim(&input))?)
        }
    }
}
