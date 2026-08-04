use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JwtError {
    EmptyInput,
    InvalidStructure { segments: usize },
    InvalidBase64Url { segment: &'static str },
    InvalidUtf8 { segment: &'static str },
    InvalidJson { segment: &'static str },
    ExpectedJsonObject { segment: &'static str },
    MissingAlgorithm,
    UnsupportedAlgorithm(String),
    SignatureMismatch,
    InvalidExpirationDuration,
    Serialization(String),
}

impl fmt::Display for JwtError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyInput => formatter.write_str("No JWT input provided"),
            Self::InvalidStructure { segments } => write!(
                formatter,
                "Invalid JWT structure: expected 3 segments, found {segments}"
            ),
            Self::InvalidBase64Url { segment } => {
                write!(
                    formatter,
                    "Invalid Base64URL encoding in JWT {segment} segment"
                )
            }
            Self::InvalidUtf8 { segment } => {
                write!(formatter, "JWT {segment} segment is not valid UTF-8")
            }
            Self::InvalidJson { segment } => {
                write!(formatter, "JWT {segment} segment is not valid JSON")
            }
            Self::ExpectedJsonObject { segment } => {
                write!(formatter, "JWT {segment} must be a JSON object")
            }
            Self::MissingAlgorithm => formatter.write_str("JWT header is missing the alg field"),
            Self::UnsupportedAlgorithm(algorithm) => write!(
                formatter,
                "Unsupported JWT algorithm {algorithm}; supported algorithms are HS256, HS384, and HS512"
            ),
            Self::SignatureMismatch => {
                formatter.write_str("Signature verification failed: secret key mismatch")
            }
            Self::InvalidExpirationDuration => {
                formatter.write_str("Expiration duration must be greater than zero")
            }
            Self::Serialization(message) => write!(formatter, "Failed to serialize JWT: {message}"),
        }
    }
}

impl std::error::Error for JwtError {}
