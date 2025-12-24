use strapd_core::random;

#[test]
fn test_generate_contains_all_types() {
    let result = random::string(1, 20, true, true, true, true, None).unwrap();
    let s = &result[0];

    assert_eq!(s.len(), 20);
    assert!(
        s.chars().any(|c| c.is_lowercase()),
        "Should contain lowercase"
    );
    assert!(
        s.chars().any(|c| c.is_uppercase()),
        "Should contain uppercase"
    );
    assert!(s.chars().any(|c| c.is_numeric()), "Should contain digits");
    assert!(
        s.chars().any(|c| "!@#$%^&*-_=+".contains(c)),
        "Should contain symbols"
    );
}

#[test]
fn test_generate_minimum_length() {
    // Should fail if length is less than number of required charsets
    let result = random::string(1, 2, true, true, true, true, None);
    assert!(result.is_err());

    // Should succeed with exact minimum length
    let result = random::string(1, 4, true, true, true, true, None);
    assert!(result.is_ok());
}

#[test]
fn test_generate_only_lowercase_and_digits() {
    let result = random::string(1, 10, true, false, true, false, None).unwrap();
    let s = &result[0];

    assert_eq!(s.len(), 10);
    assert!(s.chars().any(|c| c.is_lowercase()));
    assert!(s.chars().any(|c| c.is_numeric()));
    assert!(!s.chars().any(|c| c.is_uppercase()));
    assert!(!s.chars().any(|c| "!@#$%^&*-_=+".contains(c)));
}

#[test]
fn test_no_flags_error() {
    let result = random::string(1, 10, false, false, false, false, None);
    assert!(result.is_err());
}

#[test]
fn test_custom_only_charset() {
    let result = random::string(1, 10, false, false, false, false, Some("abc")).unwrap();
    let s = &result[0];
    assert_eq!(s.len(), 10);
    assert!(
        s.chars()
            .all(|c| ["a", "b", "c"].contains(&c.to_string().as_str()))
    );
}

#[test]
fn test_custom_union_with_uppercase_overlap() {
    // Custom "ABC" overlaps entirely with uppercase; union should be just uppercase letters
    let result = random::string(1, 10, false, true, false, false, Some("ABC")).unwrap();
    let s = &result[0];
    assert_eq!(s.len(), 10);
    assert!(s.chars().all(|c| c.is_uppercase()));
    assert!(!s.chars().any(|c| c.is_lowercase()));
    assert!(!s.chars().any(|c| c.is_numeric()));
    assert!(!s.chars().any(|c| "!@#$%^&*-_=+".contains(c)));
}

#[test]
fn test_custom_union_with_uppercase_and_symbols() {
    // Uppercase plus custom symbols should produce only uppercase letters and the provided symbols
    let result = random::string(1, 20, false, true, false, false, Some("!@")).unwrap();
    let s = &result[0];
    assert_eq!(s.len(), 20);
    assert!(
        s.chars()
            .all(|c| c.is_uppercase() || ["!", "@"].contains(&c.to_string().as_str()))
    );
}

#[test]
fn test_length_constraint_with_custom() {
    // Three charsets selected (lowercase, uppercase, custom) => min length 3
    let too_short = random::string(1, 2, true, true, false, false, Some("xyz"));
    assert!(too_short.is_err());

    let ok = random::string(1, 3, true, true, false, false, Some("xyz"));
    assert!(ok.is_ok());
}

#[test]
fn test_empty_custom_charset_is_ignored() {
    // Empty custom charset should be treated as None
    let with_empty = random::string(1, 10, false, true, false, false, Some(""));
    let without_custom = random::string(1, 10, false, true, false, false, None);

    assert!(with_empty.is_ok());
    assert!(without_custom.is_ok());

    let s1 = &with_empty.unwrap()[0];
    let s2 = &without_custom.unwrap()[0];

    assert_eq!(s1.len(), 10);
    assert_eq!(s2.len(), 10);
    assert!(s1.chars().all(|c| c.is_uppercase()));
    assert!(s2.chars().all(|c| c.is_uppercase()));
}

#[test]
fn test_generate_multiple_count() {
    let count = 5usize;
    let length = 12u8;
    let out = random::string(count, length, true, true, true, false, None).unwrap();
    assert_eq!(out.len(), count);
    for s in out.iter() {
        assert_eq!(s.len(), length as usize);
        assert!(s.chars().any(|c| c.is_lowercase()));
        assert!(s.chars().any(|c| c.is_uppercase()));
        assert!(s.chars().any(|c| c.is_numeric()));
        assert!(!s.chars().any(|c| "!@#$%^&*-_=+".contains(c)));
    }
}
