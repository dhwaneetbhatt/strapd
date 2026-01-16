use super::types::ConversionResult;

pub fn format_output(
    results: &[ConversionResult],
    precision: Option<usize>,
) -> Result<String, String> {
    if results.is_empty() {
        return Ok(String::new());
    }

    // Validate precision
    if let Some(p) = precision
        && p > 10
    {
        return Err("Precision must be between 0 and 10".to_string());
    }

    // Pre-allocate capacity to avoid reallocations
    let mut lines = Vec::with_capacity(results.len());

    for result in results {
        let formatted_value = format_value(result.output_value, precision);
        let line = format!("{} {}", formatted_value, result.output_unit);
        lines.push(line);
    }

    Ok(lines.join("\n"))
}

fn format_value(value: f64, precision: Option<usize>) -> String {
    match precision {
        Some(p) => format!("{:.prec$}", value, prec = p),
        None => {
            // Auto-detect precision
            // If value is very close to integer, show as integer
            if (value.round() - value).abs() < 0.0001 {
                format!("{}", value.round() as i64)
            } else {
                // Show up to 6 significant decimals, trim trailing zeros
                let formatted = format!("{:.6}", value);
                formatted
                    .trim_end_matches('0')
                    .trim_end_matches('.')
                    .to_string()
            }
        }
    }
}
