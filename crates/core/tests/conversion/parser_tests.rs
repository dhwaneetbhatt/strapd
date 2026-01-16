use strapd_core::conversion::parser::parse_input;

#[test]
fn test_parse_with_to_keyword() {
    let result = parse_input("10 km to mi").unwrap();
    assert_eq!(result.value, 10.0);
    assert_eq!(result.from_unit, "km");
    assert_eq!(result.to_unit, Some("mi".to_string()));
}

#[test]
fn test_parse_without_to_keyword() {
    let result = parse_input("10 km mi").unwrap();
    assert_eq!(result.value, 10.0);
    assert_eq!(result.from_unit, "km");
    assert_eq!(result.to_unit, Some("mi".to_string()));
}

#[test]
fn test_parse_concatenated() {
    let result = parse_input("10km to mi").unwrap();
    assert_eq!(result.value, 10.0);
    assert_eq!(result.from_unit, "km");
    assert_eq!(result.to_unit, Some("mi".to_string()));
}

#[test]
fn test_parse_case_insensitive() {
    let result = parse_input("10 KB TO MB").unwrap();
    assert_eq!(result.value, 10.0);
    assert_eq!(result.from_unit, "KB"); // Case preserved for output
    assert_eq!(result.to_unit, Some("MB".to_string())); // Case preserved for output
}

#[test]
fn test_parse_decimal_value() {
    let result = parse_input("1.5 gb to mb").unwrap();
    assert_eq!(result.value, 1.5);
}

#[test]
fn test_parse_negative_value() {
    let result = parse_input("-10 c to f").unwrap();
    assert_eq!(result.value, -10.0);
}

#[test]
fn test_parse_invalid_value_error() {
    let result = parse_input("abc km to mi");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Invalid numeric value"));
}
