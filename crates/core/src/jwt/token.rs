use base64::{Engine, engine::general_purpose::URL_SAFE, prelude::BASE64_URL_SAFE_NO_PAD};
use chrono::{DateTime, SecondsFormat, Utc};
use serde::Serialize;
use serde_json::{Map, Value};

use super::{
    AnalyzedJwt, DecodedJwt, ExpirationAnalysis, ExpirationStatus, JwtAnalysis, JwtError,
    SignatureAnalysis, SignatureStatus,
};

pub(crate) struct ParsedJwt<'a> {
    pub encoded_header: &'a str,
    pub encoded_payload: &'a str,
    pub encoded_signature: &'a str,
    pub header: Map<String, Value>,
    pub payload: Map<String, Value>,
}

pub fn normalize(input: &str) -> Result<&str, JwtError> {
    let mut normalized = input.trim();
    if normalized.is_empty() {
        return Err(JwtError::EmptyInput);
    }

    normalized = strip_matching_quotes(normalized);
    normalized = strip_ascii_prefix(normalized, "Authorization:").unwrap_or(normalized);
    normalized = normalized.trim();
    normalized = strip_ascii_prefix(normalized, "Bearer").unwrap_or(normalized);
    normalized = normalized.trim();

    if normalized.is_empty() {
        return Err(JwtError::EmptyInput);
    }
    Ok(normalized)
}

pub(crate) fn parse(input: &str) -> Result<ParsedJwt<'_>, JwtError> {
    let normalized = normalize(input)?;
    let segment_count = normalized.split('.').count();
    if segment_count != 3 {
        return Err(JwtError::InvalidStructure {
            segments: segment_count,
        });
    }

    let mut segments = normalized.split('.');
    let encoded_header = segments.next().unwrap_or_default();
    let encoded_payload = segments.next().unwrap_or_default();
    let encoded_signature = segments.next().unwrap_or_default();
    if encoded_header.is_empty() || encoded_payload.is_empty() {
        return Err(JwtError::InvalidStructure {
            segments: segment_count,
        });
    }

    Ok(ParsedJwt {
        encoded_header,
        encoded_payload,
        encoded_signature,
        header: decode_object(encoded_header, "header")?,
        payload: decode_object(encoded_payload, "payload")?,
    })
}

pub(crate) fn decode_signature(encoded: &str) -> Result<Vec<u8>, JwtError> {
    decode_base64url(encoded, "signature")
}

pub(crate) fn encode_json<T: Serialize>(value: &T) -> Result<String, JwtError> {
    serde_json::to_vec(value)
        .map(|bytes| BASE64_URL_SAFE_NO_PAD.encode(bytes))
        .map_err(|error| JwtError::Serialization(error.to_string()))
}

pub(crate) fn to_pretty_json<T: Serialize>(value: &T) -> Result<String, JwtError> {
    serde_json::to_string_pretty(value).map_err(|error| JwtError::Serialization(error.to_string()))
}

pub(crate) fn decoded(parsed: ParsedJwt<'_>) -> DecodedJwt {
    DecodedJwt {
        header: parsed.header,
        payload: parsed.payload,
    }
}

pub(crate) fn analyzed(parsed: ParsedJwt<'_>, now: i64) -> AnalyzedJwt {
    let expiration = analyze_expiration(parsed.payload.get("exp"), now);
    AnalyzedJwt {
        header: parsed.header,
        payload: parsed.payload,
        analysis: JwtAnalysis {
            expiration,
            signature: SignatureAnalysis {
                status: SignatureStatus::Unverified,
            },
        },
    }
}

fn strip_matching_quotes(input: &str) -> &str {
    let bytes = input.as_bytes();
    if bytes.len() >= 2 && matches!(bytes[0], b'\'' | b'"') && bytes.last() == bytes.first() {
        &input[1..input.len() - 1]
    } else {
        input
    }
}

fn strip_ascii_prefix<'a>(input: &'a str, prefix: &str) -> Option<&'a str> {
    let candidate = input.get(..prefix.len())?;
    candidate
        .eq_ignore_ascii_case(prefix)
        .then(|| &input[prefix.len()..])
}

fn decode_object(encoded: &str, segment: &'static str) -> Result<Map<String, Value>, JwtError> {
    let bytes = decode_base64url(encoded, segment)?;
    let text = std::str::from_utf8(&bytes).map_err(|_| JwtError::InvalidUtf8 { segment })?;
    let value: Value = serde_json::from_str(text).map_err(|_| JwtError::InvalidJson { segment })?;
    value
        .as_object()
        .cloned()
        .ok_or(JwtError::ExpectedJsonObject { segment })
}

fn decode_base64url(encoded: &str, segment: &'static str) -> Result<Vec<u8>, JwtError> {
    BASE64_URL_SAFE_NO_PAD
        .decode(encoded)
        .or_else(|_| URL_SAFE.decode(encoded))
        .map_err(|_| JwtError::InvalidBase64Url { segment })
}

fn analyze_expiration(expiration: Option<&Value>, now: i64) -> ExpirationAnalysis {
    let Some(expiration) = expiration else {
        return ExpirationAnalysis::not_present();
    };
    let Some(expiration) = expiration.as_f64().filter(|value| value.is_finite()) else {
        return ExpirationAnalysis::invalid();
    };
    let Some(expires_at) = numeric_date(expiration) else {
        return ExpirationAnalysis::invalid();
    };
    let remaining = expiration - now as f64;
    if remaining < i64::MIN as f64 || remaining > i64::MAX as f64 {
        return ExpirationAnalysis::invalid();
    }

    ExpirationAnalysis {
        status: if remaining > 0.0 {
            ExpirationStatus::Active
        } else {
            ExpirationStatus::Expired
        },
        expires_at: Some(expires_at.to_rfc3339_opts(SecondsFormat::AutoSi, true)),
        seconds_remaining: Some(remaining.trunc() as i64),
    }
}

fn numeric_date(value: f64) -> Option<DateTime<Utc>> {
    let whole_seconds = value.floor();
    if whole_seconds < i64::MIN as f64 || whole_seconds > i64::MAX as f64 {
        return None;
    }
    let nanos = ((value - whole_seconds) * 1_000_000_000.0).round() as u32;
    DateTime::from_timestamp(whole_seconds as i64, nanos)
}
