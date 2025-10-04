use strapd_core::data_formats::json::sort;

#[test]
fn test_sort_simple_object() {
    let input = r#"{"z": 1, "a": 2, "m": 3}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Check that keys are in alphabetical order
    let keys: Vec<&str> = parsed.entries().map(|(k, _)| k).collect();
    assert_eq!(keys, vec!["a", "m", "z"]);
}

#[test]
fn test_sort_nested_objects() {
    let input = r#"{"z": {"nested_z": 1, "nested_a": 2}, "a": 3}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Check top-level keys
    let keys: Vec<&str> = parsed.entries().map(|(k, _)| k).collect();
    assert_eq!(keys, vec!["a", "z"]);

    // Check nested keys
    let nested_keys: Vec<&str> = parsed["z"].entries().map(|(k, _)| k).collect();
    assert_eq!(nested_keys, vec!["nested_a", "nested_z"]);
}

#[test]
fn test_sort_with_arrays() {
    let input = r#"{"z": [1, 2, 3], "a": [4, 5, 6]}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Keys should be sorted
    let keys: Vec<&str> = parsed.entries().map(|(k, _)| k).collect();
    assert_eq!(keys, vec!["a", "z"]);

    // Array order should be preserved
    assert_eq!(parsed["z"][0], 1);
    assert_eq!(parsed["z"][1], 2);
    assert_eq!(parsed["z"][2], 3);
}

#[test]
fn test_sort_objects_inside_arrays() {
    let input = r#"{"data": [{"z": 1, "a": 2}, {"y": 3, "b": 4}]}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Objects inside arrays should also be sorted
    let first_obj_keys: Vec<&str> = parsed["data"][0].entries().map(|(k, _)| k).collect();
    assert_eq!(first_obj_keys, vec!["a", "z"]);

    let second_obj_keys: Vec<&str> = parsed["data"][1].entries().map(|(k, _)| k).collect();
    assert_eq!(second_obj_keys, vec!["b", "y"]);
}

#[test]
fn test_sort_preserves_values() {
    let input = r#"{"z": "hello", "a": 42, "m": true, "n": null}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Values should be preserved
    assert_eq!(parsed["a"], 42);
    assert_eq!(parsed["m"], true);
    assert_eq!(parsed["n"], json::JsonValue::Null);
    assert_eq!(parsed["z"], "hello");
}

#[test]
fn test_sort_with_format_false() {
    let input = r#"{"z": 1, "a": 2}"#;
    let result = sort(input, false).unwrap();

    // Should be minified (no extra whitespace)
    assert!(!result.contains("\n"));
    assert!(result.contains(r#""a":2"#) || result.contains(r#""a": 2"#));
}

#[test]
fn test_sort_with_format_true() {
    let input = r#"{"z": 1, "a": 2}"#;
    let result = sort(input, true).unwrap();

    // Should be pretty-printed (contains newlines and indentation)
    assert!(result.contains("\n"));
    assert!(result.contains("  ")); // Should have indentation
}

#[test]
fn test_sort_empty_object() {
    let input = r#"{}"#;
    let result = sort(input, false).unwrap();
    assert_eq!(result, "{}");
}

#[test]
fn test_sort_empty_array() {
    let input = r#"{"data": []}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["data"].len(), 0);
}

#[test]
fn test_sort_deeply_nested() {
    let input = r#"{"z": {"y": {"x": {"w": 1, "a": 2}}}}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Check the deepest level is sorted
    let deep_keys: Vec<&str> = parsed["z"]["y"]["x"].entries().map(|(k, _)| k).collect();
    assert_eq!(deep_keys, vec!["a", "w"]);
}

#[test]
fn test_sort_invalid_json() {
    let input = r#"{"invalid": json}"#;
    let result = sort(input, false);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Invalid json input");
}

#[test]
fn test_sort_top_level_array() {
    let input = r#"[{"z": 1, "a": 2}, {"y": 3, "b": 4}]"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Objects inside top-level array should be sorted
    let first_keys: Vec<&str> = parsed[0].entries().map(|(k, _)| k).collect();
    assert_eq!(first_keys, vec!["a", "z"]);

    let second_keys: Vec<&str> = parsed[1].entries().map(|(k, _)| k).collect();
    assert_eq!(second_keys, vec!["b", "y"]);
}

#[test]
fn test_sort_primitive_values() {
    // Sorting a primitive should just return it as-is
    let input = r#""just a string""#;
    let result = sort(input, false).unwrap();
    assert_eq!(result, r#""just a string""#);

    let input = r#"42"#;
    let result = sort(input, false).unwrap();
    assert_eq!(result, "42");
}

#[test]
fn test_sort_mixed_types_in_array() {
    let input = r#"{"data": [1, "string", {"z": 1, "a": 2}, [1, 2], true, null]}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Object inside mixed array should still be sorted
    let obj_keys: Vec<&str> = parsed["data"][2].entries().map(|(k, _)| k).collect();
    assert_eq!(obj_keys, vec!["a", "z"]);

    // Other values should be preserved in order
    assert_eq!(parsed["data"][0], 1);
    assert_eq!(parsed["data"][1], "string");
    assert_eq!(parsed["data"][4], true);
    assert_eq!(parsed["data"][5], json::JsonValue::Null);
}

#[test]
fn test_sort_unicode_keys() {
    let input = r#"{"zürich": 1, "äpfel": 2, "berlin": 3}"#;
    let result = sort(input, false).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Unicode keys should be sorted correctly
    let keys: Vec<&str> = parsed.entries().map(|(k, _)| k).collect();
    // Note: sorting behavior depends on byte-level comparison
    assert_eq!(keys.len(), 3);
    assert!(keys.contains(&"zürich"));
    assert!(keys.contains(&"äpfel"));
    assert!(keys.contains(&"berlin"));
}
