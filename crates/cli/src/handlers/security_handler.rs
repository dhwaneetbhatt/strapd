use crate::{
    args::security::{HashOperation, HmacOperation},
    handlers::{CommandResult, error_result, get_input_string, text_result},
};
use strapd_core::security::{hash, hmac};

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

pub fn handle_hmac(operation: &HmacOperation) -> CommandResult {
    match operation {
        HmacOperation::Sha256 { input, secret } => call_hmac(input, secret, hmac::sha256),
        HmacOperation::Sha512 { input, secret } => call_hmac(input, secret, hmac::sha512),
    }
}

fn call_hmac<F>(input: &Option<String>, secret: &str, hmac_fn: F) -> CommandResult
where
    F: Fn(&str, &str) -> Result<String, String>,
{
    let input = get_input_string(input);
    match hmac_fn(&input, secret) {
        Ok(result) => text_result(result),
        Err(msg) => error_result(&msg),
    }
}
