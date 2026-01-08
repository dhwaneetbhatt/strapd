use strapd_core::calculator;

// ========== Basic Operations Tests ==========

#[test]
fn test_addition() {
    assert_eq!(calculator::evaluate("5+3"), Ok("8".to_string()));
}

#[test]
fn test_subtraction() {
    assert_eq!(calculator::evaluate("10-7"), Ok("3".to_string()));
}

#[test]
fn test_multiplication() {
    assert_eq!(calculator::evaluate("4*6"), Ok("24".to_string()));
}

#[test]
fn test_division_integer() {
    assert_eq!(calculator::evaluate("10/2"), Ok("5".to_string()));
}

#[test]
fn test_division_float() {
    let result = calculator::evaluate("10/3").unwrap();
    let float_result: f64 = result.parse().unwrap();
    assert!((float_result - 3.3333333333333335).abs() < 0.0001);
}

#[test]
fn test_modulo() {
    assert_eq!(calculator::evaluate("10%3"), Ok("1".to_string()));
}

#[test]
fn test_negative_number() {
    assert_eq!(calculator::evaluate("-5+3"), Ok("-2".to_string()));
}

#[test]
fn test_negative_number_subtraction() {
    assert_eq!(calculator::evaluate("-10-5"), Ok("-15".to_string()));
}

#[test]
fn test_multiple_additions() {
    assert_eq!(calculator::evaluate("1+2+3+4"), Ok("10".to_string()));
}

#[test]
fn test_multiple_subtractions() {
    assert_eq!(calculator::evaluate("20-5-3-2"), Ok("10".to_string()));
}

// ========== Exponentiation Tests ==========

#[test]
fn test_exponentiation_basic() {
    assert_eq!(calculator::evaluate("2^3"), Ok("8".to_string()));
}

#[test]
fn test_exponentiation_right_associative() {
    assert_eq!(calculator::evaluate("2^3^2"), Ok("512".to_string()));
}

#[test]
fn test_exponentiation_large() {
    assert_eq!(
        calculator::evaluate("10^15"),
        Ok("1000000000000000".to_string())
    );
}

#[test]
fn test_exponentiation_zero() {
    assert_eq!(calculator::evaluate("5^0"), Ok("1".to_string()));
}

#[test]
fn test_exponentiation_one() {
    assert_eq!(calculator::evaluate("5^1"), Ok("5".to_string()));
}

#[test]
fn test_exponentiation_negative_exponent() {
    let result = calculator::evaluate("2^-3").unwrap();
    let float_result: f64 = result.parse().unwrap();
    assert!((float_result - 0.125).abs() < 0.0001);
}

#[test]
fn test_exponentiation_negative_base_fractional_exponent() {
    // Test Int base with Float exponent (bug caught by Copilot)
    let result = calculator::evaluate("(-2)^2.5");
    assert!(result.is_err());
    assert!(
        result
            .unwrap_err()
            .contains("Complex numbers not supported")
    );

    // Test Float base with Float exponent
    let result = calculator::evaluate("(-2.0)^2.5");
    assert!(result.is_err());
    assert!(
        result
            .unwrap_err()
            .contains("Complex numbers not supported")
    );

    // But integer exponents should work fine
    assert_eq!(calculator::evaluate("(-2)^2"), Ok("4".to_string()));
    assert_eq!(calculator::evaluate("(-2)^3"), Ok("-8".to_string()));
}

// ========== Operator Precedence Tests ==========

#[test]
fn test_precedence_addition_multiplication() {
    assert_eq!(calculator::evaluate("5+2*3"), Ok("11".to_string()));
}

#[test]
fn test_precedence_multiplication_addition() {
    assert_eq!(calculator::evaluate("5*2+3"), Ok("13".to_string()));
}

#[test]
fn test_precedence_subtraction_multiplication() {
    assert_eq!(calculator::evaluate("10-2*3"), Ok("4".to_string()));
}

#[test]
fn test_precedence_exponentiation_multiplication() {
    assert_eq!(calculator::evaluate("2^3*4"), Ok("32".to_string()));
}

#[test]
fn test_precedence_multiplication_exponentiation() {
    assert_eq!(calculator::evaluate("2*3^2"), Ok("18".to_string()));
}

#[test]
fn test_precedence_division_addition() {
    assert_eq!(calculator::evaluate("10/2+3"), Ok("8".to_string()));
}

#[test]
fn test_precedence_modulo_addition() {
    assert_eq!(calculator::evaluate("10%3+2"), Ok("3".to_string()));
}

#[test]
fn test_precedence_complex() {
    assert_eq!(calculator::evaluate("2+3*4-5/5"), Ok("13".to_string()));
}

// ========== Parentheses Tests ==========

#[test]
fn test_parentheses_basic() {
    assert_eq!(calculator::evaluate("(5+2)*3"), Ok("21".to_string()));
}

#[test]
fn test_parentheses_reverse() {
    assert_eq!(calculator::evaluate("5*(2+3)"), Ok("25".to_string()));
}

#[test]
fn test_parentheses_nested_simple() {
    assert_eq!(calculator::evaluate("((5+2)*3)"), Ok("21".to_string()));
}

#[test]
fn test_parentheses_multiple_operations() {
    assert_eq!(calculator::evaluate("(10-2)*(3+4)"), Ok("56".to_string()));
}

#[test]
fn test_parentheses_deeply_nested() {
    assert_eq!(calculator::evaluate("((2+3)*(4+5))"), Ok("45".to_string()));
}

#[test]
fn test_parentheses_with_exponentiation() {
    assert_eq!(calculator::evaluate("(2+3)^2"), Ok("25".to_string()));
}

#[test]
fn test_parentheses_multiple_groups() {
    assert_eq!(
        calculator::evaluate("(2+3)*(4+5)+(6+7)"),
        Ok("58".to_string())
    );
}

// ========== Complex Expressions Tests ==========

#[test]
fn test_complex_original_example() {
    // 2^3 = 8, 77*222 = 17094, 17094/33 = 518 (exact division), 5+8+518 = 531
    assert_eq!(
        calculator::evaluate("5+2^3+77*222/33"),
        Ok("531".to_string())
    );
}

#[test]
fn test_complex_mixed_operations() {
    assert_eq!(
        calculator::evaluate("(5+2)^2*3-10/2"),
        Ok("142".to_string())
    );
}

#[test]
fn test_complex_large_numbers() {
    assert_eq!(
        calculator::evaluate("999999999999*2"),
        Ok("1999999999998".to_string())
    );
}

#[test]
fn test_complex_deep_nesting() {
    assert_eq!(
        calculator::evaluate("(((1+2)*3)+4)^2"),
        Ok("169".to_string())
    );
}

#[test]
fn test_complex_all_operators() {
    // 2^3=8, 4*5=20, 6/2=3, 3%2=1, so 8+20-1=27
    assert_eq!(calculator::evaluate("2^3+4*5-6/2%2"), Ok("27".to_string()));
}

// ========== Edge Cases & Error Tests ==========

#[test]
fn test_error_empty_expression() {
    assert!(calculator::evaluate("").is_err());
}

#[test]
fn test_error_whitespace_only() {
    assert!(calculator::evaluate("   ").is_err());
}

#[test]
fn test_error_division_by_zero() {
    let result = calculator::evaluate("5/0");
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Division by zero");
}

#[test]
fn test_error_modulo_by_zero() {
    let result = calculator::evaluate("5%0");
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Division by zero");
}

#[test]
fn test_error_invalid_character() {
    let result = calculator::evaluate("5&3");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Invalid character"));
}

#[test]
fn test_error_mismatched_parentheses_open() {
    let result = calculator::evaluate("(5+2");
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Mismatched parentheses");
}

#[test]
fn test_error_mismatched_parentheses_close() {
    let result = calculator::evaluate("5+2)");
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Mismatched parentheses");
}

#[test]
fn test_error_trailing_operator() {
    let result = calculator::evaluate("5+");
    assert!(result.is_err());
}

#[test]
fn test_error_only_operators() {
    let result = calculator::evaluate("+-*");
    assert!(result.is_err());
}

#[test]
fn test_spaces_in_expression() {
    assert_eq!(calculator::evaluate("5 + 2 * 3"), Ok("11".to_string()));
}

#[test]
fn test_tabs_in_expression() {
    assert_eq!(calculator::evaluate("5\t+\t2\t*\t3"), Ok("11".to_string()));
}

#[test]
fn test_decimal_input() {
    let result = calculator::evaluate("5.5 + 2.3").unwrap();
    let float_result: f64 = result.parse().unwrap();
    assert!((float_result - 7.8).abs() < 0.0001);
}

#[test]
fn test_decimal_multiplication() {
    let result = calculator::evaluate("2.5 * 4").unwrap();
    let float_result: f64 = result.parse().unwrap();
    assert!((float_result - 10.0).abs() < 0.0001);
}

#[test]
fn test_very_large_numbers() {
    let result = calculator::evaluate("99999999999999999999*2");
    assert!(result.is_ok());
}

#[test]
fn test_error_multiple_decimal_points() {
    let result = calculator::evaluate("5.5.5 + 2");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("multiple decimal points"));
}

// ========== Number Type Handling Tests ==========

#[test]
fn test_integer_result_stays_integer() {
    let result = calculator::evaluate("10+5").unwrap();
    assert_eq!(result, "15");
    assert!(!result.contains('.'));
}

#[test]
fn test_float_result_shows_decimals() {
    let result = calculator::evaluate("10/3").unwrap();
    assert!(result.contains('.'));
}

#[test]
fn test_mixed_operations_int_result() {
    let result = calculator::evaluate("5*2+10/2").unwrap();
    assert_eq!(result, "15");
    assert!(!result.contains('.'));
}

#[test]
fn test_mixed_operations_float_result() {
    let result = calculator::evaluate("5.5 + 2").unwrap();
    let float_result: f64 = result.parse().unwrap();
    assert!((float_result - 7.5).abs() < 0.0001);
}

#[test]
fn test_integer_division_with_remainder_becomes_float() {
    let result = calculator::evaluate("7/2").unwrap();
    assert!(result.contains('.'));
    let float_result: f64 = result.parse().unwrap();
    assert!((float_result - 3.5).abs() < 0.0001);
}

#[test]
fn test_negative_integer_stays_integer() {
    let result = calculator::evaluate("-10+5").unwrap();
    assert_eq!(result, "-5");
    assert!(!result.contains('.'));
}

// ========== Additional Edge Cases ==========

#[test]
fn test_leading_zeros() {
    assert_eq!(calculator::evaluate("007+003"), Ok("10".to_string()));
}

#[test]
fn test_parentheses_around_single_number() {
    assert_eq!(calculator::evaluate("(5)"), Ok("5".to_string()));
}

#[test]
fn test_multiple_parentheses_levels() {
    assert_eq!(calculator::evaluate("((((5))))"), Ok("5".to_string()));
}

#[test]
fn test_negative_in_parentheses() {
    assert_eq!(calculator::evaluate("(-5+3)*2"), Ok("-4".to_string()));
}

#[test]
fn test_zero_operations() {
    assert_eq!(calculator::evaluate("0+0"), Ok("0".to_string()));
    assert_eq!(calculator::evaluate("0*5"), Ok("0".to_string()));
    assert_eq!(calculator::evaluate("5-5"), Ok("0".to_string()));
}
