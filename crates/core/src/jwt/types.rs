use std::{fmt, str::FromStr};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use super::JwtError;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum Algorithm {
    #[default]
    HS256,
    HS384,
    HS512,
}

impl Algorithm {
    pub(crate) fn from_header(header: &Map<String, Value>) -> Result<Self, JwtError> {
        let value = header
            .get("alg")
            .and_then(Value::as_str)
            .ok_or(JwtError::MissingAlgorithm)?;
        value.parse()
    }
}

impl fmt::Display for Algorithm {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::HS256 => "HS256",
            Self::HS384 => "HS384",
            Self::HS512 => "HS512",
        })
    }
}

impl FromStr for Algorithm {
    type Err = JwtError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.to_ascii_uppercase().as_str() {
            "HS256" => Ok(Self::HS256),
            "HS384" => Ok(Self::HS384),
            "HS512" => Ok(Self::HS512),
            _ => Err(JwtError::UnsupportedAlgorithm(value.to_string())),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DecodedJwt {
    pub header: Map<String, Value>,
    pub payload: Map<String, Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AnalyzedJwt {
    pub header: Map<String, Value>,
    pub payload: Map<String, Value>,
    pub analysis: JwtAnalysis,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct JwtAnalysis {
    pub expiration: ExpirationAnalysis,
    pub signature: SignatureAnalysis,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExpirationAnalysis {
    pub status: ExpirationStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seconds_remaining: Option<i64>,
}

impl ExpirationAnalysis {
    pub(crate) const fn not_present() -> Self {
        Self {
            status: ExpirationStatus::NotPresent,
            expires_at: None,
            seconds_remaining: None,
        }
    }

    pub(crate) const fn invalid() -> Self {
        Self {
            status: ExpirationStatus::Invalid,
            expires_at: None,
            seconds_remaining: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExpirationStatus {
    Active,
    Expired,
    NotPresent,
    Invalid,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SignatureAnalysis {
    pub status: SignatureStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SignatureStatus {
    Unverified,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Verification {
    pub algorithm: Algorithm,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SignOptions {
    pub algorithm: Algorithm,
    pub expires_in_seconds: Option<i64>,
}

impl Default for SignOptions {
    fn default() -> Self {
        Self {
            algorithm: Algorithm::HS256,
            expires_in_seconds: None,
        }
    }
}
