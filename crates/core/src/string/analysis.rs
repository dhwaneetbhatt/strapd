use std::collections::HashMap;

pub fn count_lines(input: &str) -> usize {
    input.lines().count()
}

pub fn count_words(input: &str) -> usize {
    input.split_ascii_whitespace().count()
}

pub fn count_chars(input: &str) -> usize {
    input.chars().count()
}

pub fn count_bytes(input: &str) -> usize {
    input.len()
}

pub fn word_frequency(input: &str) -> HashMap<String, usize> {
    input
        .split_ascii_whitespace()
        .fold(HashMap::new(), |mut freq, word| {
            *freq.entry(word.to_string()).or_insert(0) += 1;
            freq
        })
}

pub fn char_frequency(input: &str) -> HashMap<char, usize> {
    input.chars().fold(HashMap::new(), |mut freq, c| {
        *freq.entry(c).or_insert(0) += 1;
        freq
    })
}
