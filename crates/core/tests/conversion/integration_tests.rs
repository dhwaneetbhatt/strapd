use strapd_core::conversion::engine::{convert, convert_to_all};
use strapd_core::conversion::types::ConversionRequest;

// ============================================================================
// Convert to All Tests
// ============================================================================

#[test]
fn test_convert_to_all() {
    let results = convert_to_all(10.0, "km").unwrap();
    assert!(results.len() > 1);

    // Check that we have conversions to other length units
    let has_miles = results.iter().any(|r| r.output_unit == "mi");
    let has_meters = results.iter().any(|r| r.output_unit == "m");
    assert!(has_miles);
    assert!(has_meters);
}

#[test]
fn test_convert_to_all_temperature() {
    let results = convert_to_all(0.0, "c").unwrap();
    assert!(results.len() >= 2);

    // Check conversions to F and K
    let f_result = results.iter().find(|r| r.output_unit == "f");
    let k_result = results.iter().find(|r| r.output_unit == "k");

    assert!(f_result.is_some());
    assert!(k_result.is_some());

    // Verify values
    assert!((f_result.unwrap().output_value - 32.0).abs() < 0.01);
    assert!((k_result.unwrap().output_value - 273.15).abs() < 0.01);
}

// ============================================================================
// Edge Cases
// ============================================================================

#[test]
fn test_convert_zero() {
    let request = ConversionRequest {
        value: 0.0,
        from_unit: "km".to_string(),
        to_unit: Some("mi".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 0.0).abs() < 0.0001);
}

#[test]
fn test_convert_very_large_number() {
    let request = ConversionRequest {
        value: 1000000.0,
        from_unit: "km".to_string(),
        to_unit: Some("m".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1_000_000_000.0).abs() < 1000.0);
}

#[test]
fn test_convert_very_small_number() {
    let request = ConversionRequest {
        value: 0.001,
        from_unit: "km".to_string(),
        to_unit: Some("m".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1.0).abs() < 0.0001);
}
