use strapd_core::data_formats::json::{convert_to_xml, convert_to_yaml, sort};

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

// Tests for convert_to_yaml function
#[test]
fn test_convert_simple_object_to_yaml() {
    let input = r#"{"name": "John", "age": 30, "active": true}"#;
    let result = convert_to_yaml(input).unwrap();

    // Check that result contains YAML format
    assert!(result.contains("name: John"));
    assert!(result.contains("age: 30"));
    assert!(result.contains("active: true"));
}

#[test]
fn test_convert_nested_object_to_yaml() {
    let input = r#"{"person": {"name": "John", "details": {"age": 30, "city": "NYC"}}}"#;
    let result = convert_to_yaml(input).unwrap();

    // Check nested structure
    assert!(result.contains("person:"));
    assert!(result.contains("name: John"));
    assert!(result.contains("details:"));
    assert!(result.contains("age: 30"));
    assert!(result.contains("city: NYC"));
}

#[test]
fn test_convert_array_to_yaml() {
    let input = r#"{"numbers": [1, 2, 3], "strings": ["a", "b", "c"]}"#;
    let result = convert_to_yaml(input).unwrap();

    // Check array format
    assert!(result.contains("numbers:"));
    assert!(result.contains("- 1"));
    assert!(result.contains("- 2"));
    assert!(result.contains("- 3"));
    assert!(result.contains("strings:"));
    assert!(result.contains("- a"));
    assert!(result.contains("- b"));
    assert!(result.contains("- c"));
}

#[test]
fn test_convert_mixed_types_to_yaml() {
    let input =
        r#"{"string": "hello", "number": 42, "float": 3.14, "boolean": true, "null_value": null}"#;
    let result = convert_to_yaml(input).unwrap();

    // Check all data types
    assert!(result.contains("string: hello"));
    assert!(result.contains("number: 42"));
    assert!(result.contains("float: 3.14"));
    assert!(result.contains("boolean: true"));
    assert!(result.contains("null_value: ~") || result.contains("null_value: null"));
}

#[test]
fn test_convert_array_of_objects_to_yaml() {
    let input = r#"{"users": [{"name": "Alice", "age": 25}, {"name": "Bob", "age": 30}]}"#;
    let result = convert_to_yaml(input).unwrap();

    // Check array of objects format
    assert!(result.contains("users:"));
    assert!(result.contains("name: Alice"));
    assert!(result.contains("age: 25"));
    assert!(result.contains("name: Bob"));
    assert!(result.contains("age: 30"));
}

#[test]
fn test_convert_empty_object_to_yaml() {
    let input = r#"{}"#;
    let result = convert_to_yaml(input).unwrap();

    // Empty object should produce valid YAML
    assert!(result.contains("{}") || result.trim().is_empty() || result.contains("---"));
}

#[test]
fn test_convert_empty_array_to_yaml() {
    let input = r#"{"empty_list": []}"#;
    let result = convert_to_yaml(input).unwrap();

    // Empty array should be represented properly
    assert!(result.contains("empty_list:"));
    assert!(result.contains("[]") || result.contains("empty_list: []"));
}

#[test]
fn test_convert_deeply_nested_to_yaml() {
    let input = r#"{"level1": {"level2": {"level3": {"value": "deep"}}}}"#;
    let result = convert_to_yaml(input).unwrap();

    // Check deep nesting
    assert!(result.contains("level1:"));
    assert!(result.contains("level2:"));
    assert!(result.contains("level3:"));
    assert!(result.contains("value: deep"));
}

#[test]
fn test_convert_top_level_array_to_yaml() {
    let input = r#"[{"name": "item1"}, {"name": "item2"}]"#;
    let result = convert_to_yaml(input).unwrap();

    // Top-level array should be handled
    assert!(result.contains("name: item1"));
    assert!(result.contains("name: item2"));
}

#[test]
fn test_convert_special_characters_to_yaml() {
    let input =
        r#"{"message": "Hello\nWorld", "quote": "She said \"hi\"", "backslash": "C:\\path"}"#;
    let result = convert_to_yaml(input).unwrap();

    // Special characters should be handled
    assert!(result.contains("message:"));
    assert!(result.contains("quote:"));
    assert!(result.contains("backslash:"));
}

#[test]
fn test_convert_unicode_to_yaml() {
    let input = r#"{"greeting": "Hello 世界", "emoji": "🚀", "symbol": "α"}"#;
    let result = convert_to_yaml(input).unwrap();

    // Unicode should be preserved
    assert!(result.contains("greeting:"));
    assert!(result.contains("emoji:"));
    assert!(result.contains("symbol:"));
}

#[test]
fn test_convert_numbers_to_yaml() {
    let input =
        r#"{"integer": 42, "negative": -17, "zero": 0, "float": 3.14159, "scientific": 1.23e-4}"#;
    let result = convert_to_yaml(input).unwrap();

    // Different number formats should be handled
    assert!(result.contains("integer: 42"));
    assert!(result.contains("negative: -17"));
    assert!(result.contains("zero: 0"));
    assert!(result.contains("float: 3.14159"));
    assert!(result.contains("scientific:"));
}

#[test]
fn test_convert_invalid_json_to_yaml() {
    let input = r#"{"invalid": json, "missing": "quote}"#;
    let result = convert_to_yaml(input);

    // Should return error for invalid JSON
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Invalid JSON input"));
}

#[test]
fn test_convert_single_value_to_yaml() {
    // Test primitive JSON values
    let input = r#""just a string""#;
    let result = convert_to_yaml(input).unwrap();
    assert!(!result.is_empty());

    let input = r#"42"#;
    let result = convert_to_yaml(input).unwrap();
    assert!(!result.is_empty());

    let input = r#"true"#;
    let result = convert_to_yaml(input).unwrap();
    assert!(!result.is_empty());

    let input = "null";
    let result = convert_to_yaml(input).unwrap();
    assert!(!result.is_empty());
}

#[test]
fn test_convert_large_object_to_yaml() {
    let input = r#"{
        "config": {
            "database": {
                "host": "localhost",
                "port": 5432,
                "credentials": {
                    "username": "admin",
                    "password": "secret"
                }
            },
            "features": ["auth", "logging", "metrics"],
            "debug": true,
            "version": "1.0.0"
        }
    }"#;
    let result = convert_to_yaml(input).unwrap();

    // Check various parts of the complex structure
    assert!(result.contains("config:"));
    assert!(result.contains("database:"));
    assert!(result.contains("host: localhost"));
    assert!(result.contains("port: 5432"));
    assert!(result.contains("credentials:"));
    assert!(result.contains("username: admin"));
    assert!(result.contains("password: secret"));
    assert!(result.contains("features:"));
    assert!(result.contains("- auth"));
    assert!(result.contains("- logging"));
    assert!(result.contains("- metrics"));
    assert!(result.contains("debug: true"));
    assert!(result.contains("version: 1.0.0"));
}

// Tests for convert_to_xml
#[test]
fn test_convert_simple_object_to_xml() {
    let input = r#"{"name": "John", "age": 30}"#;
    let result = convert_to_xml(input, None).unwrap();

    // Verify XML structure
    assert!(result.starts_with("<root>"));
    assert!(result.ends_with("</root>"));
    // Verify hierarchy: name and age are direct children of root
    assert!(result.contains("<name>John</name>"));
    assert!(result.contains("<age>30</age>"));
    // Verify they're within root tags
    let root_content = result
        .trim_start_matches("<root>")
        .trim_end_matches("</root>");
    assert!(root_content.contains("<name>John</name>"));
    assert!(root_content.contains("<age>30</age>"));
}

#[test]
fn test_convert_to_xml_with_custom_root() {
    let input = r#"{"name": "Alice"}"#;
    let result = convert_to_xml(input, Some("person")).unwrap();

    // Verify custom root element
    assert!(result.starts_with("<person>"));
    assert!(result.ends_with("</person>"));
    assert!(!result.contains("<root>"));
    // Verify content is inside person element
    assert!(result.contains("<name>Alice</name>"));
}

#[test]
fn test_convert_nested_to_xml() {
    let input = r#"{"user": {"name": "Bob", "email": "bob@example.com"}}"#;
    let result = convert_to_xml(input, None).unwrap();

    // Verify hierarchy: auto-detect uses "user" as root since it's single-key object
    assert!(result.starts_with("<user>"));
    assert!(result.contains("<name>Bob</name>"));
    assert!(result.contains("<email>bob@example.com</email>"));
    assert!(result.ends_with("</user>"));

    // Verify nesting order: name and email come after <user> and before </user>
    let user_start = result.find("<user>").unwrap();
    let user_end = result.find("</user>").unwrap();
    let user_section = &result[user_start..user_end];
    assert!(user_section.contains("<name>Bob</name>"));
    assert!(user_section.contains("<email>bob@example.com</email>"));
}

#[test]
fn test_convert_array_to_xml() {
    let input = r#"{"items": [1, 2, 3]}"#;
    let result = convert_to_xml(input, None).unwrap();

    // Verify multiple items elements exist (array representation)
    // Auto-detect uses "items" as root since it's single-key object
    assert!(result.starts_with("<items>"));
    assert!(result.contains("<items>1</items>"));
    assert!(result.contains("<items>2</items>"));
    assert!(result.contains("<items>3</items>"));
    assert!(result.ends_with("</items>"));
}

#[test]
fn test_convert_special_chars_to_xml() {
    let input = r#"{"text": "Hello & <world>"}"#;
    let result = convert_to_xml(input, None).unwrap();

    // Verify proper escaping within tag structure
    assert!(result.contains("<text>"));
    assert!(result.contains("&amp;"));
    assert!(result.contains("&lt;"));
    assert!(result.contains("&gt;"));
    assert!(result.contains("</text>"));
    // Verify escaping is within the text tags
    let text_start = result.find("<text>").unwrap();
    let text_end = result.find("</text>").unwrap();
    let text_section = &result[text_start..text_end];
    assert!(text_section.contains("&amp;"));
    assert!(text_section.contains("&lt;"));
    assert!(text_section.contains("&gt;"));
}

#[test]
fn test_convert_empty_object_to_xml() {
    let input = r#"{}"#;
    let result = convert_to_xml(input, None).unwrap();

    // Empty object should create root element with no children
    assert!(result.starts_with("<root"));
    assert!(result.ends_with("</root>"));
    // Verify no content between tags
    let root_content = result
        .trim_start_matches("<root")
        .trim_start_matches(">")
        .trim_end_matches("</root>")
        .trim();
    assert!(root_content.is_empty());
}

#[test]
fn test_convert_boolean_to_xml() {
    let input = r#"{"active": true, "deleted": false}"#;
    let result = convert_to_xml(input, None).unwrap();

    // Verify boolean values are properly wrapped
    assert!(result.contains("<active>true</active>"));
    assert!(result.contains("<deleted>false</deleted>"));
    assert!(result.starts_with("<root>"));
    assert!(result.ends_with("</root>"));
}

#[test]
fn test_convert_null_to_xml() {
    let input = r#"{"value": null}"#;
    let result = convert_to_xml(input, None).unwrap();

    // Null should be self-closing tag
    // Auto-detect uses "value" as root since it's single-key object
    assert!(result.starts_with("<value"));
    assert!(result.contains("/>"));
}

#[test]
fn test_convert_invalid_json_to_xml() {
    let input = r#"{"invalid": json}"#;
    let result = convert_to_xml(input, None);
    assert!(result.is_err());
}

#[test]
fn test_convert_multi_key_object_to_xml() {
    let input = r#"{"name": "John", "age": 30}"#;
    let result = convert_to_xml(input, None).unwrap();

    // Multiple keys: should use default root since no single key to use
    assert!(result.starts_with("<root>"));
    assert!(result.ends_with("</root>"));
    assert!(result.contains("<name>John</name>"));
    assert!(result.contains("<age>30</age>"));
}

#[test]
fn test_convert_top_level_array_to_xml() {
    let input = r#"[{"id": 1}, {"id": 2}]"#;
    let result = convert_to_xml(input, None).unwrap();

    // Top-level array: should use default root wrapper
    assert!(result.starts_with("<root>"));
    assert!(result.ends_with("</root>"));
    assert!(result.contains("<id>1</id>"));
    assert!(result.contains("<id>2</id>"));
}
