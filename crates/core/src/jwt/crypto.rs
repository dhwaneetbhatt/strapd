use base64::{Engine, prelude::BASE64_URL_SAFE_NO_PAD};
use hmac::{Hmac, Mac};
use serde_json::{Map, Value, json};
use sha2::{Sha256, Sha384, Sha512};

use super::{Algorithm, JwtError, SignOptions, Verification, token};

pub fn verify(input: &str, secret: &str) -> Result<Verification, JwtError> {
    let parsed = token::parse(input)?;
    let algorithm = Algorithm::from_header(&parsed.header)?;
    let signature = token::decode_signature(parsed.encoded_signature)?;
    let signing_input = format!("{}.{}", parsed.encoded_header, parsed.encoded_payload);

    verify_mac(
        algorithm,
        signing_input.as_bytes(),
        secret.as_bytes(),
        &signature,
    )?;
    Ok(Verification { algorithm })
}

pub fn sign(
    payload: &str,
    secret: &str,
    options: SignOptions,
    now: i64,
) -> Result<String, JwtError> {
    let mut payload = parse_payload(payload)?;
    if let Some(duration) = options.expires_in_seconds {
        if duration <= 0 {
            return Err(JwtError::InvalidExpirationDuration);
        }
        let expiration = now
            .checked_add(duration)
            .ok_or(JwtError::InvalidExpirationDuration)?;
        payload.insert("exp".to_string(), Value::from(expiration));
    }

    let header = json!({ "alg": options.algorithm.to_string(), "typ": "JWT" });
    let encoded_header = token::encode_json(&header)?;
    let encoded_payload = token::encode_json(&payload)?;
    let signing_input = format!("{encoded_header}.{encoded_payload}");
    let signature = sign_mac(
        options.algorithm,
        signing_input.as_bytes(),
        secret.as_bytes(),
    )?;

    Ok(format!(
        "{signing_input}.{}",
        BASE64_URL_SAFE_NO_PAD.encode(signature)
    ))
}

fn parse_payload(payload: &str) -> Result<Map<String, Value>, JwtError> {
    let value: Value =
        serde_json::from_str(payload).map_err(|_| JwtError::InvalidJson { segment: "payload" })?;
    value
        .as_object()
        .cloned()
        .ok_or(JwtError::ExpectedJsonObject { segment: "payload" })
}

fn sign_mac(algorithm: Algorithm, input: &[u8], secret: &[u8]) -> Result<Vec<u8>, JwtError> {
    let bytes = match algorithm {
        Algorithm::HS256 => {
            let mut mac = <Hmac<Sha256> as Mac>::new_from_slice(secret)
                .map_err(|error| JwtError::Serialization(error.to_string()))?;
            mac.update(input);
            mac.finalize().into_bytes().to_vec()
        }
        Algorithm::HS384 => {
            let mut mac = <Hmac<Sha384> as Mac>::new_from_slice(secret)
                .map_err(|error| JwtError::Serialization(error.to_string()))?;
            mac.update(input);
            mac.finalize().into_bytes().to_vec()
        }
        Algorithm::HS512 => {
            let mut mac = <Hmac<Sha512> as Mac>::new_from_slice(secret)
                .map_err(|error| JwtError::Serialization(error.to_string()))?;
            mac.update(input);
            mac.finalize().into_bytes().to_vec()
        }
    };
    Ok(bytes)
}

fn verify_mac(
    algorithm: Algorithm,
    input: &[u8],
    secret: &[u8],
    signature: &[u8],
) -> Result<(), JwtError> {
    let result = match algorithm {
        Algorithm::HS256 => {
            let mut mac = <Hmac<Sha256> as Mac>::new_from_slice(secret)
                .map_err(|error| JwtError::Serialization(error.to_string()))?;
            mac.update(input);
            mac.verify_slice(signature)
        }
        Algorithm::HS384 => {
            let mut mac = <Hmac<Sha384> as Mac>::new_from_slice(secret)
                .map_err(|error| JwtError::Serialization(error.to_string()))?;
            mac.update(input);
            mac.verify_slice(signature)
        }
        Algorithm::HS512 => {
            let mut mac = <Hmac<Sha512> as Mac>::new_from_slice(secret)
                .map_err(|error| JwtError::Serialization(error.to_string()))?;
            mac.update(input);
            mac.verify_slice(signature)
        }
    };
    result.map_err(|_| JwtError::SignatureMismatch)
}
