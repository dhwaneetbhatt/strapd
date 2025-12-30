use crate::data_formats::xml;
use json::{self as json_builtin, JsonValue};
use yaml_rust::{YamlEmitter, yaml::Hash, yaml::Yaml};

pub fn beautify(input: &str, spaces: u8, sort: bool) -> Result<String, &'static str> {
    json_builtin::parse(input)
        .map(|parsed| match sort {
            true => sort_json_keys(&parsed),
            false => parsed,
        })
        .map(|value| json::stringify_pretty(value, spaces.into()))
        .map_err(|_| "Invalid json input")
}

pub fn minify(input: &str, sort: bool) -> Result<String, &'static str> {
    json_builtin::parse(input)
        .map(|parsed| match sort {
            true => sort_json_keys(&parsed),
            false => parsed,
        })
        .map(json::stringify)
        .map_err(|_| "Invalid json input")
}

pub fn sort(input: &str, format: bool) -> Result<String, &'static str> {
    json_builtin::parse(input)
        .map(|parsed| sort_json_keys(&parsed))
        .map(|value| match format {
            true => json::stringify_pretty(value, 2),
            false => json::stringify(value),
        })
        .map_err(|_| "Invalid json input")
}

pub fn convert_to_yaml(input: &str) -> Result<String, String> {
    let parsed = json_builtin::parse(input).map_err(|e| format!("Invalid JSON input: {e}"))?;
    let yaml_value = json_to_yaml(&parsed)?;
    let mut output = String::new();
    YamlEmitter::new(&mut output)
        .dump(&yaml_value)
        .map_err(|e| format!("Failed to emit YAML: {e}"))?;
    Ok(output)
}

pub fn convert_to_xml(input: &str, root_name: Option<&str>) -> Result<String, String> {
    let parsed = json_builtin::parse(input).map_err(|e| format!("Invalid JSON input: {e}"))?;

    if let Some(provided_root) = root_name {
        json_to_xml(&parsed, provided_root)
    } else {
        match &parsed {
            JsonValue::Object(_) => {
                let mut entries_iter = parsed.entries();
                if let Some((key, value)) = entries_iter.next() {
                    if entries_iter.next().is_none() {
                        // Single key object: use the key as root and pass the value
                        json_to_xml(value, key)
                    } else {
                        // Multiple keys: use default root with full object
                        json_to_xml(&parsed, "root")
                    }
                } else {
                    // Empty object: use default root
                    json_to_xml(&parsed, "root")
                }
            }
            _ => json_to_xml(&parsed, "root"),
        }
    }
}

fn sort_json_keys(value: &JsonValue) -> JsonValue {
    match value {
        JsonValue::Object(_) => {
            let mut entries: Vec<_> = value.entries().collect();
            entries.sort_by_key(|(key, _)| *key);
            let mut sorted_object = JsonValue::new_object();

            for (key, value) in entries {
                let sorted_value = sort_json_keys(value);
                sorted_object
                    .insert(key, sorted_value)
                    .expect("Failed to insert into JSON object");
            }
            sorted_object
        }
        JsonValue::Array(_) => {
            let sorted_members: Vec<JsonValue> = value.members().map(sort_json_keys).collect();
            JsonValue::Array(sorted_members)
        }
        _ => value.clone(),
    }
}

fn json_to_yaml(value: &JsonValue) -> Result<Yaml, String> {
    match value {
        JsonValue::Object(_) => {
            let mut hash = Hash::new();
            for (key, val) in value.entries() {
                let yaml_key = Yaml::String(key.to_string());
                let yaml_val = json_to_yaml(val)?;
                hash.insert(yaml_key, yaml_val);
            }
            Ok(Yaml::Hash(hash))
        }
        JsonValue::Array(_) => {
            let array: Vec<Yaml> = value
                .members()
                .map(json_to_yaml)
                .collect::<Result<Vec<Yaml>, String>>()?;
            Ok(Yaml::Array(array))
        }
        JsonValue::String(s) => Ok(Yaml::String(s.to_string())),
        JsonValue::Number(n) => match n.to_string().parse::<i64>() {
            Ok(i) => Ok(Yaml::Integer(i)),
            Err(_) => Ok(Yaml::Real(n.to_string())),
        },
        JsonValue::Boolean(b) => Ok(Yaml::Boolean(*b)),
        JsonValue::Null => Ok(Yaml::Null),
        JsonValue::Short(s) => Ok(Yaml::String(s.to_string())),
    }
}

fn json_to_xml(value: &JsonValue, key: &str) -> Result<String, String> {
    let escaped_key = xml::escape(key);

    match value {
        JsonValue::Object(_) => {
            let mut xml = String::with_capacity(256);
            xml.push('<');
            xml.push_str(&escaped_key);
            xml.push('>');
            for (k, v) in value.entries() {
                xml.push_str(&json_to_xml(v, k)?);
            }
            xml.push_str("</");
            xml.push_str(&escaped_key);
            xml.push('>');
            Ok(xml)
        }
        JsonValue::Array(_) => {
            let items: Vec<String> = value
                .members()
                .map(|item| json_to_xml(item, key))
                .collect::<Result<Vec<String>, String>>()?;

            if items.is_empty() {
                let mut xml = String::with_capacity(escaped_key.len() + 5);
                xml.push('<');
                xml.push_str(&escaped_key);
                xml.push_str(" />");
                Ok(xml)
            } else {
                Ok(items.join(""))
            }
        }
        JsonValue::String(s) => {
            let escaped_s = xml::escape(s);
            let mut xml = String::with_capacity(escaped_key.len() * 2 + escaped_s.len() + 5);
            xml.push('<');
            xml.push_str(&escaped_key);
            xml.push('>');
            xml.push_str(&escaped_s);
            xml.push_str("</");
            xml.push_str(&escaped_key);
            xml.push('>');
            Ok(xml)
        }
        JsonValue::Number(n) => {
            let n_str = n.to_string();
            let mut xml = String::with_capacity(escaped_key.len() * 2 + n_str.len() + 5);
            xml.push('<');
            xml.push_str(&escaped_key);
            xml.push('>');
            xml.push_str(&n_str);
            xml.push_str("</");
            xml.push_str(&escaped_key);
            xml.push('>');
            Ok(xml)
        }
        JsonValue::Boolean(b) => {
            let b_str = b.to_string();
            let mut xml = String::with_capacity(escaped_key.len() * 2 + b_str.len() + 5);
            xml.push('<');
            xml.push_str(&escaped_key);
            xml.push('>');
            xml.push_str(&b_str);
            xml.push_str("</");
            xml.push_str(&escaped_key);
            xml.push('>');
            Ok(xml)
        }
        JsonValue::Null => {
            let mut xml = String::with_capacity(escaped_key.len() + 5);
            xml.push('<');
            xml.push_str(&escaped_key);
            xml.push_str(" />");
            Ok(xml)
        }
        JsonValue::Short(s) => {
            let escaped_s = xml::escape(s);
            let mut xml = String::with_capacity(escaped_key.len() * 2 + escaped_s.len() + 5);
            xml.push('<');
            xml.push_str(&escaped_key);
            xml.push('>');
            xml.push_str(&escaped_s);
            xml.push_str("</");
            xml.push_str(&escaped_key);
            xml.push('>');
            Ok(xml)
        }
    }
}
