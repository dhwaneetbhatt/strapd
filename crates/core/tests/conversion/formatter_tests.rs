use strapd_core::conversion::{ConversionResult, format_output};

#[test]
fn test_format_default() {
    let results = vec![ConversionResult {
        input_value: 10.0,
        input_unit: "km".to_string(),
        output_value: 6.21371,
        output_unit: "mi".to_string(),
    }];
    let output = format_output(&results, None).unwrap();
    assert_eq!(output, "6.21371 mi");
}

#[test]
fn test_format_precision_2() {
    let results = vec![ConversionResult {
        input_value: 10.0,
        input_unit: "km".to_string(),
        output_value: 6.21371,
        output_unit: "mi".to_string(),
    }];
    let output = format_output(&results, Some(2)).unwrap();
    assert_eq!(output, "6.21 mi");
}

#[test]
fn test_format_precision_0() {
    let results = vec![ConversionResult {
        input_value: 10.0,
        input_unit: "km".to_string(),
        output_value: 6.21371,
        output_unit: "mi".to_string(),
    }];
    let output = format_output(&results, Some(0)).unwrap();
    assert_eq!(output, "6 mi");
}

#[test]
fn test_format_precision_validation() {
    let results = vec![ConversionResult {
        input_value: 10.0,
        input_unit: "km".to_string(),
        output_value: 6.21371,
        output_unit: "mi".to_string(),
    }];
    let result = format_output(&results, Some(15));
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Precision must be between 0 and 10");
}
