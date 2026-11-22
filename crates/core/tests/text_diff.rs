use strapd_core::string::diff::{DEFAULT_CONTEXT, LineKind, diff, unified, unified_into};

#[test]
fn captured_system_patches() {
    for (from, to, expected) in [
        (
            include_str!("fixtures/text_diff/replace.from"),
            include_str!("fixtures/text_diff/replace.to"),
            include_str!("fixtures/text_diff/replace.patch"),
        ),
        (
            include_str!("fixtures/text_diff/insert.from"),
            include_str!("fixtures/text_diff/insert.to"),
            include_str!("fixtures/text_diff/insert.patch"),
        ),
        (
            include_str!("fixtures/text_diff/newline.from"),
            include_str!("fixtures/text_diff/newline.to"),
            include_str!("fixtures/text_diff/newline.patch"),
        ),
        (
            include_str!("fixtures/text_diff/crlf.from"),
            include_str!("fixtures/text_diff/crlf.to"),
            include_str!("fixtures/text_diff/crlf.patch"),
        ),
    ] {
        let result = diff(from, to, DEFAULT_CONTEXT);
        assert_eq!(unified(&result, "a", "b"), expected);
        let mut output = Vec::new();
        unified_into(&result, "a", "b", &mut output).unwrap();
        assert_eq!(output, expected.as_bytes());
        assert_eq!(result, diff(from, to, DEFAULT_CONTEXT));
    }
}

#[test]
fn identical() {
    for text in ["", "a\n", "a", "你好\r\n"] {
        let result = diff(text, text, 3);
        assert!(result.hunks.is_empty());
        assert_eq!((result.added, result.removed), (0, 0));
        assert_eq!(unified(&result, "a", "b"), "");
    }
}

#[test]
fn empty_sides_and_missing_newline() {
    assert_eq!(
        unified(&diff("", "x\n", 3), "a", "b"),
        "--- a\n+++ b\n@@ -0,0 +1 @@\n+x\n"
    );
    assert_eq!(
        unified(&diff("x\n", "", 0), "a", "b"),
        "--- a\n+++ b\n@@ -1 +0,0 @@\n-x\n"
    );
    assert_eq!(
        unified(&diff("a\n", "a", 3), "a", "b"),
        "--- a\n+++ b\n@@ -1 +1 @@\n-a\n+a\n\\ No newline at end of file\n"
    );
    let result = diff("a\r\n", "a\n", 3);
    assert_eq!(result.hunks[0].lines[0].text, "a\r");
}

#[test]
fn common_suffix_must_start_on_a_line_boundary_on_both_sides() {
    let result = diff("a\n\n", "a\na\n", 0);
    assert_eq!((result.removed, result.added), (1, 1));
    assert_eq!(
        unified(&result, "a", "b"),
        "--- a\n+++ b\n@@ -2 +2 @@\n-\n+a\n"
    );
}

#[test]
fn context_grouping_ranges_and_numbers() {
    let from: String = (0..30).map(|i| format!("line {i}\n")).collect();
    let to = from
        .replace("line 5\n", "five\n")
        .replace("line 16\n", "sixteen\n");
    assert_eq!(diff(&from, &to, 3).hunks.len(), 2);
    assert_eq!(diff(&from, &to, 5).hunks.len(), 1);
    let full = diff(&from, &to, usize::MAX);
    assert_eq!(full.hunks.len(), 1);
    assert_eq!(full.hunks[0].from_start, 1);
    assert_eq!(full.hunks[0].from_count, 30);
    let zero = diff(&from, &to, 0);
    assert_eq!(zero.hunks.len(), 2);
    assert!(
        zero.hunks
            .iter()
            .flat_map(|h| &h.lines)
            .all(|l| l.kind != LineKind::Context)
    );
    assert_eq!(zero.hunks[0].lines[0].from_line, Some(6));
    assert_eq!(zero.hunks[1].lines[1].to_line, Some(17));
    assert_eq!(
        unified(&diff("a\nb\n", "a\nb\nc\n", 0), "a", "b"),
        "--- a\n+++ b\n@@ -2,0 +3 @@\n+c\n"
    );
}

#[test]
fn deep_line_numbers_and_borrowed_text() {
    let from = "unchanged line\n".repeat(150_000);
    let mut to = from.clone();
    let start = 149_999 * "unchanged line\n".len();
    to.replace_range(start.., "changed line\n");
    let result = diff(&from, &to, 3);
    let hunk = &result.hunks[0];
    assert_eq!(hunk.from_start, 149_997);
    assert_eq!(hunk.lines[3].from_line, Some(150_000));
    assert_eq!(hunk.lines[4].to_line, Some(150_000));
    assert!(std::ptr::eq(
        hunk.lines[3].text.as_ptr(),
        from[start..].as_ptr()
    ));
}

#[test]
fn emphasis_is_token_based_and_positionally_paired() {
    for (a, b, expected_a, expected_b) in [
        (
            "let timeout = 30;\n",
            "let timeout = 60;\n",
            vec!["30"],
            vec!["60"],
        ),
        ("abc value\n", "abd value\n", vec!["abc"], vec!["abd"]),
        (
            "你好 value = 30;\n",
            "你好 value = 60;\n",
            vec!["30"],
            vec!["60"],
        ),
        ("alpha beta gamma\n", "1234567\n", vec![], vec![]),
    ] {
        let result = diff(a, b, 3);
        let rows = &result.hunks[0].lines;
        assert_eq!(
            rows[0]
                .emphasis
                .iter()
                .map(|r| &rows[0].text[r.clone()])
                .collect::<Vec<_>>(),
            expected_a
        );
        assert_eq!(
            rows[1]
                .emphasis
                .iter()
                .map(|r| &rows[1].text[r.clone()])
                .collect::<Vec<_>>(),
            expected_b
        );
    }
    let result = diff("let value = 30;\n", "let value = 60;\nextra\n", 3);
    assert!(result.hunks[0].lines[2].emphasis.is_empty());
}

#[test]
fn emphasis_cap_and_long_line() {
    let common = "shared ".repeat(3_000);
    let old_middle = "a! ".repeat(1_000);
    let new_middle = "b? ".repeat(1_000);
    let from = format!("{common}{old_middle} end");
    let to = format!("{common}{new_middle} end");
    let result = diff(&from, &to, 3);
    assert_eq!(result.hunks[0].lines[0].emphasis.len(), 1);
    let prefix = r#"{"key":"value"},"#.repeat(100_000);
    let from = format!("{prefix}\"number\":12345,{prefix}");
    let to = format!("{prefix}\"number\":54321,{prefix}");
    let result = diff(&from, &to, 3);
    let line = &result.hunks[0].lines[0];
    assert_eq!(&line.text[line.emphasis[0].clone()], "12345");
}

#[test]
fn emphasis_compares_2_000_middle_tokens_but_not_2_001() {
    for count in [2_000, 2_001] {
        let shared_edge = ".".repeat(2_001);
        let shared_middle = ":".repeat(count - 2);
        let from = format!("{shared_edge}!{shared_middle}!;\r\n");
        let to = format!("{shared_edge}?{shared_middle}?;\r\n");
        let result = diff(&from, &to, 3);
        for line in &result.hunks[0].lines {
            let start = shared_edge.len();
            let end = start + count;
            let expected = if count == 2_000 {
                vec![start..start + 1, end - 1..end]
            } else {
                std::iter::once(start..end).collect()
            };
            assert_eq!(line.emphasis, expected);
        }
    }
}

#[test]
fn emphasis_requires_at_least_half_shared_content() {
    for (changed_len, paired) in [(9, true), (10, true), (11, false)] {
        let from = format!("{}{}", ".".repeat(10), "!".repeat(changed_len));
        let to = format!("{}{}", ".".repeat(10), "?".repeat(changed_len));
        let result = diff(&from, &to, 3);
        for line in &result.hunks[0].lines {
            if paired {
                assert_eq!(line.emphasis.len(), 1);
                assert_eq!(line.emphasis[0], 10..10 + changed_len);
            } else {
                assert!(line.emphasis.is_empty());
            }
        }
    }
}

#[test]
fn emphasis_excludes_crlf_but_keeps_a_literal_final_cr() {
    for (from, to) in [
        ("a\r\n", "a\n"),
        ("keep\na\r\n", "keep\na\n"),
        ("a\r\n", "a"),
    ] {
        let result = diff(from, to, 3);
        for line in &result.hunks[0].lines {
            assert!(line.emphasis.is_empty());
        }
    }

    for (from, to) in [
        ("timeout = 30\r\n", "timeout = 60\n"),
        ("timeout = 30\r\n", "timeout = 60\r\n"),
        ("timeout = 30\r", "timeout = 60\r"),
    ] {
        let result = diff(from, to, 3);
        for (line, (number, input)) in result.hunks[0].lines.iter().zip([("30", from), ("60", to)])
        {
            assert_eq!(line.emphasis.len(), 1);
            assert_eq!(&line.content()[line.emphasis[0].clone()], number);
            assert_eq!(line.text, input.trim_end_matches('\n'));
            assert_eq!(line.content().ends_with('\r'), !input.ends_with('\n'));
        }
    }
}

#[test]
fn differing_terminators_do_not_hide_a_long_common_content_suffix() {
    let suffix = ";".repeat(3_000);
    let from = format!("value = 30{suffix}\r\n");
    let to = format!("value = 60{suffix}\n");
    let result = diff(&from, &to, 3);
    for (line, number) in result.hunks[0].lines.iter().zip(["30", "60"]) {
        assert_eq!(line.emphasis.len(), 1);
        assert_eq!(&line.content()[line.emphasis[0].clone()], number);
    }
}

#[test]
fn streaming_propagates_writer_failure() {
    struct Fail;
    impl std::io::Write for Fail {
        fn write(&mut self, _: &[u8]) -> std::io::Result<usize> {
            Err(std::io::Error::other("write failed"))
        }
        fn flush(&mut self) -> std::io::Result<()> {
            Ok(())
        }
    }
    assert!(unified_into(&diff("a", "b", 3), "a", "b", &mut Fail).is_err());
}
