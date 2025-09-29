use crate::{
    args::encoding::UrlOperation,
    handlers::{CommandResult, get_input_string, text_result},
};
use strapd_core::encoding::url;

pub fn handle(operation: &UrlOperation) -> CommandResult {
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
