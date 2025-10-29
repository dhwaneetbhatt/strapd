use json::JsonValue;
use yaml_rust::{Yaml, YamlLoader};

pub fn convert_to_json(input: &str) -> Result<String, String> {
    let yaml =
        YamlLoader::load_from_str(input).map_err(|e| format!("Invalid YAML input: {}", e))?;
    let yaml = yaml.first().ok_or("Empty YAML document")?;

    let json_value = yaml_to_json_value(yaml)?;
    Ok(json::stringify(json_value))
}

fn yaml_to_json_value(value: &Yaml) -> Result<JsonValue, &'static str> {
    match value {
        Yaml::Hash(hash) => {
            let mut json_obj = JsonValue::new_object();
            for (key, value) in hash {
                let key_str = yaml_key_to_string(key)?;
                let val = yaml_to_json_value(value)?;
                json_obj
                    .insert(&key_str, val)
                    .expect("Failed to insert into JSON object");
            }
            Ok(json_obj)
        }
        Yaml::Array(arr) => {
            let json_arr: Result<Vec<JsonValue>, _> = arr.iter().map(yaml_to_json_value).collect();
            Ok(JsonValue::Array(json_arr?))
        }
        Yaml::Real(s) | Yaml::String(s) => Ok(JsonValue::String(s.clone())),
        Yaml::Integer(i) => Ok(JsonValue::Number((*i).into())),
        Yaml::Boolean(b) => Ok(JsonValue::Boolean(*b)),
        Yaml::Null => Ok(JsonValue::Null),
        _ => Err("Unsupported YAML type"),
    }
}

fn yaml_key_to_string(key: &Yaml) -> Result<String, &'static str> {
    match key {
        Yaml::Real(s) | Yaml::String(s) => Ok(s.clone()),
        Yaml::Integer(v) => Ok(v.to_string()),
        Yaml::Boolean(b) => Ok(b.to_string()),
        _ => Err("Invalid YAML key type"),
    }
}
