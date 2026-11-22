use super::text_diff;
use serde_json::{Value, json};

#[test]
fn structured_segments_exclude_crlf_and_preserve_empty_lines() {
    let from = "\r\nlet timeout = 30\r\nkeep\r\n";
    let to = "\r\nlet timeout = 60\nkeep\r\n";
    let result: Value = serde_json::from_str(&text_diff(from, to, 3)).unwrap();
    let lines = result["hunks"][0]["lines"].as_array().unwrap();
    let segments: Vec<_> = lines.iter().map(|line| line["segments"].clone()).collect();
    let segment = |text: &str, emphasized| json!({"text": text, "emphasized": emphasized});
    assert_eq!(
        segments,
        [
            json!([segment("", false)]),
            json!([segment("let timeout = ", false), segment("30", true)]),
            json!([segment("let timeout = ", false), segment("60", true)]),
            json!([segment("keep", false)]),
        ]
    );
}

#[test]
fn a_localized_edit_in_10_mb_returns_only_the_hunk() {
    let line = format!("{}\n", "x".repeat(49));
    let from = line.repeat(200_000);
    let mut to = from.clone();
    // Two preceding lines and three following lines give seven rows including the replacement.
    to.replace_range(100..101, "y");
    let result: Value = serde_json::from_str(&text_diff(&from, &to, 3)).unwrap();
    let hunks = result["hunks"].as_array().unwrap();
    assert_eq!(hunks.len(), 1);
    let lines = hunks[0]["lines"].as_array().unwrap();
    assert_eq!(lines.len(), 7);
    assert_eq!(
        (result["removed"].as_u64(), result["added"].as_u64()),
        (Some(1), Some(1))
    );
}
