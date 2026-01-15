use strapd_core::conversion::{ConversionResult, format_output};

#[test]
fn test_format_default() {
    let results = vec![ConversionResult {
        input_value: 10.0,
        input_unit: "km".to_string(),
        output_value: 6.21371,
        output_unit: "mi".to_string(),
    }];
    let output = format_output(&results, false, None);
    assert_eq!(output, "6.21371 mi");
}

#[test]
fn test_format_explain() {
    let results = vec![ConversionResult {
        input_value: 10.0,
        input_unit: "km".to_string(),
        output_value: 6.21371,
        output_unit: "mi".to_string(),
    }];
    let output = format_output(&results, true, None);
    assert_eq!(output, "10 km = 6.21371 mi");
}

#[test]
fn test_format_precision_2() {
    let results = vec![ConversionResult {
        input_value: 10.0,
        input_unit: "km".to_string(),
        output_value: 6.21371,
        output_unit: "mi".to_string(),
    }];
    let output = format_output(&results, false, Some(2));
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
    let output = format_output(&results, false, Some(0));
    assert_eq!(output, "6 mi");
}
