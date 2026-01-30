use strapd_core::encoding::base64;

// Basic Encoding Tests
#[test]
fn test_encode_empty() {
    let input = vec![];
    assert_eq!(base64::encode(&input), "");
}

#[test]
fn test_encode_hello() {
    let input = b"hello".to_vec();
    assert_eq!(base64::encode(&input), "aGVsbG8=");
}

#[test]
fn test_encode_single_char() {
    let input = b"a".to_vec();
    assert_eq!(base64::encode(&input), "YQ==");
}

#[test]
fn test_encode_two_chars() {
    let input = b"ab".to_vec();
    assert_eq!(base64::encode(&input), "YWI=");
}

#[test]
fn test_encode_three_chars() {
    let input = b"abc".to_vec();
    assert_eq!(base64::encode(&input), "YWJj");
}

#[test]
fn test_encode_numbers() {
    let input = b"1234567890".to_vec();
    assert_eq!(base64::encode(&input), "MTIzNDU2Nzg5MA==");
}

#[test]
fn test_encode_special_chars() {
    let input = b"!@#$%^&*()".to_vec();
    assert_eq!(base64::encode(&input), "IUAjJCVeJiooKQ==");
}

#[test]
fn test_encode_unicode_bytes() {
    let input = "Hello 世界".as_bytes().to_vec();
    let encoded = base64::encode(&input);
    assert!(!encoded.is_empty());
}

#[test]
fn test_encode_newlines() {
    let input = b"line1\nline2\nline3".to_vec();
    assert_eq!(base64::encode(&input), "bGluZTEKbGluZTIKbGluZTM=");
}

#[test]
fn test_encode_long_input() {
    let input = vec![b'a'; 1000];
    let result = base64::encode(&input);
    assert!(!result.is_empty());
}

// Basic Decoding Tests
#[test]
fn test_decode_empty() {
    let result = base64::decode("");
    assert!(result.is_ok());
    let empty_vec: Vec<u8> = vec![];
    assert_eq!(result.unwrap(), empty_vec);
}

#[test]
fn test_decode_hello() {
    let result = base64::decode("aGVsbG8=");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"hello".to_vec());
}

#[test]
fn test_decode_single_char() {
    let result = base64::decode("YQ==");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"a".to_vec());
}

#[test]
fn test_decode_numbers() {
    let result = base64::decode("MTIzNDU2Nzg5MA==");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"1234567890".to_vec());
}

#[test]
fn test_decode_special_chars() {
    let result = base64::decode("IUAjJCVeJiooKQ==");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"!@#$%^&*()".to_vec());
}

#[test]
fn test_decode_without_padding() {
    let result = base64::decode("YWJj");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"abc".to_vec());
}

// Roundtrip Tests
#[test]
fn test_roundtrip_simple() {
    let original = b"test data".to_vec();
    let encoded = base64::encode(&original);
    let decoded = base64::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_empty() {
    let original = vec![];
    let encoded = base64::encode(&original);
    let decoded = base64::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_unicode() {
    let original = "Hello 世界 🚀".as_bytes().to_vec();
    let encoded = base64::encode(&original);
    let decoded = base64::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_special_chars() {
    let original = b"!@#$%^&*()_+-=[]{}|;':\",./<>?".to_vec();
    let encoded = base64::encode(&original);
    let decoded = base64::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_binary_data() {
    let original: Vec<u8> = (0u8..=255u8).collect();
    let encoded = base64::encode(&original);
    let decoded = base64::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_long_input() {
    let original = vec![b'X'; 10000];
    let encoded = base64::encode(&original);
    let decoded = base64::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

// Error Handling Tests
#[test]
fn test_decode_invalid_chars() {
    let result = base64::decode("invalid@base64!");
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Invalid base64 input");
}

#[test]
fn test_decode_invalid_length() {
    let result = base64::decode("YQ");
    assert!(result.is_err());
}

#[test]
fn test_decode_invalid_padding() {
    let result = base64::decode("YQ=");
    assert!(result.is_err());
}

#[test]
fn test_decode_only_padding() {
    let result = base64::decode("====");
    assert!(result.is_err());
}

// Edge Cases
#[test]
fn test_encode_all_zeros() {
    let input = vec![0u8; 10];
    let result = base64::encode(&input);
    assert_eq!(result, "AAAAAAAAAAAAAA==");
}

#[test]
fn test_encode_all_ones() {
    let input = vec![255u8; 10];
    let result = base64::encode(&input);
    // Just verify it encodes successfully
    assert!(!result.is_empty());
    assert!(result.len() > 10);
}

#[test]
fn test_roundtrip_newlines() {
    let original = b"line1\nline2\r\nline3".to_vec();
    let encoded = base64::encode(&original);
    let decoded = base64::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}
