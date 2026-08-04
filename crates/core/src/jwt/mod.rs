mod crypto;
mod error;
mod token;
mod types;

use chrono::Utc;

pub use error::JwtError;
pub use token::normalize;
pub use types::{
    Algorithm, AnalyzedJwt, DecodedJwt, ExpirationAnalysis, ExpirationStatus, JwtAnalysis,
    SignOptions, SignatureAnalysis, SignatureStatus, Verification,
};

pub fn decode(input: &str) -> Result<DecodedJwt, JwtError> {
    token::parse(input).map(token::decoded)
}

pub fn decode_with_analysis(input: &str) -> Result<AnalyzedJwt, JwtError> {
    decode_with_analysis_at(input, Utc::now().timestamp())
}

pub fn decode_with_analysis_at(input: &str, now: i64) -> Result<AnalyzedJwt, JwtError> {
    token::parse(input).map(|parsed| token::analyzed(parsed, now))
}

pub fn decode_json(input: &str, include_analysis: bool) -> Result<String, JwtError> {
    if include_analysis {
        token::to_pretty_json(&decode_with_analysis(input)?)
    } else {
        token::to_pretty_json(&decode(input)?)
    }
}

pub fn decode_json_at(input: &str, include_analysis: bool, now: i64) -> Result<String, JwtError> {
    if include_analysis {
        token::to_pretty_json(&decode_with_analysis_at(input, now)?)
    } else {
        token::to_pretty_json(&decode(input)?)
    }
}

pub fn header_json(input: &str) -> Result<String, JwtError> {
    token::to_pretty_json(&decode(input)?.header)
}

pub fn payload_json(input: &str) -> Result<String, JwtError> {
    token::to_pretty_json(&decode(input)?.payload)
}

pub fn verify(input: &str, secret: &str) -> Result<Verification, JwtError> {
    crypto::verify(input, secret)
}

pub fn sign(payload: &str, secret: &str, options: SignOptions) -> Result<String, JwtError> {
    sign_at(payload, secret, options, Utc::now().timestamp())
}

pub fn sign_at(
    payload: &str,
    secret: &str,
    options: SignOptions,
    now: i64,
) -> Result<String, JwtError> {
    crypto::sign(payload, secret, options, now)
}
