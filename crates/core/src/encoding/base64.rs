use base64::{Engine, prelude::BASE64_STANDARD};

pub fn encode(input: &Vec<u8>) -> String {
    BASE64_STANDARD.encode(input)
}

pub fn decode(input: &str) -> Result<Vec<u8>, &'static str> {
    BASE64_STANDARD
        .decode(input)
        .map_err(|_| "Invalid base64 input")
}
