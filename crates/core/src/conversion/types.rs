use std::collections::HashMap;
use std::sync::OnceLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum UnitCategory {
    Bytes,
    Time,
    Length,
    Temperature,
}

// Unit struct is small (~41 bytes) so cloning is efficient
// All data is either Copy or 'static references
#[derive(Debug, Clone, PartialEq)]
pub struct Unit {
    pub canonical_name: &'static str,
    pub aliases: &'static [&'static str],
    pub category: UnitCategory,
    pub to_base_multiplier: Option<f64>, // None for temperature (formula-based)
}

#[derive(Debug, Clone, PartialEq)]
pub struct ConversionRequest {
    pub value: f64,
    pub from_unit: String,
    pub to_unit: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ConversionResult {
    pub input_value: f64,
    pub input_unit: String,
    pub output_value: f64,
    pub output_unit: String,
}

static UNIT_REGISTRY: OnceLock<HashMap<String, Unit>> = OnceLock::new();

fn build_unit_registry() -> HashMap<String, Unit> {
    let mut registry = HashMap::new();

    // Bytes / Data Size
    let bytes_units = vec![
        // Bits
        Unit {
            canonical_name: "b",
            aliases: &["bit", "bits"],
            category: UnitCategory::Bytes,
            to_base_multiplier: Some(0.125), // 1 bit = 0.125 bytes
        },
        // Bytes (base unit)
        Unit {
            canonical_name: "byte",
            aliases: &["B", "bytes"],
            category: UnitCategory::Bytes,
            to_base_multiplier: Some(1.0),
        },
        // Binary (1024-based) - both lowercase (kb, mb) and uppercase (KiB, MiB) are aliases
        Unit {
            canonical_name: "kb",
            aliases: &[
                "KB",
                "kib",
                "KiB",
                "kilobyte",
                "kilobytes",
                "kibibyte",
                "kibibytes",
            ],
            category: UnitCategory::Bytes,
            to_base_multiplier: Some(1024.0),
        },
        Unit {
            canonical_name: "mb",
            aliases: &[
                "MB",
                "mib",
                "MiB",
                "megabyte",
                "megabytes",
                "mebibyte",
                "mebibytes",
            ],
            category: UnitCategory::Bytes,
            to_base_multiplier: Some(1_048_576.0), // 1024^2
        },
        Unit {
            canonical_name: "gb",
            aliases: &[
                "GB",
                "gib",
                "GiB",
                "gigabyte",
                "gigabytes",
                "gibibyte",
                "gibibytes",
            ],
            category: UnitCategory::Bytes,
            to_base_multiplier: Some(1_073_741_824.0), // 1024^3
        },
        Unit {
            canonical_name: "tb",
            aliases: &[
                "TB",
                "tib",
                "TiB",
                "terabyte",
                "terabytes",
                "tebibyte",
                "tebibytes",
            ],
            category: UnitCategory::Bytes,
            to_base_multiplier: Some(1_099_511_627_776.0), // 1024^4
        },
        Unit {
            canonical_name: "pb",
            aliases: &[
                "PB",
                "pib",
                "PiB",
                "petabyte",
                "petabytes",
                "pebibyte",
                "pebibytes",
            ],
            category: UnitCategory::Bytes,
            to_base_multiplier: Some(1_125_899_906_842_624.0), // 1024^5
        },
    ];

    // Time
    let time_units = vec![
        Unit {
            canonical_name: "ns",
            aliases: &["nanosecond", "nanoseconds", "nanosec"],
            category: UnitCategory::Time,
            to_base_multiplier: Some(0.000_000_001), // 1 ns = 10^-9 seconds
        },
        Unit {
            canonical_name: "us",
            aliases: &["µs", "microsecond", "microseconds", "microsec"],
            category: UnitCategory::Time,
            to_base_multiplier: Some(0.000_001), // 1 us = 10^-6 seconds
        },
        Unit {
            canonical_name: "ms",
            aliases: &["millisecond", "milliseconds", "millisec"],
            category: UnitCategory::Time,
            to_base_multiplier: Some(0.001), // 1 ms = 0.001 seconds
        },
        // Seconds (base unit)
        Unit {
            canonical_name: "s",
            aliases: &["sec", "secs", "second", "seconds"],
            category: UnitCategory::Time,
            to_base_multiplier: Some(1.0),
        },
        Unit {
            canonical_name: "min",
            aliases: &["minute", "minutes"],
            category: UnitCategory::Time,
            to_base_multiplier: Some(60.0),
        },
        Unit {
            canonical_name: "h",
            aliases: &["hr", "hrs", "hour", "hours"],
            category: UnitCategory::Time,
            to_base_multiplier: Some(3600.0), // 60 * 60
        },
        Unit {
            canonical_name: "day",
            aliases: &["days", "d"],
            category: UnitCategory::Time,
            to_base_multiplier: Some(86400.0), // 24 * 60 * 60
        },
        Unit {
            canonical_name: "week",
            aliases: &["weeks", "wk", "wks"],
            category: UnitCategory::Time,
            to_base_multiplier: Some(604800.0), // 7 * 24 * 60 * 60
        },
    ];

    // Length
    let length_units = vec![
        // Metric
        Unit {
            canonical_name: "mm",
            aliases: &["millimeter", "millimeters", "millimetre", "millimetres"],
            category: UnitCategory::Length,
            to_base_multiplier: Some(0.001),
        },
        Unit {
            canonical_name: "cm",
            aliases: &["centimeter", "centimeters", "centimetre", "centimetres"],
            category: UnitCategory::Length,
            to_base_multiplier: Some(0.01),
        },
        // Meter (base unit)
        Unit {
            canonical_name: "m",
            aliases: &["meter", "meters", "metre", "metres"],
            category: UnitCategory::Length,
            to_base_multiplier: Some(1.0),
        },
        Unit {
            canonical_name: "km",
            aliases: &["kilometer", "kilometers", "kilometre", "kilometres"],
            category: UnitCategory::Length,
            to_base_multiplier: Some(1000.0),
        },
        // Imperial
        Unit {
            canonical_name: "in",
            aliases: &["inch", "inches"],
            category: UnitCategory::Length,
            to_base_multiplier: Some(0.0254),
        },
        Unit {
            canonical_name: "ft",
            aliases: &["foot", "feet"],
            category: UnitCategory::Length,
            to_base_multiplier: Some(0.3048),
        },
        Unit {
            canonical_name: "yd",
            aliases: &["yard", "yards"],
            category: UnitCategory::Length,
            to_base_multiplier: Some(0.9144),
        },
        Unit {
            canonical_name: "mi",
            aliases: &["mile", "miles"],
            category: UnitCategory::Length,
            to_base_multiplier: Some(1609.34),
        },
    ];

    // Temperature (formula-based, no multipliers)
    let temperature_units = vec![
        Unit {
            canonical_name: "c",
            aliases: &["celsius", "°c", "°C"],
            category: UnitCategory::Temperature,
            to_base_multiplier: None,
        },
        Unit {
            canonical_name: "f",
            aliases: &["fahrenheit", "°f", "°F"],
            category: UnitCategory::Temperature,
            to_base_multiplier: None,
        },
        Unit {
            canonical_name: "k",
            aliases: &["kelvin", "K"],
            category: UnitCategory::Temperature,
            to_base_multiplier: None,
        },
    ];

    // Register all units with lowercase normalization
    for unit in bytes_units
        .into_iter()
        .chain(time_units)
        .chain(length_units)
        .chain(temperature_units)
    {
        // Register canonical name (lowercase)
        registry.insert(unit.canonical_name.to_lowercase(), unit.clone());

        // Register all aliases (lowercase)
        for alias in unit.aliases {
            registry.insert(alias.to_lowercase(), unit.clone());
        }
    }

    registry
}

fn get_unit_registry() -> &'static HashMap<String, Unit> {
    UNIT_REGISTRY.get_or_init(build_unit_registry)
}

pub fn find_unit(unit_str: &str) -> Option<&'static Unit> {
    let registry = get_unit_registry();
    let trimmed = unit_str.trim();

    // Try case-preserved lookup first
    if let Some(unit) = registry.get(trimmed) {
        return Some(unit);
    }

    // Fall back to lowercase lookup
    let normalized = trimmed.to_lowercase();
    registry.get(&normalized)
}

pub fn get_units_in_category(category: UnitCategory) -> Vec<&'static Unit> {
    let registry = get_unit_registry();
    let mut units: Vec<&Unit> = registry
        .values()
        .filter(|u| u.category == category)
        .collect();

    // Deduplicate by canonical name
    units.dedup_by_key(|u| u.canonical_name);

    // Sort by size (to_base_multiplier) for proper ordering
    // For temperature units (no multiplier), sort by canonical name
    units.sort_by(|a, b| match (a.to_base_multiplier, b.to_base_multiplier) {
        (Some(a_mult), Some(b_mult)) => a_mult
            .partial_cmp(&b_mult)
            .unwrap_or(std::cmp::Ordering::Equal),
        (None, None) => a.canonical_name.cmp(b.canonical_name),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
    });

    units
}
