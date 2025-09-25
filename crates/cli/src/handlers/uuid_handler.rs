use crate::{
    args::identifiers::UuidOperation,
    handlers::{CommandResult, text_result},
};
use strapd_core::identifiers;

pub fn handle(operation: &UuidOperation) -> CommandResult {
    match operation {
        UuidOperation::V4 { number } => text_result(identifiers::uuid::generate_v4(*number)),
        UuidOperation::V7 { number } => text_result(identifiers::uuid::generate_v7(*number)),
    }
}
