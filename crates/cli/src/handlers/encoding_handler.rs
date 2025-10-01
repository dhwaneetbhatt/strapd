use crate::{
    args::encoding::{Base64Operation, HexOperation, UrlOperation},
    handlers::{CommandResult, binary_result, get_input_bytes, get_input_string, text_result},
};
use strapd_core::encoding::{base64, hex, url};

pub fn handle_base64(operation: &Base64Operation) -> CommandResult {
    match operation {
        Base64Operation::Encode { input } => {
            let input = get_input_bytes(input)?;
            text_result(base64::encode(&input))
        }
        Base64Operation::Decode { input } => {
            let input = get_input_string(input);
            binary_result(base64::decode(&input)?)
        }
    }
}

pub fn handle_url(operation: &UrlOperation) -> CommandResult {
    match operation {
        UrlOperation::Encode { input } => {
            let input = get_input_string(input);
            text_result(url::encode(&input))
        }
        UrlOperation::Decode { input } => {
            let input = get_input_string(input);
            text_result(url::decode(&input)?)
        }
    }
}

pub fn handle_hex(operation: &HexOperation) -> CommandResult {
    match operation {
        HexOperation::Encode { input } => {
            let input = get_input_bytes(input)?;
            text_result(hex::encode(&input))
        }
        HexOperation::Decode { input } => {
            let input = get_input_string(input);
            binary_result(hex::decode(&input)?)
        }
    }
}
