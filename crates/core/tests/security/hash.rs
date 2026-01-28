use strapd_core::security::hash;

// MD5 Tests
#[test]
fn test_md5_known_value_hello() {
    assert_eq!(hash::md5("hello"), "5d41402abc4b2a76b9719d911017c592");
}

#[test]
fn test_md5_known_value_empty() {
    assert_eq!(hash::md5(""), "d41d8cd98f00b204e9800998ecf8427e");
}

#[test]
fn test_md5_known_value_test() {
    assert_eq!(hash::md5("test"), "098f6bcd4621d373cade4e832627b4f6");
}

#[test]
fn test_md5_unicode() {
    let result = hash::md5("Hello 世界");
    assert_eq!(result.len(), 32); // MD5 = 32 hex chars
    assert!(!result.is_empty());
}

#[test]
fn test_md5_special_characters() {
    let result = hash::md5("!@#$%^&*()_+-=[]{}|;':\",./<>?");
    assert_eq!(result.len(), 32);
    assert!(!result.is_empty());
}

#[test]
fn test_md5_long_input() {
    let input = "a".repeat(10000);
    let result = hash::md5(&input);
    assert_eq!(result.len(), 32);
}

#[test]
fn test_md5_newlines() {
    let result = hash::md5("line1\nline2\nline3");
    assert_eq!(result.len(), 32);
}

// SHA1 Tests
#[test]
fn test_sha1_known_value_hello() {
    assert_eq!(
        hash::sha1("hello"),
        "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d"
    );
}

#[test]
fn test_sha1_known_value_empty() {
    assert_eq!(hash::sha1(""), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
}

#[test]
fn test_sha1_known_value_test() {
    assert_eq!(
        hash::sha1("test"),
        "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3"
    );
}

#[test]
fn test_sha1_unicode() {
    let result = hash::sha1("Hello 世界");
    assert_eq!(result.len(), 40); // SHA1 = 40 hex chars
}

#[test]
fn test_sha1_special_characters() {
    let result = hash::sha1("!@#$%^&*()_+-=[]{}|;':\",./<>?");
    assert_eq!(result.len(), 40);
    assert!(!result.is_empty());
}

#[test]
fn test_sha1_long_input() {
    let input = "a".repeat(10000);
    let result = hash::sha1(&input);
    assert_eq!(result.len(), 40);
}

#[test]
fn test_sha1_newlines() {
    let result = hash::sha1("line1\nline2\nline3");
    assert_eq!(result.len(), 40);
}

// SHA256 Tests
#[test]
fn test_sha256_known_value_hello() {
    assert_eq!(
        hash::sha256("hello"),
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
}

#[test]
fn test_sha256_known_value_empty() {
    assert_eq!(
        hash::sha256(""),
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
}

#[test]
fn test_sha256_known_value_test() {
    assert_eq!(
        hash::sha256("test"),
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    );
}

#[test]
fn test_sha256_unicode() {
    let result = hash::sha256("Hello 世界");
    assert_eq!(result.len(), 64); // SHA256 = 64 hex chars
}

#[test]
fn test_sha256_special_characters() {
    let result = hash::sha256("!@#$%^&*()_+-=[]{}|;':\",./<>?");
    assert_eq!(result.len(), 64);
    assert!(!result.is_empty());
}

#[test]
fn test_sha256_long_input() {
    let input = "a".repeat(10000);
    let result = hash::sha256(&input);
    assert_eq!(result.len(), 64);
}

#[test]
fn test_sha256_newlines() {
    let result = hash::sha256("line1\nline2\nline3");
    assert_eq!(result.len(), 64);
}

#[test]
fn test_sha256_tabs() {
    let result = hash::sha256("col1\tcol2\tcol3");
    assert_eq!(result.len(), 64);
}

// SHA512 Tests
#[test]
fn test_sha512_known_value_hello() {
    assert_eq!(
        hash::sha512("hello"),
        "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043"
    );
}

#[test]
fn test_sha512_known_value_empty() {
    assert_eq!(
        hash::sha512(""),
        "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
    );
}

#[test]
fn test_sha512_known_value_test() {
    assert_eq!(
        hash::sha512("test"),
        "ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff"
    );
}

#[test]
fn test_sha512_unicode() {
    let result = hash::sha512("Hello 世界");
    assert_eq!(result.len(), 128); // SHA512 = 128 hex chars
}

#[test]
fn test_sha512_special_characters() {
    let result = hash::sha512("!@#$%^&*()_+-=[]{}|;':\",./<>?");
    assert_eq!(result.len(), 128);
    assert!(!result.is_empty());
}

#[test]
fn test_sha512_long_input() {
    let input = "a".repeat(10000);
    let result = hash::sha512(&input);
    assert_eq!(result.len(), 128);
}

#[test]
fn test_sha512_newlines() {
    let result = hash::sha512("line1\nline2\nline3");
    assert_eq!(result.len(), 128);
}

// Consistency Tests
#[test]
fn test_hash_consistency_same_input_same_output() {
    let input = "consistent_input";
    assert_eq!(hash::md5(input), hash::md5(input));
    assert_eq!(hash::sha1(input), hash::sha1(input));
    assert_eq!(hash::sha256(input), hash::sha256(input));
    assert_eq!(hash::sha512(input), hash::sha512(input));
}

#[test]
fn test_hash_different_algorithms_different_outputs() {
    let input = "test";
    let md5_result = hash::md5(input);
    let sha1_result = hash::sha1(input);
    let sha256_result = hash::sha256(input);
    let sha512_result = hash::sha512(input);

    assert_ne!(md5_result, sha1_result);
    assert_ne!(md5_result, sha256_result);
    assert_ne!(md5_result, sha512_result);
    assert_ne!(sha1_result, sha256_result);
    assert_ne!(sha1_result, sha512_result);
    assert_ne!(sha256_result, sha512_result);
}

#[test]
fn test_hash_different_inputs_different_outputs() {
    assert_ne!(hash::md5("input1"), hash::md5("input2"));
    assert_ne!(hash::sha1("input1"), hash::sha1("input2"));
    assert_ne!(hash::sha256("input1"), hash::sha256("input2"));
    assert_ne!(hash::sha512("input1"), hash::sha512("input2"));
}

// Output Format Tests
#[test]
fn test_hash_outputs_lowercase_hex() {
    let result = hash::md5("test");
    assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
    assert!(result.chars().all(|c| !c.is_uppercase()));
}

#[test]
fn test_all_hash_outputs_lowercase_hex() {
    let input = "TEST";
    let results = vec![
        hash::md5(input),
        hash::sha1(input),
        hash::sha256(input),
        hash::sha512(input),
    ];

    for result in results {
        assert!(result.chars().all(|c| c.is_ascii_hexdigit()));
        assert!(result.chars().all(|c| !c.is_uppercase()));
    }
}
