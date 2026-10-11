use std::{borrow::Cow, env};

use strapd_core::jwt::{self, SignOptions};

use crate::{
    args::jwt::{JwtOperation, SecretArgs},
    handlers::{CommandResult, text_result},
    input::{required_text, text_with_piped_trim},
};

pub fn handle(operation: &JwtOperation) -> CommandResult {
    match operation {
        JwtOperation::Decode {
            token,
            include_analysis,
        } => {
            let token = required_input(token, "JWT token")?;
            jwt::decode_json(text_with_piped_trim(&token), *include_analysis)
                .map_err(|error| error.to_string())
                .and_then(text_result)
        }
        JwtOperation::Payload { token } => {
            let token = required_input(token, "JWT token")?;
            jwt::payload_json(text_with_piped_trim(&token))
                .map_err(|error| error.to_string())
                .and_then(text_result)
        }
        JwtOperation::Header { token } => {
            let token = required_input(token, "JWT token")?;
            jwt::header_json(text_with_piped_trim(&token))
                .map_err(|error| error.to_string())
                .and_then(text_result)
        }
        JwtOperation::Verify { token, secret } => {
            let token = required_input(token, "JWT token")?;
            let secret = resolve_secret(secret)?;
            jwt::verify(text_with_piped_trim(&token), &secret)
                .map(|verification| {
                    format!(
                        "SUCCESS: Signature valid (Algorithm: {})",
                        verification.algorithm
                    )
                })
                .map_err(|error| error.to_string())
                .and_then(text_result)
        }
        JwtOperation::Sign {
            payload,
            secret,
            algorithm,
            exp,
        } => {
            let payload = required_input(payload, "JSON payload")?;
            let secret = resolve_secret(secret)?;
            jwt::sign(
                text_with_piped_trim(&payload),
                &secret,
                SignOptions {
                    algorithm: (*algorithm).into(),
                    expires_in_seconds: *exp,
                },
            )
            .map_err(|error| error.to_string())
            .and_then(text_result)
        }
    }
}

fn required_input<'a>(input: &'a Option<String>, name: &str) -> Result<Cow<'a, str>, String> {
    let value = required_text(input.as_deref(), name)?;
    if text_with_piped_trim(&value).is_empty() {
        if input.is_some() {
            Err(format!("No {name} provided"))
        } else {
            Err(format!(
                "No {name} provided. Pass it as an argument or pipe it through stdin."
            ))
        }
    } else {
        Ok(value)
    }
}

fn resolve_secret(args: &SecretArgs) -> Result<Cow<'_, str>, String> {
    if let Some(secret) = &args.secret {
        return Ok(Cow::Borrowed(secret));
    }

    let variable = args
        .secret_env
        .as_deref()
        .ok_or_else(|| "A secret source is required".to_string())?;
    let value = env::var_os(variable)
        .ok_or_else(|| format!("Environment variable {variable} is not set"))?;
    value
        .into_string()
        .map(Cow::Owned)
        .map_err(|_| format!("Environment variable {variable} is not valid Unicode"))
}
