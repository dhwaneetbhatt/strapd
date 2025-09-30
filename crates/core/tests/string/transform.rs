use strapd_core::string::transform::slugify;

#[test]
fn trims_ends_and_lowercases() {
    assert_eq!(slugify("   Hello  ", '-'), "hello");
    assert_eq!(slugify("\n\t Hello World \t\n", '-'), "hello-world");
}

#[test]
fn collapses_whitespace_runs_to_single_separator() {
    assert_eq!(slugify("a   b", '-'), "a-b");
    assert_eq!(slugify("a\t\n b", '-'), "a-b");
    assert_eq!(slugify("  x   y   z  ", '-'), "x-y-z");
}

#[test]
fn strips_non_alphanumeric_and_may_emit_leading_separator() {
    assert_eq!(slugify("!@# wow @!#", '-'), "-wow");
    assert_eq!(slugify("---wow---", '-'), "wow");
    assert_eq!(slugify("Hello, World!", '-'), "hello-world");
    assert_eq!(slugify("email@example.com", '-'), "emailexamplecom");
}

#[test]
fn preserves_unicode_letters_and_digits_only() {
    assert_eq!(slugify("Ångström Σ", '-'), "ångström-σ");
    assert_eq!(slugify("İstanbul", '-'), "istanbul");
    assert_eq!(slugify("東京 Rust 2025", '-'), "東京-rust-2025");
}

#[test]
fn custom_separator() {
    assert_eq!(slugify("Hello World", '_'), "hello_world");
    assert_eq!(slugify("a\t b", '_'), "a_b");
}

#[test]
fn empty_and_whitespace_only() {
    assert_eq!(slugify("", '-'), "");
    assert_eq!(slugify("   \n\t   ", '-'), "");
}

#[test]
fn no_trailing_separator_after_trailing_whitespace() {
    assert_eq!(slugify("hello   ", '-'), "hello");
    assert_eq!(slugify("hello\t\n", '-'), "hello");
}
