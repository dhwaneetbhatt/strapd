mod common;

use std::time::Duration;

use common::{assert_failure_contains, assert_success, strapd, strapd_with_open_stdin};
use serde_json::{Value, json};

#[test]
fn raw_mode_uses_positional_or_stdin_input() {
    let input = r#"{"keep":1,"null":null,"nested":{"empty":""}}"#;
    let expected = b"{\"keep\":1}\n";

    assert_success(&strapd(&["json", "prune", input], None), expected);
    assert_success(
        &strapd(&["json", "prune"], Some(input.as_bytes())),
        expected,
    );
}

#[test]
fn positional_input_does_not_wait_for_open_stdin() {
    let result = strapd_with_open_stdin(
        &["json", "prune", r#"{"keep":1,"empty":null}"#],
        Duration::from_secs(1),
    );
    assert_success(&result, b"{\"keep\":1}\n");
}

#[test]
fn sample_defaults_to_three_and_sample_size_overrides_it() {
    let input = "[1,2,3,4,5,6,7]";
    assert_success(
        &strapd(&["json", "prune", input, "--sample"], None),
        b"[1,2,3,7]\n",
    );
    assert_success(
        &strapd(&["json", "prune", input, "--sample-size", "2"], None),
        b"[1,2,7]\n",
    );
}

#[test]
fn drops_named_keys_at_every_depth() {
    let input = r#"{"debug":1,"nested":{"debug":2,"keep":3},"items":[{"debug":4,"keep":5}]}"#;
    assert_success(
        &strapd(&["json", "prune", input, "--drop-keys", "debug"], None),
        b"{\"nested\":{\"keep\":3},\"items\":[{\"keep\":5}]}\n",
    );
}

#[test]
fn json_response_keeps_typed_data_and_reports_nested_omissions() {
    let input = r#"{"orders":[{"items":[1,2,3,4,5,6,7]}],"discard":null}"#;
    let result = strapd(
        &["json", "prune", input, "--sample", "--output", "json"],
        None,
    );
    assert!(result.output.status.success());
    assert!(result.output.stderr.is_empty());
    let response: Value = serde_json::from_slice(&result.output.stdout).unwrap();
    assert_eq!(response.as_object().unwrap().len(), 2);
    assert_eq!(
        response["data"],
        json!({"orders": [{"items": [1, 2, 3, 7]}]})
    );
    assert_eq!(
        response["metadata"],
        json!({
            "pruned": {
                "nulls": 1,
                "emptyStrings": 0,
                "emptyObjects": 0,
                "emptyArrays": 0,
                "droppedKeys": 0
            },
            "sampling": {
                "omittedTotal": 3,
                "arrays": [{"path": "/orders/0/items", "omitted": 3}]
            }
        })
    );
}

#[test]
fn json_response_includes_zero_statistics() {
    let result = strapd(&["json", "prune", "false", "--output", "json"], None);
    let response: Value = serde_json::from_slice(&result.output.stdout).unwrap();
    assert_eq!(response["data"], false);
    assert_eq!(response["metadata"]["pruned"]["nulls"], 0);
    assert_eq!(response["metadata"]["sampling"]["omittedTotal"], 0);
    assert_eq!(response["metadata"]["sampling"]["arrays"], json!([]));
}

#[test]
fn invalid_input_and_options_fail_without_success_output() {
    assert_failure_contains(
        &strapd(&["json", "prune", "{bad}", "--output", "json"], None),
        "Invalid JSON input:",
    );
    assert_failure_contains(
        &strapd(&["json", "prune", "[]", "--sample-size", "0"], None),
        "Sample size must be a positive integer",
    );
    assert_failure_contains(
        &strapd(&["json", "prune", "[]", "--output", "yaml"], None),
        "invalid value",
    );
    assert_failure_contains(
        &strapd(&["json", "beautify", "[]", "--output", "json"], None),
        "unexpected argument",
    );
}
