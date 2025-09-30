use crate::{
    args::security::HashOperation,
    handlers::{CommandResult, get_input_string, text_result},
};
use strapd_core::security::hash;

pub fn handle_hash(operation: &HashOperation) -> CommandResult {
    match operation {
        HashOperation::Md5 { input } => call_hash(input, hash::md5),
        HashOperation::Sha1 { input } => call_hash(input, hash::sha1),
        HashOperation::Sha256 { input } => call_hash(input, hash::sha256),
        HashOperation::Sha512 { input } => call_hash(input, hash::sha512),
    }
}

fn call_hash<F>(input: &Option<String>, hash_fn: F) -> CommandResult
where
    F: Fn(&str) -> String,
{
    let input = get_input_string(input);
    text_result(hash_fn(&input))
}
