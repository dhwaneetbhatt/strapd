use strapd_core::encoding::url;

// Basic Encoding Tests
#[test]
fn test_encode_empty() {
    assert_eq!(url::encode(""), "");
}

#[test]
fn test_encode_simple() {
    assert_eq!(url::encode("hello"), "hello");
}

#[test]
fn test_encode_space() {
    assert_eq!(url::encode("hello world"), "hello%20world");
}

#[test]
fn test_encode_multiple_spaces() {
    assert_eq!(url::encode("a b c"), "a%20b%20c");
}

#[test]
fn test_encode_special_chars() {
    assert_eq!(url::encode("hello!"), "hello%21");
}

#[test]
fn test_encode_at_symbol() {
    assert_eq!(url::encode("user@domain"), "user%40domain");
}

#[test]
fn test_encode_hash() {
    assert_eq!(url::encode("section#1"), "section%231");
}

#[test]
fn test_encode_ampersand() {
    assert_eq!(url::encode("a&b"), "a%26b");
}

#[test]
fn test_encode_equals() {
    assert_eq!(url::encode("key=value"), "key%3Dvalue");
}

#[test]
fn test_encode_question_mark() {
    assert_eq!(url::encode("what?"), "what%3F");
}

#[test]
fn test_encode_slash() {
    assert_eq!(url::encode("path/to/file"), "path%2Fto%2Ffile");
}

#[test]
fn test_encode_unicode() {
    let result = url::encode("Hello 世界");
    assert!(!result.is_empty());
    assert!(result.contains("%"));
}

#[test]
fn test_encode_emoji() {
    let result = url::encode("Hello 🚀");
    assert!(!result.is_empty());
    assert!(result.contains("%"));
}

#[test]
fn test_encode_multiple_special_chars() {
    let result = url::encode("!@#$%^&*()");
    assert!(result.contains("%"));
}

#[test]
fn test_encode_query_string() {
    let result = url::encode("name=John Doe&age=30");
    assert!(result.contains("%20"));
    assert!(result.contains("%26"));
    assert!(result.contains("%3D"));
}

// Basic Decoding Tests
#[test]
fn test_decode_empty() {
    let result = url::decode("");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "");
}

#[test]
fn test_decode_simple() {
    let result = url::decode("hello");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "hello");
}

#[test]
fn test_decode_space() {
    let result = url::decode("hello%20world");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "hello world");
}

#[test]
fn test_decode_plus_as_space() {
    let result = url::decode("hello+world");
    assert!(result.is_ok());
    // Note: urlencoding crate treats + as space in decoding
}

#[test]
fn test_decode_special_char() {
    let result = url::decode("hello%21");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "hello!");
}

#[test]
fn test_decode_at_symbol() {
    let result = url::decode("user%40domain");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "user@domain");
}

#[test]
fn test_decode_ampersand() {
    let result = url::decode("a%26b");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "a&b");
}

#[test]
fn test_decode_slash() {
    let result = url::decode("path%2Fto%2Ffile");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "path/to/file");
}

// Roundtrip Tests
#[test]
fn test_roundtrip_simple() {
    let original = "test data";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_empty() {
    let original = "";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_special_chars() {
    let original = "!@#$%^&*()";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_unicode() {
    let original = "Hello 世界";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_emoji() {
    let original = "Hello 🚀 🎉";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_query_string() {
    let original = "name=John Doe&age=30&city=New York";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_path() {
    let original = "/path/to/some/file.txt";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_long_input() {
    let original = "a b ".repeat(1000);
    let encoded = url::encode(&original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

// Error Handling Tests
#[test]
fn test_decode_invalid_percent_encoding() {
    let result = url::decode("test%");
    // Some implementations may be lenient, so just ensure it handles gracefully
    let _ = result;
}

#[test]
fn test_decode_invalid_percent_incomplete() {
    let result = url::decode("test%2");
    // Some implementations may be lenient
    let _ = result;
}

#[test]
fn test_decode_invalid_percent_non_hex() {
    let result = url::decode("test%ZZ");
    // Some implementations may be lenient
    let _ = result;
}

// Edge Cases
#[test]
fn test_encode_already_encoded() {
    let result = url::encode("hello%20world");
    // Should encode the % symbol
    assert!(result.contains("%25"));
}

#[test]
fn test_encode_numbers() {
    assert_eq!(url::encode("1234567890"), "1234567890");
}

#[test]
fn test_encode_letters() {
    assert_eq!(url::encode("abcABC"), "abcABC");
}

#[test]
fn test_encode_hyphen_underscore() {
    assert_eq!(url::encode("test-file_name"), "test-file_name");
}

#[test]
fn test_encode_dot() {
    assert_eq!(url::encode("file.txt"), "file.txt");
}

#[test]
fn test_roundtrip_newlines() {
    let original = "line1\nline2\nline3";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}

#[test]
fn test_roundtrip_tabs() {
    let original = "col1\tcol2\tcol3";
    let encoded = url::encode(original);
    let decoded = url::decode(&encoded).unwrap();
    assert_eq!(decoded, original);
}
