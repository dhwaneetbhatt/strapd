pub fn encode(input: &str) -> String {
    urlencoding::encode(input).into_owned()
}

pub fn decode(input: &str) -> Result<String, String> {
    urlencoding::decode(input)
        .map(|result| result.into_owned())
        .map_err(|e| format!("Error decoding URL: {}", e))
}
