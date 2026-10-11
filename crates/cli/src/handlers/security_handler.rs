use crate::{
    args::security::{HashOperation, HmacOperation},
    handlers::{CommandResult, error_result, text_result},
    input::{bytes_with_piped_trim, required_bytes},
};
use strapd_core::security::{hash, hmac};

pub fn handle_hash(operation: &HashOperation) -> CommandResult {
    match operation {
        HashOperation::Md5 { input } => call_hash(input, hash::md5_bytes),
        HashOperation::Sha1 { input } => call_hash(input, hash::sha1_bytes),
        HashOperation::Sha256 { input } => call_hash(input, hash::sha256_bytes),
        HashOperation::Sha512 { input } => call_hash(input, hash::sha512_bytes),
    }
}

fn call_hash<F>(input: &Option<String>, hash_fn: F) -> CommandResult
where
    F: Fn(&[u8]) -> String,
{
    let input = required_bytes(input.as_deref(), "message")?;
    text_result(hash_fn(bytes_with_piped_trim(&input)))
}

pub fn handle_hmac(operation: &HmacOperation) -> CommandResult {
    match operation {
        HmacOperation::Sha256 { input, secret } => call_hmac(input, secret, hmac::sha256_bytes),
        HmacOperation::Sha512 { input, secret } => call_hmac(input, secret, hmac::sha512_bytes),
    }
}

fn call_hmac<F>(input: &Option<String>, secret: &str, hmac_fn: F) -> CommandResult
where
    F: Fn(&[u8], &str) -> Result<String, String>,
{
    let input = required_bytes(input.as_deref(), "message")?;
    match hmac_fn(bytes_with_piped_trim(&input), secret) {
        Ok(result) => text_result(result),
        Err(msg) => error_result(&msg),
    }
}
