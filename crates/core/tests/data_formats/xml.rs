use strapd_core::data_formats::xml::{beautify, convert_to_json, minify};

// Tests for beautify
#[test]
fn test_beautify_simple_xml() {
    let input = r#"<root><name>John</name><age>30</age></root>"#;
    let result = beautify(input, 2).unwrap();
    assert!(result.contains("root"));
    assert!(result.contains("name"));
    assert!(result.contains("John"));
    // Should have newlines for formatting
    assert!(result.contains("\n"));
}

#[test]
fn test_beautify_nested_xml() {
    let input = r#"<root><user><name>Alice</name></user></root>"#;
    let result = beautify(input, 2).unwrap();
    assert!(result.contains("root"));
    assert!(result.contains("user"));
    assert!(result.contains("name"));
    assert!(result.contains("Alice"));
}

#[test]
fn test_beautify_with_different_indentation() {
    let input = r#"<root><name>Bob</name></root>"#;
    let result = beautify(input, 4).unwrap();
    assert!(result.contains("name"));
    assert!(result.contains("Bob"));
}

#[test]
fn test_beautify_with_attributes() {
    let input = r#"<root id="1"><name>John</name></root>"#;
    let result = beautify(input, 2).unwrap();
    assert!(result.contains("root"));
    assert!(result.contains("name"));
}

// Tests for minify
#[test]
fn test_minify_formatted_xml() {
    let input = r#"<root>
  <name>John</name>
  <age>30</age>
</root>"#;
    let result = minify(input).unwrap();
    assert!(result.contains("root"));
    assert!(result.contains("name"));
    assert!(result.contains("John"));
    assert!(result.contains("age"));
    assert!(result.contains("30"));
}

#[test]
fn test_minify_already_compact_xml() {
    let input = r#"<root><name>Alice</name></root>"#;
    let result = minify(input).unwrap();
    assert!(result.contains("root"));
    assert!(result.contains("name"));
    assert!(result.contains("Alice"));
}

#[test]
fn test_minify_nested_xml() {
    let input = r#"<root>
  <user>
    <name>Bob</name>
    <email>bob@example.com</email>
  </user>
</root>"#;
    let result = minify(input).unwrap();
    assert!(result.contains("user"));
    assert!(result.contains("name"));
    assert!(result.contains("Bob"));
    assert!(result.contains("email"));
}

#[test]
fn test_minify_xml_with_attributes() {
    let input = r#"<root id="123">
  <name lang="en">Alice</name>
</root>"#;
    let result = minify(input).unwrap();
    assert!(result.contains("root"));
    assert!(result.contains("name"));
    assert!(result.contains("Alice"));
}

// Tests for convert_to_json
#[test]
fn test_convert_simple_xml_to_json() {
    let input = r#"<root><name>John</name><age>30</age></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Verify structure: root is top level object
    assert!(parsed.is_object());
    assert!(parsed.has_key("root"));

    // Verify hierarchy: name and age are children of root
    assert!(parsed["root"].is_object());
    assert_eq!(parsed["root"]["name"], "John");
    assert_eq!(parsed["root"]["age"], "30");

    // Verify no extra keys
    let mut keys = vec![];
    for (k, _) in parsed["root"].entries() {
        keys.push(k);
    }
    assert_eq!(keys.len(), 2);
}

#[test]
fn test_convert_nested_xml_to_json() {
    let input = r#"<root><user><name>Alice</name><email>alice@example.com</email></user></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Verify deep hierarchy
    assert!(parsed["root"].is_object());
    assert!(parsed["root"]["user"].is_object());

    // Verify all values are correct
    assert_eq!(parsed["root"]["user"]["name"], "Alice");
    assert_eq!(parsed["root"]["user"]["email"], "alice@example.com");

    // Verify user has exactly 2 keys
    let mut user_keys = vec![];
    for (k, _) in parsed["root"]["user"].entries() {
        user_keys.push(k);
    }
    assert_eq!(user_keys.len(), 2);
}

#[test]
fn test_convert_xml_with_array_to_json() {
    let input = r#"<root><item>first</item><item>second</item><item>third</item></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Verify array is created for duplicate keys
    assert!(parsed["root"]["item"].is_array());
    assert_eq!(parsed["root"]["item"].len(), 3);

    // Verify values in correct order
    assert_eq!(parsed["root"]["item"][0], "first");
    assert_eq!(parsed["root"]["item"][1], "second");
    assert_eq!(parsed["root"]["item"][2], "third");
}

#[test]
fn test_convert_empty_xml_element_to_json() {
    let input = r#"<root><item>value</item></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Verify root structure
    assert!(parsed.is_object());
    assert!(parsed.has_key("root"));
    assert!(parsed["root"].is_object());

    // Verify content
    assert!(parsed["root"].has_key("item"));
    assert_eq!(parsed["root"]["item"], "value");

    // Verify root has exactly 1 key
    assert_eq!(parsed["root"].entries().count(), 1);
}

#[test]
fn test_convert_xml_with_numbers_to_json() {
    let input = r#"<root><count>42</count><price>19.99</price></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Numbers are kept as strings in XML conversion
    assert_eq!(parsed["root"]["count"], "42");
    assert_eq!(parsed["root"]["price"], "19.99");

    // Verify they are strings, not numbers
    assert!(parsed["root"]["count"].is_string());
    assert!(parsed["root"]["price"].is_string());
}

#[test]
fn test_convert_xml_with_booleans_to_json() {
    let input = r#"<root><active>true</active><deleted>false</deleted></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Boolean text values are kept as strings
    assert_eq!(parsed["root"]["active"], "true");
    assert_eq!(parsed["root"]["deleted"], "false");
    assert!(parsed["root"]["active"].is_string());
    assert!(parsed["root"]["deleted"].is_string());
}

#[test]
fn test_convert_deeply_nested_xml_to_json() {
    let input =
        r#"<root><level1><level2><level3><value>deep</value></level3></level2></level1></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Verify complete hierarchy chain
    assert!(parsed["root"].is_object());
    assert!(parsed["root"]["level1"].is_object());
    assert!(parsed["root"]["level1"]["level2"].is_object());
    assert!(parsed["root"]["level1"]["level2"]["level3"].is_object());

    // Verify final value
    assert_eq!(
        parsed["root"]["level1"]["level2"]["level3"]["value"],
        "deep"
    );

    // Verify each level has exactly 1 key
    assert_eq!(parsed["root"].entries().count(), 1);
    assert_eq!(parsed["root"]["level1"].entries().count(), 1);
    assert_eq!(parsed["root"]["level1"]["level2"].entries().count(), 1);
    assert_eq!(
        parsed["root"]["level1"]["level2"]["level3"]
            .entries()
            .count(),
        1
    );
}

#[test]
fn test_convert_xml_with_special_chars_to_json() {
    // Test with literal characters (not entities in XML)
    let input = r#"<root><text>Hello and goodbye</text></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Verify structure is correct
    assert!(parsed["root"].is_object());
    assert!(parsed["root"].has_key("text"));

    // Verify text value is correct
    let text_value = parsed["root"]["text"].as_str().unwrap();
    assert_eq!(text_value, "Hello and goodbye");
}

#[test]
fn test_convert_invalid_xml_to_json() {
    let input = r#"<root><unclosed>"#;
    let result = convert_to_json(input);
    assert!(result.is_err());
}

#[test]
fn test_convert_xml_multiple_roots_to_json() {
    let input = r#"<root><data>1</data></root><root><data>2</data></root>"#;
    let result = convert_to_json(input);
    assert!(result.is_err());
}

#[test]
fn test_convert_xml_unicode_to_json() {
    let input = r#"<root><greeting>Hello 世界</greeting></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();
    assert!(
        parsed["root"]["greeting"]
            .as_str()
            .unwrap()
            .contains("世界")
    );
}

#[test]
fn test_beautify_then_minify_roundtrip() {
    let input = r#"<root><name>John</name></root>"#;
    let beautified = beautify(input, 2).unwrap();
    let minified = minify(&beautified).unwrap();
    let original_minified = minify(input).unwrap();
    // Both should parse to the same structure
    let parsed1 = json::parse(&convert_to_json(&minified).unwrap()).unwrap();
    let parsed2 = json::parse(&convert_to_json(&original_minified).unwrap()).unwrap();
    assert_eq!(parsed1, parsed2);
}

#[test]
fn test_convert_xml_with_entities_to_json() {
    let input = r#"<root><text>Ampersand &amp; LessThan &lt; GreaterThan &gt; Quote &quot; Apostrophe &apos;</text></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Verify structure
    assert!(parsed["root"].is_object());
    assert!(parsed["root"].has_key("text"));

    // Verify all entities are properly decoded and spaces preserved
    let text_value = parsed["root"]["text"].as_str().unwrap();
    assert_eq!(
        text_value,
        "Ampersand & LessThan < GreaterThan > Quote \" Apostrophe '"
    );
}

#[test]
fn test_convert_xml_with_mixed_entities_and_text_to_json() {
    let input = r#"<root><data>Hello &amp; world &lt;test&gt; &quot;quoted&quot;</data></root>"#;
    let result = convert_to_json(input).unwrap();
    let parsed = json::parse(&result).unwrap();

    // Verify structure and content
    assert!(parsed["root"].is_object());
    let data_value = parsed["root"]["data"].as_str().unwrap();
    assert_eq!(data_value, "Hello & world <test> \"quoted\"");
}
