use json::JsonValue;
use strapd_core::data_formats::yaml::convert_to_json;

#[test]
fn test_simple_string() {
    let yaml = "name: John Doe";
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["name"], "John Doe");
}

#[test]
fn test_integer() {
    let yaml = "age: 30";
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["age"], 30);
}

#[test]
fn test_boolean() {
    let yaml = r#"
active: true
inactive: false
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["active"], true);
    assert_eq!(parsed["inactive"], false);
}

#[test]
fn test_null_value() {
    let yaml = "value: null";
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["value"], JsonValue::Null);
}

#[test]
fn test_float() {
    let yaml = "price: 19.99";
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["price"], "19.99");
}

#[test]
fn test_simple_array() {
    let yaml = r#"
hobbies:
  - reading
  - coding
  - gaming
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["hobbies"][0], "reading");
    assert_eq!(parsed["hobbies"][1], "coding");
    assert_eq!(parsed["hobbies"][2], "gaming");
    assert_eq!(parsed["hobbies"].len(), 3);
}

#[test]
fn test_nested_object() {
    let yaml = r#"
person:
  name: John
  age: 30
  address:
    city: New York
    zip: 10001
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["person"]["name"], "John");
    assert_eq!(parsed["person"]["age"], 30);
    assert_eq!(parsed["person"]["address"]["city"], "New York");
    assert_eq!(parsed["person"]["address"]["zip"], 10001);
}

#[test]
fn test_array_of_objects() {
    let yaml = r#"
users:
  - name: Alice
    age: 25
  - name: Bob
    age: 30
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["users"][0]["name"], "Alice");
    assert_eq!(parsed["users"][0]["age"], 25);
    assert_eq!(parsed["users"][1]["name"], "Bob");
    assert_eq!(parsed["users"][1]["age"], 30);
}

#[test]
fn test_mixed_types_in_array() {
    let yaml = r#"
mixed:
  - string
  - 42
  - true
  - null
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["mixed"][0], "string");
    assert_eq!(parsed["mixed"][1], 42);
    assert_eq!(parsed["mixed"][2], true);
    assert_eq!(parsed["mixed"][3], JsonValue::Null);
}

#[test]
fn test_empty_object() {
    let yaml = "{}";
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert!(parsed.is_object());
    assert_eq!(parsed.len(), 0);
}

#[test]
fn test_empty_array() {
    let yaml = "items: []";
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert!(parsed["items"].is_array());
    assert_eq!(parsed["items"].len(), 0);
}

#[test]
fn test_integer_key() {
    let yaml = r#"
123: value
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["123"], "value");
}

#[test]
fn test_boolean_key() {
    let yaml = r#"
true: yes_value
false: no_value
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["true"], "yes_value");
    assert_eq!(parsed["false"], "no_value");
}

#[test]
fn test_deeply_nested_structure() {
    let yaml = r#"
level1:
  level2:
    level3:
      level4:
        deep_value: found
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(
        parsed["level1"]["level2"]["level3"]["level4"]["deep_value"],
        "found"
    );
}

#[test]
fn test_complex_structure() {
    let yaml = r#"
name: Test Project
version: 1.0.0
enabled: true
config:
  timeout: 30
  retries: 3
  servers:
    - host: server1.com
      port: 8080
    - host: server2.com
      port: 8081
  features:
    - authentication
    - logging
    - monitoring
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();

    assert_eq!(parsed["name"], "Test Project");
    assert_eq!(parsed["version"], "1.0.0");
    assert_eq!(parsed["enabled"], true);
    assert_eq!(parsed["config"]["timeout"], 30);
    assert_eq!(parsed["config"]["retries"], 3);
    assert_eq!(parsed["config"]["servers"][0]["host"], "server1.com");
    assert_eq!(parsed["config"]["servers"][0]["port"], 8080);
    assert_eq!(parsed["config"]["servers"][1]["host"], "server2.com");
    assert_eq!(parsed["config"]["servers"][1]["port"], 8081);
    assert_eq!(parsed["config"]["features"][0], "authentication");
    assert_eq!(parsed["config"]["features"][1], "logging");
    assert_eq!(parsed["config"]["features"][2], "monitoring");
}

#[test]
fn test_invalid_yaml() {
    let yaml = r#"
invalid: yaml:
  - broken
  indentation
"#;
    let result = convert_to_json(yaml);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Invalid YAML input"));
}

#[test]
fn test_empty_string() {
    let yaml = "";
    let result = convert_to_json(yaml);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Empty YAML document");
}

#[test]
fn test_multiline_string() {
    let yaml = r#"
description: |
  This is a
  multiline string
  with multiple lines
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert!(
        parsed["description"]
            .as_str()
            .unwrap()
            .contains("multiline")
    );
}

#[test]
fn test_quoted_strings() {
    let yaml = r#"
single: 'single quoted'
double: "double quoted"
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["single"], "single quoted");
    assert_eq!(parsed["double"], "double quoted");
}

#[test]
fn test_special_characters_in_strings() {
    let yaml = r#"
special: "Hello\nWorld\t!"
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert!(parsed["special"].as_str().is_some());
}

#[test]
fn test_numeric_string_vs_number() {
    let yaml = r#"
number: 123
string: "123"
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["number"], 123);
    assert_eq!(parsed["string"], "123");
}

#[test]
fn test_zero_values() {
    let yaml = r#"
zero_int: 0
zero_float: 0.0
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["zero_int"], 0);
    assert_eq!(parsed["zero_float"], "0.0");
}

#[test]
fn test_negative_numbers() {
    let yaml = r#"
negative_int: -42
negative_float: -3.14
"#;
    let result = convert_to_json(yaml).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert_eq!(parsed["negative_int"], -42);
    assert_eq!(parsed["negative_float"], "-3.14");
}
