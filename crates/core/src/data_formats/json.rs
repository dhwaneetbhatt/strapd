use json as json_builtin;

pub fn beautify(input: &str, spaces: u8) -> Result<String, &'static str> {
    json_builtin::parse(input)
        .map(|op| json::stringify_pretty(op, spaces.into()))
        .map_err(|_| "Invalid json input")
}

pub fn minify(input: &str) -> Result<String, &'static str> {
    json_builtin::parse(input)
        .map(json::stringify)
        .map_err(|_| "Invalid json input")
}
