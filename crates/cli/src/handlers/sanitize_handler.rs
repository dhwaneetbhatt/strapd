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
        SanitizeOperation::Pii(args) => {
            use strapd_core::sanitize::pii::{self, Mode};
            let input = required_text(args.text.as_deref(), "text")?;
            let mode = if args.pseudonymize {
                Mode::Pseudonymize
            } else {
                Mode::Mask
            };
            text_result(pii::sanitize(&input, args.categories(), mode).into_owned())
        }
    }
}
