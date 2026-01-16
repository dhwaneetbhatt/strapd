use super::types::{
    ConversionRequest, ConversionResult, UnitCategory, find_unit, get_units_in_category,
};
use crate::calculator;

pub fn convert(request: &ConversionRequest) -> Result<ConversionResult, String> {
    let to_unit = request
        .to_unit
        .as_ref()
        .ok_or_else(|| "Target unit required. Use --all to see all conversions.".to_string())?;

    // Look up units in registry
    let from = find_unit(&request.from_unit).ok_or_else(|| {
        format!(
            "Unknown source unit: '{}'. Please check unit spelling.",
            request.from_unit
        )
    })?;

    let to = find_unit(to_unit).ok_or_else(|| {
        format!(
            "Unknown target unit: '{}'. Please check unit spelling.",
            to_unit
        )
    })?;

    // Verify same category
    if from.category != to.category {
        return Err(format!(
            "Cannot convert '{}' ({:?}) to '{}' ({:?}). Units must be in the same category.",
            request.from_unit, from.category, to_unit, to.category
        ));
    }

    // Perform conversion based on category
    let output_value = match from.category {
        UnitCategory::Temperature => {
            convert_temperature(request.value, &request.from_unit, to_unit)?
        }
        _ => convert_linear(request.value, from, to)?,
    };

    Ok(ConversionResult {
        input_value: request.value,
        input_unit: request.from_unit.clone(),
        output_value,
        output_unit: to_unit.clone(),
    })
}

pub fn convert_to_all(value: f64, from_unit: &str) -> Result<Vec<ConversionResult>, String> {
    let from = find_unit(from_unit).ok_or_else(|| {
        format!(
            "Unknown source unit: '{}'. Please check unit spelling.",
            from_unit
        )
    })?;

    let units_in_category = get_units_in_category(from.category);
    let mut results = Vec::new();

    for to_unit in units_in_category {
        // Skip converting to the same unit
        if to_unit.canonical_name == from.canonical_name {
            continue;
        }

        let request = ConversionRequest {
            value,
            from_unit: from_unit.to_string(),
            to_unit: Some(to_unit.canonical_name.to_string()),
        };

        match convert(&request) {
            Ok(result) => results.push(result),
            Err(_) => continue, // Skip units that fail conversion
        }
    }

    if results.is_empty() {
        return Err(format!(
            "No other units found in the same category as '{}'",
            from_unit
        ));
    }

    Ok(results)
}

// Linear conversion: (value * from_multiplier) / to_multiplier
// Uses calculator API for all mathematical operations
fn convert_linear(
    value: f64,
    from: &super::types::Unit,
    to: &super::types::Unit,
) -> Result<f64, String> {
    let from_multiplier = from.to_base_multiplier.ok_or_else(|| {
        format!(
            "Unit '{}' cannot be converted linearly",
            from.canonical_name
        )
    })?;

    let to_multiplier = to
        .to_base_multiplier
        .ok_or_else(|| format!("Unit '{}' cannot be converted linearly", to.canonical_name))?;

    // Single-step conversion: (value * from_multiplier) / to_multiplier
    let expr = format!("({} * {}) / {}", value, from_multiplier, to_multiplier);
    let result_str = calculator::evaluate(&expr).map_err(|e| format!("Calculator error: {}", e))?;
    let result: f64 = result_str
        .parse()
        .map_err(|_| format!("Failed to parse result: {}", result_str))?;

    Ok(result)
}

fn convert_temperature(value: f64, from: &str, to: &str) -> Result<f64, String> {
    let from_normalized = from.trim().to_lowercase();
    let to_normalized = to.trim().to_lowercase();

    // Remove degree symbols if present
    let from_unit = from_normalized.replace("°", "");
    let to_unit = to_normalized.replace("°", "");

    let result_str = match (from_unit.as_str(), to_unit.as_str()) {
        // Celsius conversions
        ("c" | "celsius", "f" | "fahrenheit") => {
            calculator::evaluate(&format!("({} * 9 / 5) + 32", value))?
        }
        ("c" | "celsius", "k" | "kelvin") => calculator::evaluate(&format!("{} + 273.15", value))?,

        // Fahrenheit conversions
        ("f" | "fahrenheit", "c" | "celsius") => {
            calculator::evaluate(&format!("({} - 32) * 5 / 9", value))?
        }
        ("f" | "fahrenheit", "k" | "kelvin") => {
            calculator::evaluate(&format!("(({} - 32) * 5 / 9) + 273.15", value))?
        }

        // Kelvin conversions
        ("k" | "kelvin", "c" | "celsius") => calculator::evaluate(&format!("{} - 273.15", value))?,
        ("k" | "kelvin", "f" | "fahrenheit") => {
            calculator::evaluate(&format!("(({} - 273.15) * 9 / 5) + 32", value))?
        }

        // Same unit
        (f, t) if f == t => return Ok(value),

        _ => {
            return Err(format!(
                "Unknown temperature conversion: {} to {}",
                from_unit, to_unit
            ));
        }
    };

    result_str
        .parse()
        .map_err(|_| format!("Failed to parse temperature result: {}", result_str))
}
