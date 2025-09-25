use crate::{
    args::encoding::Base64Operation,
    handlers::{CommandResult, binary_result, get_input_bytes, get_input_string, text_result},
};
use strapd_core::encoding::base64;

pub fn handle(operation: &Base64Operation) -> CommandResult {
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
