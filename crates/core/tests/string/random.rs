use strapd_core::string::random;

#[test]
fn test_generate_contains_all_types() {
    let result = random::generate(20, true, true, true, true).unwrap();

    assert_eq!(result.len(), 20);
    assert!(
        result.chars().any(|c| c.is_lowercase()),
        "Should contain lowercase"
    );
    assert!(
        result.chars().any(|c| c.is_uppercase()),
        "Should contain uppercase"
    );
    assert!(
        result.chars().any(|c| c.is_numeric()),
        "Should contain digits"
    );
    assert!(
        result.chars().any(|c| "!@#$%^&*-_=+".contains(c)),
        "Should contain symbols"
    );
}

#[test]
fn test_generate_minimum_length() {
    // Should fail if length is less than number of required charsets
    let result = random::generate(2, true, true, true, true);
    assert!(result.is_err());

    // Should succeed with exact minimum length
    let result = random::generate(4, true, true, true, true);
    assert!(result.is_ok());
}

#[test]
fn test_generate_only_lowercase_and_digits() {
    let result = random::generate(10, true, false, true, false).unwrap();

    assert_eq!(result.len(), 10);
    assert!(result.chars().any(|c| c.is_lowercase()));
    assert!(result.chars().any(|c| c.is_numeric()));
    assert!(!result.chars().any(|c| c.is_uppercase()));
    assert!(!result.chars().any(|c| "!@#$%^&*-_=+".contains(c)));
}

#[test]
fn test_no_flags_error() {
    let result = random::generate(10, false, false, false, false);
    assert!(result.is_err());
}
