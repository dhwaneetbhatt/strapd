use crate::{
    args::sanitize::SanitizeOperation,
    handlers::{CommandResult, text_result},
    input::required_text,
};
use strapd_core::sanitize::secrets;

pub fn handle(operation: &SanitizeOperation) -> CommandResult {
    match operation {
        SanitizeOperation::Secrets(args) => {
            let input = required_text(args.text.as_deref(), "text")?;
            text_result(secrets(&input, args.categories()).into_owned())
        }
    }
}
