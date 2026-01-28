use strapd_core::string::analysis;

// Count Lines Tests
#[test]
fn test_count_lines_empty() {
    assert_eq!(analysis::count_lines(""), 0);
}

#[test]
fn test_count_lines_single() {
    assert_eq!(analysis::count_lines("hello"), 1);
}

#[test]
fn test_count_lines_multiple() {
    assert_eq!(analysis::count_lines("line1\nline2\nline3"), 3);
}

#[test]
fn test_count_lines_with_empty_lines() {
    assert_eq!(analysis::count_lines("line1\n\nline3"), 3);
}

#[test]
fn test_count_lines_trailing_newline() {
    assert_eq!(analysis::count_lines("line1\nline2\n"), 2);
}

// Count Words Tests
#[test]
fn test_count_words_empty() {
    assert_eq!(analysis::count_words(""), 0);
}

#[test]
fn test_count_words_single() {
    assert_eq!(analysis::count_words("hello"), 1);
}

#[test]
fn test_count_words_multiple() {
    assert_eq!(analysis::count_words("hello world test"), 3);
}

#[test]
fn test_count_words_extra_spaces() {
    assert_eq!(analysis::count_words("hello  world   test"), 3);
}

#[test]
fn test_count_words_tabs_and_newlines() {
    assert_eq!(analysis::count_words("hello\tworld\ntest"), 3);
}

#[test]
fn test_count_words_mixed_whitespace() {
    assert_eq!(analysis::count_words("  hello  \n\tworld  "), 2);
}

// Count Chars Tests
#[test]
fn test_count_chars_empty() {
    assert_eq!(analysis::count_chars(""), 0);
}

#[test]
fn test_count_chars_simple() {
    assert_eq!(analysis::count_chars("hello"), 5);
}

#[test]
fn test_count_chars_with_spaces() {
    assert_eq!(analysis::count_chars("hello world"), 11);
}

#[test]
fn test_count_chars_unicode() {
    assert_eq!(analysis::count_chars("Hello 世界"), 8);
}

#[test]
fn test_count_chars_emoji() {
    assert_eq!(analysis::count_chars("Hello 🚀"), 7);
}

#[test]
fn test_count_chars_newlines() {
    assert_eq!(analysis::count_chars("line1\nline2"), 11);
}

// Count Bytes Tests
#[test]
fn test_count_bytes_empty() {
    assert_eq!(analysis::count_bytes(""), 0);
}

#[test]
fn test_count_bytes_simple() {
    assert_eq!(analysis::count_bytes("hello"), 5);
}

#[test]
fn test_count_bytes_with_spaces() {
    assert_eq!(analysis::count_bytes("hello world"), 11);
}

#[test]
fn test_count_bytes_unicode() {
    // Each Chinese character is 3 bytes in UTF-8
    assert_eq!(analysis::count_bytes("世界"), 6);
}

#[test]
fn test_count_bytes_emoji() {
    // Emoji can be 4 bytes
    let bytes = analysis::count_bytes("🚀");
    assert!(bytes >= 4);
}

#[test]
fn test_count_bytes_vs_chars() {
    let text = "Hello 世界";
    let chars = analysis::count_chars(text);
    let bytes = analysis::count_bytes(text);
    assert!(bytes > chars); // Unicode takes more bytes
}

// Word Frequency Tests
#[test]
fn test_word_frequency_empty() {
    let result = analysis::word_frequency("");
    assert_eq!(result.len(), 0);
}

#[test]
fn test_word_frequency_single() {
    let result = analysis::word_frequency("hello");
    assert_eq!(result.len(), 1);
    assert_eq!(result.get("hello"), Some(&1));
}

#[test]
fn test_word_frequency_multiple_unique() {
    let result = analysis::word_frequency("hello world test");
    assert_eq!(result.len(), 3);
    assert_eq!(result.get("hello"), Some(&1));
    assert_eq!(result.get("world"), Some(&1));
    assert_eq!(result.get("test"), Some(&1));
}

#[test]
fn test_word_frequency_repeated() {
    let result = analysis::word_frequency("hello world hello");
    assert_eq!(result.len(), 2);
    assert_eq!(result.get("hello"), Some(&2));
    assert_eq!(result.get("world"), Some(&1));
}

#[test]
fn test_word_frequency_case_sensitive() {
    let result = analysis::word_frequency("Hello hello HELLO");
    assert_eq!(result.len(), 3);
    assert_eq!(result.get("Hello"), Some(&1));
    assert_eq!(result.get("hello"), Some(&1));
    assert_eq!(result.get("HELLO"), Some(&1));
}

#[test]
fn test_word_frequency_with_newlines() {
    let result = analysis::word_frequency("hello\nworld\nhello");
    assert_eq!(result.len(), 2);
    assert_eq!(result.get("hello"), Some(&2));
    assert_eq!(result.get("world"), Some(&1));
}

// Char Frequency Tests
#[test]
fn test_char_frequency_empty() {
    let result = analysis::char_frequency("");
    assert_eq!(result.len(), 0);
}

#[test]
fn test_char_frequency_single() {
    let result = analysis::char_frequency("a");
    assert_eq!(result.len(), 1);
    assert_eq!(result.get(&'a'), Some(&1));
}

#[test]
fn test_char_frequency_multiple_unique() {
    let result = analysis::char_frequency("abc");
    assert_eq!(result.len(), 3);
    assert_eq!(result.get(&'a'), Some(&1));
    assert_eq!(result.get(&'b'), Some(&1));
    assert_eq!(result.get(&'c'), Some(&1));
}

#[test]
fn test_char_frequency_repeated() {
    let result = analysis::char_frequency("hello");
    assert_eq!(result.len(), 4);
    assert_eq!(result.get(&'h'), Some(&1));
    assert_eq!(result.get(&'e'), Some(&1));
    assert_eq!(result.get(&'l'), Some(&2));
    assert_eq!(result.get(&'o'), Some(&1));
}

#[test]
fn test_char_frequency_with_spaces() {
    let result = analysis::char_frequency("a b c");
    assert_eq!(result.len(), 4);
    assert_eq!(result.get(&'a'), Some(&1));
    assert_eq!(result.get(&' '), Some(&2));
}

#[test]
fn test_char_frequency_unicode() {
    let result = analysis::char_frequency("世界世");
    assert_eq!(result.len(), 2);
    assert_eq!(result.get(&'世'), Some(&2));
    assert_eq!(result.get(&'界'), Some(&1));
}

#[test]
fn test_char_frequency_case_sensitive() {
    let result = analysis::char_frequency("AaA");
    assert_eq!(result.len(), 2);
    assert_eq!(result.get(&'A'), Some(&2));
    assert_eq!(result.get(&'a'), Some(&1));
}

// Edge Cases
#[test]
fn test_count_lines_only_newlines() {
    assert_eq!(analysis::count_lines("\n\n\n"), 3);
}

#[test]
fn test_count_words_only_whitespace() {
    assert_eq!(analysis::count_words("   \t\n   "), 0);
}

#[test]
fn test_all_functions_with_long_text() {
    let text = "hello ".repeat(1000);
    assert_eq!(analysis::count_words(&text), 1000);
    assert!(analysis::count_chars(&text) > 5000);
    assert!(analysis::count_bytes(&text) > 5000);

    let word_freq = analysis::word_frequency(&text);
    assert_eq!(word_freq.get("hello"), Some(&1000));
}
