#[cfg(test)]
mod string_tests {
    mod capitalcase_tests {
        use strapd_core::string::to_capitalcase;

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
    }

    mod trim_tests {
        use strapd_core::string::trim;

        #[test]
        fn trim_left_only() {
            assert_eq!(trim("   hello  \t", true, false, false), "hello  \t");
            assert_eq!(trim("\n\nhello", true, false, false), "hello");
            assert_eq!(trim("\t\thello\t", true, false, false), "hello\t");
        }

        #[test]
        fn trim_right_only() {
            assert_eq!(trim("  hello   ", false, true, false), "  hello");
            assert_eq!(trim("hello\n\n", false, true, false), "hello");
            assert_eq!(trim("\thello\t\t", false, true, false), "\thello");
        }

        #[test]
        fn trim_default_both_sides() {
            assert_eq!(trim("  hello  ", false, false, false), "hello");
            assert_eq!(trim("\nhello\t", false, false, false), "hello");
            assert_eq!(
                trim("\t  hello world \n", false, false, false),
                "hello world"
            );
        }

        #[test]
        fn collapse_all_internal_whitespace() {
            // Each run collapses to its first character
            // "   " -> ' ', "\t\t" -> '\t', "\n\n " -> '\n'
            assert_eq!(trim("a   b\t\tc\n\n d", false, false, true), "a b\tc\nd");

            // Leading / trailing runs also collapse to their first char
            assert_eq!(trim("  x   y  ", false, false, true), "x y");
            assert_eq!(trim("\n\nx\t\t", false, false, true), "x");
        }

        #[test]
        fn empty_and_no_whitespace() {
            assert_eq!(trim("", false, false, false), "");
            assert_eq!(trim("", false, false, true), "");
            assert_eq!(trim("abc", false, false, false), "abc");
            assert_eq!(trim("abc", false, false, true), "abc");
        }

        #[test]
        fn precedence_when_multiple_flags_true() {
            // left takes precedence over right/all
            assert_eq!(trim("  hi  ", true, true, true), "hi  ");
            assert_eq!(trim("  hi  ", true, false, true), "hi  ");
            // right takes precedence over all
            assert_eq!(trim("  hi  ", false, true, true), "  hi");
        }

        #[test]
        fn collapse_preserves_whitespace_kind() {
            // Single-kind runs
            assert_eq!(trim("a   b", false, false, true), "a b");
            assert_eq!(trim("a\t\tb", false, false, true), "a\tb");
            assert_eq!(trim("a\n\nb", false, false, true), "a\nb");

            // Mixed-kind runs collapse to the *first* char in the run
            // "  \t\t" -> ' ' ; " \n\n " -> ' '
            assert_eq!(trim("a  \t\tb \n\n c", false, false, true), "a b c");

            // Leading/trailing mixed runs behave the same
            // "\n \t" -> '\n'
            assert_eq!(trim("\n \tx  \t", false, false, true), "x");
        }
    }
}
