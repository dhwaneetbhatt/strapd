use json::{self as json_builtin, JsonValue};

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
