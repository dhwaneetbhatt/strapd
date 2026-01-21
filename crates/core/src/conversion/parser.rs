//! Parser for unit conversion expressions.
//!
//! Supports multiple input formats:
//! - With separator: "10 km to mi", "10 km in mi"
//! - Without separator: "10 km mi", "10km mi"
//! - Concatenated: "10km", "1.5mb"
//!
//! **Limitations**:
//! - Scientific notation in concatenated format is not supported (e.g., "1e6km" will fail)
//! - Use whitespace-separated format for scientific notation (e.g., "1e6 km" works)

use super::types::{ConversionRequest, find_unit};

pub fn parse_input(expression: &str) -> Result<ConversionRequest, String> {
    let expr = expression.trim();
    if expr.is_empty() {
        return Err("Empty expression".to_string());
    }

    // Tokenize by whitespace
    let tokens: Vec<&str> = expr.split_whitespace().collect();
    if tokens.is_empty() {
        return Err("Empty expression".to_string());
    }

    // Find separator keyword ("to" or "in")
    let separator_pos = tokens
        .iter()
        .position(|&t| t.eq_ignore_ascii_case("to") || t.eq_ignore_ascii_case("in"));

    let (value_from_tokens, to_tokens) = match separator_pos {
        Some(pos) => {
            // Split at separator: ["10", "km"] "to" ["mi"]
            let left = &tokens[..pos];
            let right = &tokens[pos + 1..];
            (left, right)
        }
        None => {
            // No separator: try to parse all tokens as value+unit first
            // If that succeeds, there's no target unit
            // Otherwise, assume last token is target unit
            match parse_value_and_unit(&tokens) {
                Ok((value, from_unit)) => {
                    // Successfully parsed all tokens as value+unit, no target
                    return Ok(ConversionRequest {
                        value,
                        from_unit,
                        to_unit: None,
                    });
                }
                Err(_) if tokens.len() >= 2 => {
                    // Multiple tokens, assume last is target: "10 km mi" or "10km mi"
                    let left = &tokens[..tokens.len() - 1];
                    let right = &tokens[tokens.len() - 1..];
                    (left, right)
                }
                Err(_) => {
                    // Not enough tokens and can't parse as value+unit
                    return Err(
                        "Invalid expression. Expected format: '10 km to mi', '10 km mi', or '10km'"
                            .to_string(),
                    );
                }
            }
        }
    };

    // Parse value and from_unit from left side
    let (value, from_unit) = parse_value_and_unit(value_from_tokens)?;

    // Parse to_unit from right side
    let to_unit = if to_tokens.is_empty() {
        None
    } else {
        // Optimization: Most units are single tokens, avoid join() when possible
        let unit_str = if to_tokens.len() == 1 {
            to_tokens[0].trim().to_string()
        } else {
            to_tokens.join(" ").trim().to_string()
        };

        // Validate unit exists
        if find_unit(&unit_str).is_none() {
            return Err(format!(
                "Unknown target unit: '{}'. Please check unit spelling.",
                unit_str
            ));
        }

        Some(unit_str)
    };

    Ok(ConversionRequest {
        value,
        from_unit,
        to_unit,
    })
}

fn parse_value_and_unit(tokens: &[&str]) -> Result<(f64, String), String> {
    if tokens.is_empty() {
        return Err("Missing value and unit".to_string());
    }

    // Case 1: Single token like "10km" - value and unit concatenated
    if tokens.len() == 1 {
        return parse_concatenated_value_unit(tokens[0]);
    }

    // Case 2: Multiple tokens like "10 km" or "-5.5 celsius"
    // First token should be numeric value
    let value_str = tokens[0];
    let value = value_str
        .parse::<f64>()
        .map_err(|_| format!("Invalid numeric value: '{}'", value_str))?;

    // Remaining tokens form the unit
    // Optimization: Most units are single tokens, avoid join() when possible
    let unit_tokens = &tokens[1..];
    let unit_str = if unit_tokens.len() == 1 {
        unit_tokens[0].trim().to_string()
    } else {
        unit_tokens.join(" ").trim().to_string()
    };

    // Validate unit exists (find_unit handles case sensitivity for data rate)
    if find_unit(&unit_str).is_none() {
        return Err(format!(
            "Unknown unit: '{}'. Please check unit spelling.",
            unit_str
        ));
    }

    Ok((value, unit_str))
}

fn parse_concatenated_value_unit(token: &str) -> Result<(f64, String), String> {
    // Find where the numeric part ends
    let mut value_end = 0;
    let chars: Vec<char> = token.chars().collect();

    // Handle optional negative sign
    if chars.first() == Some(&'-') || chars.first() == Some(&'+') {
        value_end = 1;
    }

    // Find end of numeric part (including decimal point)
    let mut found_dot = false;
    while value_end < chars.len() {
        let c = chars[value_end];
        if c.is_ascii_digit() {
            value_end += 1;
        } else if c == '.' && !found_dot {
            found_dot = true;
            value_end += 1;
        } else {
            break;
        }
    }

    if value_end == 0 || (value_end == 1 && (chars[0] == '-' || chars[0] == '+')) {
        return Err(format!(
            "Cannot parse value from '{}'. Expected format: '10km' or '10 km'",
            token
        ));
    }

    let value_str = &token[..value_end];
    let unit_str = &token[value_end..];

    if unit_str.is_empty() {
        return Err(format!(
            "Missing unit in '{}'. Expected format: '10km'",
            token
        ));
    }

    let value = value_str
        .parse::<f64>()
        .map_err(|_| format!("Invalid numeric value: '{}'", value_str))?;

    let trimmed_unit = unit_str.trim().to_string();

    // Validate unit exists (find_unit handles case sensitivity for data rate)
    if find_unit(&trimmed_unit).is_none() {
        return Err(format!(
            "Unknown unit: '{}'. Please check unit spelling.",
            unit_str
        ));
    }

    Ok((value, trimmed_unit))
}
