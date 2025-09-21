use strapd_core::string::case::to_capitalcase;

#[test]
fn test_single_word() {
    assert_eq!(to_capitalcase("hello"), "Hello");
}

#[test]
fn test_multiple_words() {
    assert_eq!(to_capitalcase("hello world"), "Hello World");
}

#[test]
fn test_all_uppercase() {
    assert_eq!(to_capitalcase("HELLO WORLD"), "Hello World");
}

#[test]
fn test_with_newline() {
    assert_eq!(to_capitalcase("hello\nworld"), "Hello\nWorld");
}

#[test]
fn test_with_carriage_return() {
    assert_eq!(to_capitalcase("foo\rbar"), "Foo\rBar");
}

#[test]
fn test_mixed_case_input() {
    assert_eq!(to_capitalcase("ruSt lanGuage"), "Rust Language");
}

#[test]
fn test_empty_string() {
    assert_eq!(to_capitalcase(""), "");
}

#[test]
fn test_already_capitalized() {
    assert_eq!(to_capitalcase("Hello World"), "Hello World");
}

#[test]
fn test_with_multiple_spaces() {
    assert_eq!(to_capitalcase("hello   world"), "Hello   World");
}
