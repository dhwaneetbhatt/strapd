use hmac::{Hmac, KeyInit, Mac};
use sha2::{Sha256, Sha512};

pub fn sha256(input: &str, secret_key: &str) -> Result<String, String> {
    sha256_bytes(input.as_bytes(), secret_key)
}

pub fn sha512(input: &str, secret_key: &str) -> Result<String, String> {
    sha512_bytes(input.as_bytes(), secret_key)
}

pub fn sha256_bytes(input: &[u8], secret_key: &str) -> Result<String, String> {
    let hmac = Hmac::<Sha256>::new_from_slice(secret_key.as_bytes())
        .map_err(|_| "Error parsing secret key")?;
    Ok(hmac_compute(input, hmac))
}

pub fn sha512_bytes(input: &[u8], secret_key: &str) -> Result<String, String> {
    let hmac = Hmac::<Sha512>::new_from_slice(secret_key.as_bytes())
        .map_err(|_| "Error parsing secret key")?;
    Ok(hmac_compute(input, hmac))
}

fn hmac_compute<M: Mac>(input: &[u8], mut hmac: M) -> String {
    hmac.update(input);
    hex::encode(hmac.finalize().into_bytes())
}
