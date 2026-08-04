use base64::{Engine, prelude::BASE64_URL_SAFE_NO_PAD};
use serde_json::Value;
use strapd_core::jwt::{self, Algorithm, ExpirationStatus, JwtError, SignOptions, SignatureStatus};

const KNOWN_HS256_TOKEN: &str = concat!(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.",
    "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.",
    "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
);

#[test]
fn normalizes_supported_wrappers() {
    for input in [
        KNOWN_HS256_TOKEN.to_string(),
        format!("  {KNOWN_HS256_TOKEN}\n"),
        format!("Bearer {KNOWN_HS256_TOKEN}"),
        format!("authorization: bearer {KNOWN_HS256_TOKEN}"),
        format!("\"{KNOWN_HS256_TOKEN}\""),
    ] {
        assert!(jwt::decode(&input).is_ok(), "failed to decode {input}");
    }
}

#[test]
fn rejects_arbitrary_surrounding_text() {
    let error = jwt::decode(&format!("token={KNOWN_HS256_TOKEN}")).unwrap_err();
    assert!(matches!(error, JwtError::InvalidBase64Url { .. }));
}

#[test]
fn decodes_header_and_payload_without_analysis() {
    let output = jwt::decode_json(KNOWN_HS256_TOKEN, false).unwrap();
    let parsed: Value = serde_json::from_str(&output).unwrap();
    assert_eq!(parsed["header"]["alg"], "HS256");
    assert_eq!(parsed["payload"]["sub"], "1234567890");
    assert!(parsed.get("analysis").is_none());
}

#[test]
fn extracts_clean_header_and_payload_json() {
    let header: Value =
        serde_json::from_str(&jwt::header_json(KNOWN_HS256_TOKEN).unwrap()).unwrap();
    let payload: Value =
        serde_json::from_str(&jwt::payload_json(KNOWN_HS256_TOKEN).unwrap()).unwrap();
    assert_eq!(header["typ"], "JWT");
    assert_eq!(payload["name"], "John Doe");
}

#[test]
fn accepts_compatible_padded_segments() {
    let token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ==.signature";
    let decoded = jwt::decode(token).unwrap();
    assert_eq!(decoded.payload["sub"], "123");
}

#[test]
fn reports_segment_specific_decode_errors() {
    assert!(matches!(
        jwt::decode("one.two"),
        Err(JwtError::InvalidStructure { segments: 2 })
    ));
    assert!(matches!(
        jwt::decode("***.e30.signature"),
        Err(JwtError::InvalidBase64Url { segment: "header" })
    ));
    assert!(matches!(
        jwt::decode("_w.e30.signature"),
        Err(JwtError::InvalidUtf8 { segment: "header" })
    ));
    assert!(matches!(
        jwt::decode("bm90LWpzb24.e30.signature"),
        Err(JwtError::InvalidJson { segment: "header" })
    ));
    assert!(matches!(
        jwt::decode("W10.e30.signature"),
        Err(JwtError::ExpectedJsonObject { segment: "header" })
    ));
}

#[test]
fn analyzes_active_expired_missing_and_invalid_expiration() {
    let active = jwt::sign_at(
        r#"{"sub":"active","exp":2000}"#,
        "secret",
        SignOptions::default(),
        1000,
    )
    .unwrap();
    let analysis = jwt::decode_with_analysis_at(&active, 1000)
        .unwrap()
        .analysis;
    assert_eq!(analysis.expiration.status, ExpirationStatus::Active);
    assert_eq!(analysis.expiration.seconds_remaining, Some(1000));
    assert_eq!(analysis.signature.status, SignatureStatus::Unverified);

    let expired = jwt::decode_with_analysis_at(&active, 2000).unwrap();
    assert_eq!(
        expired.analysis.expiration.status,
        ExpirationStatus::Expired
    );
    assert_eq!(expired.analysis.expiration.seconds_remaining, Some(0));

    let missing =
        jwt::sign_at(r#"{"sub":"none"}"#, "secret", SignOptions::default(), 1000).unwrap();
    assert_eq!(
        jwt::decode_with_analysis_at(&missing, 1000)
            .unwrap()
            .analysis
            .expiration
            .status,
        ExpirationStatus::NotPresent
    );

    let invalid = jwt::sign_at(
        r#"{"exp":"tomorrow"}"#,
        "secret",
        SignOptions::default(),
        1000,
    )
    .unwrap();
    assert_eq!(
        jwt::decode_with_analysis_at(&invalid, 1000)
            .unwrap()
            .analysis
            .expiration
            .status,
        ExpirationStatus::Invalid
    );
}

#[test]
fn verifies_known_hs256_vector() {
    let verification = jwt::verify(KNOWN_HS256_TOKEN, "your-256-bit-secret").unwrap();
    assert_eq!(verification.algorithm, Algorithm::HS256);
}

#[test]
fn signs_and_verifies_every_supported_algorithm() {
    for algorithm in [Algorithm::HS256, Algorithm::HS384, Algorithm::HS512] {
        let token = jwt::sign_at(
            r#"{"sub":"usr_123","role":"admin"}"#,
            "secret",
            SignOptions {
                algorithm,
                expires_in_seconds: None,
            },
            1000,
        )
        .unwrap();
        assert_eq!(jwt::verify(&token, "secret").unwrap().algorithm, algorithm);
        assert!(matches!(
            jwt::verify(&token, "wrong-secret"),
            Err(JwtError::SignatureMismatch)
        ));
    }
}

#[test]
fn rejects_missing_none_and_unsupported_algorithms() {
    let missing = jwt::sign_at(r#"{"sub":"123"}"#, "secret", SignOptions::default(), 1000)
        .unwrap()
        .replacen("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "e30", 1);
    assert!(matches!(
        jwt::verify(&missing, "secret"),
        Err(JwtError::MissingAlgorithm)
    ));

    for header in [r#"{"alg":"none"}"#, r#"{"alg":"RS256"}"#] {
        let encoded = BASE64_URL_SAFE_NO_PAD.encode(header.as_bytes());
        let token = format!("{encoded}.e30.");
        assert!(matches!(
            jwt::verify(&token, "secret"),
            Err(JwtError::UnsupportedAlgorithm(_))
        ));
    }
}

#[test]
fn relative_expiration_replaces_exp_without_touching_iat() {
    let token = jwt::sign_at(
        r#"{"sub":"123","iat":500,"exp":600}"#,
        "secret",
        SignOptions {
            algorithm: Algorithm::HS256,
            expires_in_seconds: Some(3600),
        },
        1000,
    )
    .unwrap();
    let decoded = jwt::decode(&token).unwrap();
    assert_eq!(decoded.payload["iat"], 500);
    assert_eq!(decoded.payload["exp"], 4600);
}

#[test]
fn rejects_invalid_signing_inputs_and_tampering() {
    assert!(matches!(
        jwt::sign_at("[]", "secret", SignOptions::default(), 1000),
        Err(JwtError::ExpectedJsonObject { segment: "payload" })
    ));
    assert!(matches!(
        jwt::sign_at(
            "{}",
            "secret",
            SignOptions {
                algorithm: Algorithm::HS256,
                expires_in_seconds: Some(0),
            },
            1000
        ),
        Err(JwtError::InvalidExpirationDuration)
    ));

    let token = jwt::sign_at("{}", "secret", SignOptions::default(), 1000).unwrap();
    let tampered = token.replacen("e30", "eyJzdWIiOiJ0YW1wZXJlZCJ9", 1);
    assert!(matches!(
        jwt::verify(&tampered, "secret"),
        Err(JwtError::SignatureMismatch)
    ));
}
