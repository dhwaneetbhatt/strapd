use strapd_core::conversion::engine::convert;
use strapd_core::conversion::types::ConversionRequest;

#[test]
fn test_convert_cross_category_error() {
    let request = ConversionRequest {
        value: 10.0,
        from_unit: "km".to_string(),
        to_unit: Some("seconds".to_string()),
    };
    let result = convert(&request);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Cannot convert"));
}

#[test]
fn test_convert_missing_target_error() {
    let request = ConversionRequest {
        value: 10.0,
        from_unit: "km".to_string(),
        to_unit: None,
    };
    let result = convert(&request);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Target unit required"));
}

#[test]
fn test_convert_unknown_unit_error() {
    let request = ConversionRequest {
        value: 10.0,
        from_unit: "foo".to_string(),
        to_unit: Some("bar".to_string()),
    };
    let result = convert(&request);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Unknown"));
}
