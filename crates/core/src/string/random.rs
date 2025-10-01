use rand::{Rng, seq::SliceRandom};

pub fn generate(
    length: u8,
    lowercase: bool,
    uppercase: bool,
    digits: bool,
    symbols: bool,
) -> Result<String, String> {
    let charsets = build_charset(lowercase, uppercase, digits, symbols);

    if charsets.is_empty() {
        return Err("At least one character type must be selected".to_string());
    }

    let required_count = charsets.len();
    if usize::from(length) < required_count {
        return Err(format!(
            "Length must be at least {} to include all requested character types",
            required_count
        ));
    }

    Ok(generate_from_charset(length, &charsets))
}

fn generate_from_charset(length: u8, charsets: &[&str]) -> String {
    let mut rng = rand::rng();

    // First ensure that the result contains atleast 1 char from each charset
    let charset_vecs: Vec<Vec<char>> = charsets.iter().map(|s| s.chars().collect()).collect();
    let mut result: Vec<char> = charset_vecs
        .iter()
        .map(|chars| chars[rng.random_range(0..chars.len())])
        .collect();

    // Fill up the remaining characters randomly from combined charset
    let combined_charset: Vec<char> = charsets.join("").chars().collect();
    result.extend(
        (charsets.len()..usize::from(length))
            .map(|_| combined_charset[rng.random_range(0..combined_charset.len())]),
    );

    result.shuffle(&mut rng);
    result.into_iter().collect()
}

const LOWERCASE: &str = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS: &str = "0123456789";
const SYMBOLS: &str = "!@#$%^&*-_=+";

fn build_charset(
    lowercase: bool,
    uppercase: bool,
    digits: bool,
    symbols: bool,
) -> Vec<&'static str> {
    let mut charsets = Vec::new();
    if lowercase {
        charsets.push(LOWERCASE);
    }
    if uppercase {
        charsets.push(UPPERCASE);
    }
    if digits {
        charsets.push(DIGITS);
    }
    if symbols {
        charsets.push(SYMBOLS);
    }
    charsets
}
