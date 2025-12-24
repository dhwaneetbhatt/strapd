use rand::{Rng, seq::SliceRandom};
use std::collections::HashSet;

pub fn string(
    count: usize,
    length: u8,
    lowercase: bool,
    uppercase: bool,
    digits: bool,
    symbols: bool,
    custom_charset: Option<&str>,
) -> Result<Vec<String>, String> {
    let charsets = build_charset(lowercase, uppercase, digits, symbols, custom_charset);

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

    Ok(generate_from_charset(count, length, &charsets))
}

pub fn number(min: i64, max: i64, count: usize) -> Vec<i64> {
    let mut rng = rand::rng();
    (0..count).map(|_| rng.random_range(min..=max)).collect()
}

fn generate_from_charset(count: usize, length: u8, charsets: &[&str]) -> Vec<String> {
    let mut rng = rand::rng();

    // Precompute shared structures once
    let required_count = charsets.len();
    let charset_vecs: Vec<Vec<char>> = charsets.iter().map(|s| s.chars().collect()).collect();

    // Deterministic union in insertion order
    let union_capacity: usize = charsets.iter().map(|s| s.chars().count()).sum();
    let mut seen: HashSet<char> = HashSet::with_capacity(union_capacity);
    let mut combined_charset: Vec<char> = Vec::with_capacity(union_capacity);
    for s in charsets.iter() {
        for ch in s.chars() {
            if seen.insert(ch) {
                combined_charset.push(ch);
            }
        }
    }

    let mut outputs: Vec<String> = Vec::with_capacity(count);
    for _ in 0..count {
        // Ensure at least one char from each selected charset
        let mut chars: Vec<char> = Vec::with_capacity(usize::from(length));
        chars.extend(
            charset_vecs
                .iter()
                .map(|set| set[rng.random_range(0..set.len())]),
        );

        // Fill remaining positions from the union
        chars.extend(
            (required_count..usize::from(length))
                .map(|_| combined_charset[rng.random_range(0..combined_charset.len())]),
        );

        chars.shuffle(&mut rng);
        outputs.push(chars.into_iter().collect());
    }

    outputs
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
    custom_charset: Option<&str>,
) -> Vec<&str> {
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
    if let Some(custom) = custom_charset
        && !custom.is_empty()
    {
        charsets.push(custom);
    }
    charsets
}
