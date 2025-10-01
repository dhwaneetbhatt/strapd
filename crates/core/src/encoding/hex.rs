pub fn encode(input: &Vec<u8>) -> String {
    hex::encode(input)
}

pub fn decode(input: &str) -> Result<Vec<u8>, &'static str> {
    hex::decode(input).map_err(|_| "Invalid hex input")
}
