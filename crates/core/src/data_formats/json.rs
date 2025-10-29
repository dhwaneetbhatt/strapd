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
    let parsed = json_builtin::parse(input).map_err(|e| format!("Invalid JSON input: {}", e))?;
    let yaml_value = json_to_yaml(&parsed)?;
    let mut output = String::new();
    YamlEmitter::new(&mut output)
        .dump(&yaml_value)
        .map_err(|e| format!("Failed to emit YAML: {}", e))?;
    Ok(output)
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
            let array: Result<Vec<Yaml>, String> = value.members().map(json_to_yaml).collect();
            Ok(Yaml::Array(array?))
        }
        JsonValue::String(s) => Ok(Yaml::String(s.to_string())),
        JsonValue::Number(n) => {
            // Try to parse as integer first, then fall back to real
            match n.to_string().parse::<i64>() {
                Ok(i) => Ok(Yaml::Integer(i)),
                Err(_) => Ok(Yaml::Real(n.to_string())),
            }
        }
        JsonValue::Boolean(b) => Ok(Yaml::Boolean(*b)),
        JsonValue::Null => Ok(Yaml::Null),
        JsonValue::Short(s) => Ok(Yaml::String(s.to_string())),
    }
}
