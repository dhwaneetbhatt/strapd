use strapd_core::encoding::hex;

// Basic Encoding Tests
#[test]
fn test_encode_empty() {
    let input = vec![];
    assert_eq!(hex::encode(&input), "");
}

#[test]
fn test_encode_hello() {
    let input = b"hello".to_vec();
    assert_eq!(hex::encode(&input), "68656c6c6f");
}

#[test]
fn test_encode_single_byte() {
    let input = vec![0x41]; // 'A'
    assert_eq!(hex::encode(&input), "41");
}

#[test]
fn test_encode_numbers() {
    let input = b"123".to_vec();
    assert_eq!(hex::encode(&input), "313233");
}

#[test]
fn test_encode_special_chars() {
    let input = b"!@#".to_vec();
    assert_eq!(hex::encode(&input), "214023");
}

#[test]
fn test_encode_unicode_bytes() {
    let input = "Hello 世界".as_bytes().to_vec();
    let encoded = hex::encode(&input);
    assert!(!encoded.is_empty());
    assert!(encoded.chars().all(|c| c.is_ascii_hexdigit()));
}

#[test]
fn test_encode_binary_data() {
    let input: Vec<u8> = vec![0x00, 0x10, 0xFF, 0xAB];
    assert_eq!(hex::encode(&input), "0010ffab");
}

#[test]
fn test_encode_all_zeros() {
    let input = vec![0u8; 5];
    assert_eq!(hex::encode(&input), "0000000000");
}

#[test]
fn test_encode_all_ones() {
    let input = vec![255u8; 3];
    assert_eq!(hex::encode(&input), "ffffff");
}

#[test]
fn test_encode_long_input() {
    let input = vec![0x42; 1000];
    let result = hex::encode(&input);
    assert_eq!(result.len(), 2000);
}

// Basic Decoding Tests
#[test]
fn test_decode_empty() {
    let result = hex::decode("");
    assert!(result.is_ok());
    let empty_vec: Vec<u8> = vec![];
    assert_eq!(result.unwrap(), empty_vec);
}

#[test]
fn test_decode_hello() {
    let result = hex::decode("68656c6c6f");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"hello".to_vec());
}

#[test]
fn test_decode_uppercase() {
    let result = hex::decode("48454C4C4F");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"HELLO".to_vec());
}

#[test]
fn test_decode_mixed_case() {
    let result = hex::decode("48656c6C6f");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"Hello".to_vec());
}

#[test]
fn test_decode_numbers() {
    let result = hex::decode("313233");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), b"123".to_vec());
}

#[test]
fn test_decode_binary_data() {
    let result = hex::decode("0010ffab");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), vec![0x00, 0x10, 0xFF, 0xAB]);
}

#[test]
fn test_decode_all_zeros() {
    let result = hex::decode("0000000000");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), vec![0u8; 5]);
}

#[test]
fn test_decode_all_ones() {
    let result = hex::decode("ffffff");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), vec![255u8; 3]);
}

// Roundtrip Tests
#[test]
fn test_roundtrip_simple() {
    let original = b"test data".to_vec();
    let encoded = hex::encode(&original);
    let decoded = hex::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_empty() {
    let original = vec![];
    let encoded = hex::encode(&original);
    let decoded = hex::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_unicode() {
    let original = "Hello 世界 🚀".as_bytes().to_vec();
    let encoded = hex::encode(&original);
    let decoded = hex::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_special_chars() {
    let original = b"!@#$%^&*()_+-=[]{}|;':\",./<>?".to_vec();
    let encoded = hex::encode(&original);
    let decoded = hex::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_binary_full_range() {
    let original: Vec<u8> = (0u8..=255u8).collect();
    let encoded = hex::encode(&original);
    let decoded = hex::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_long_input() {
    let original = vec![b'X'; 10000];
    let encoded = hex::encode(&original);
    let decoded = hex::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

// Error Handling Tests
#[test]
fn test_decode_invalid_chars() {
    let result = hex::decode("invalid@hex!");
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Invalid hex input");
}

#[test]
fn test_decode_odd_length() {
    let result = hex::decode("abc");
    assert!(result.is_err());
}

#[test]
fn test_decode_invalid_hex_g() {
    let result = hex::decode("gg");
    assert!(result.is_err());
}

#[test]
fn test_decode_invalid_hex_z() {
    let result = hex::decode("zz");
    assert!(result.is_err());
}

#[test]
fn test_decode_spaces() {
    let result = hex::decode("48 65");
    assert!(result.is_err());
}

// Output Format Tests
#[test]
fn test_encode_outputs_lowercase() {
    let input = vec![0xFF, 0xAB, 0xCD];
    let result = hex::encode(&input);
    assert_eq!(result, "ffabcd");
    assert!(result.chars().all(|c| !c.is_uppercase()));
}

#[test]
fn test_encode_outputs_valid_hex() {
    let input = b"test".to_vec();
    let result = hex::encode(&input);
    assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
}

#[test]
fn test_encode_length_double() {
    let input = vec![0x12, 0x34, 0x56];
    let result = hex::encode(&input);
    assert_eq!(result.len(), input.len() * 2);
}

// Edge Cases
#[test]
fn test_roundtrip_newlines() {
    let original = b"line1\nline2\r\nline3".to_vec();
    let encoded = hex::encode(&original);
    let decoded = hex::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_null_bytes() {
    let original = vec![0x00, 0x01, 0x00, 0x02];
    let encoded = hex::encode(&original);
    let decoded = hex::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}
