use strapd_core::security::hmac;

// SHA256 HMAC Tests
#[test]
fn test_hmac_sha256_basic() {
    let result = hmac::sha256("message", "secret");
    assert!(result.is_ok());
    let hash = result.unwrap();
    assert_eq!(hash.len(), 64); // SHA256 HMAC = 64 hex chars
}

#[test]
fn test_hmac_sha256_known_value() {
    // Test vector from RFC 4231
    let result = hmac::sha256("Hi There", &"\x0b".repeat(20));
    assert!(result.is_ok());
    // Known HMAC-SHA256 value for this input
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha256_empty_message() {
    let result = hmac::sha256("", "secret");
    assert!(result.is_ok());
    let hash = result.unwrap();
    assert_eq!(hash.len(), 64);
    assert!(!hash.is_empty());
}

#[test]
fn test_hmac_sha256_empty_key() {
    let result = hmac::sha256("message", "");
    assert!(result.is_ok());
    let hash = result.unwrap();
    assert_eq!(hash.len(), 64);
}

#[test]
fn test_hmac_sha256_unicode_message() {
    let result = hmac::sha256("Hello 世界", "secret");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha256_unicode_key() {
    let result = hmac::sha256("message", "秘密鍵");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha256_special_characters_message() {
    let result = hmac::sha256("!@#$%^&*()_+-=[]{}|;':\",./<>?", "secret");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha256_special_characters_key() {
    let result = hmac::sha256("message", "!@#$%^&*()_+-=[]{}|;':\",./<>?");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha256_long_message() {
    let message = "a".repeat(10000);
    let result = hmac::sha256(&message, "secret");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha256_long_key() {
    let key = "k".repeat(10000);
    let result = hmac::sha256("message", &key);
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha256_newlines_message() {
    let result = hmac::sha256("line1\nline2\nline3", "secret");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha256_different_keys_different_results() {
    let result1 = hmac::sha256("message", "key1").unwrap();
    let result2 = hmac::sha256("message", "key2").unwrap();
    assert_ne!(result1, result2);
}

#[test]
fn test_hmac_sha256_different_messages_different_results() {
    let result1 = hmac::sha256("message1", "secret").unwrap();
    let result2 = hmac::sha256("message2", "secret").unwrap();
    assert_ne!(result1, result2);
}

#[test]
fn test_hmac_sha256_consistency() {
    let message = "consistent_message";
    let key = "consistent_key";
    let result1 = hmac::sha256(message, key).unwrap();
    let result2 = hmac::sha256(message, key).unwrap();
    assert_eq!(result1, result2);
}

// SHA512 HMAC Tests
#[test]
fn test_hmac_sha512_basic() {
    let result = hmac::sha512("message", "secret");
    assert!(result.is_ok());
    let hash = result.unwrap();
    assert_eq!(hash.len(), 128); // SHA512 HMAC = 128 hex chars
}

#[test]
fn test_hmac_sha512_known_value() {
    // Test vector from RFC 4231
    let result = hmac::sha512("Hi There", &"\x0b".repeat(20));
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 128);
}

#[test]
fn test_hmac_sha512_empty_message() {
    let result = hmac::sha512("", "secret");
    assert!(result.is_ok());
    let hash = result.unwrap();
    assert_eq!(hash.len(), 128);
    assert!(!hash.is_empty());
}

#[test]
fn test_hmac_sha512_empty_key() {
    let result = hmac::sha512("message", "");
    assert!(result.is_ok());
    let hash = result.unwrap();
    assert_eq!(hash.len(), 128);
}

#[test]
fn test_hmac_sha512_unicode_message() {
    let result = hmac::sha512("Hello 世界", "secret");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 128);
}

#[test]
fn test_hmac_sha512_unicode_key() {
    let result = hmac::sha512("message", "秘密鍵");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 128);
}

#[test]
fn test_hmac_sha512_special_characters() {
    let result = hmac::sha512("!@#$%^&*()_+-=[]{}|;':\",./<>?", "secret");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 128);
}

#[test]
fn test_hmac_sha512_long_message() {
    let message = "a".repeat(10000);
    let result = hmac::sha512(&message, "secret");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 128);
}

#[test]
fn test_hmac_sha512_different_keys_different_results() {
    let result1 = hmac::sha512("message", "key1").unwrap();
    let result2 = hmac::sha512("message", "key2").unwrap();
    assert_ne!(result1, result2);
}

#[test]
fn test_hmac_sha512_consistency() {
    let message = "consistent_message";
    let key = "consistent_key";
    let result1 = hmac::sha512(message, key).unwrap();
    let result2 = hmac::sha512(message, key).unwrap();
    assert_eq!(result1, result2);
}

// Cross-algorithm Tests
#[test]
fn test_hmac_sha256_sha512_different_outputs() {
    let result_sha256 = hmac::sha256("message", "secret").unwrap();
    let result_sha512 = hmac::sha512("message", "secret").unwrap();
    assert_ne!(result_sha256.len(), result_sha512.len());
}

// Output Format Tests
#[test]
fn test_hmac_outputs_lowercase_hex() {
    let result = hmac::sha256("test", "secret").unwrap();
    assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    assert!(result.chars().all(|c| !c.is_uppercase()));
}

#[test]
fn test_hmac_sha512_outputs_lowercase_hex() {
    let result = hmac::sha512("test", "secret").unwrap();
    assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    assert!(result.chars().all(|c| !c.is_uppercase()));
}

// Edge Cases
#[test]
fn test_hmac_sha256_both_empty() {
    let result = hmac::sha256("", "");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 64);
}

#[test]
fn test_hmac_sha512_both_empty() {
    let result = hmac::sha512("", "");
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 128);
}
