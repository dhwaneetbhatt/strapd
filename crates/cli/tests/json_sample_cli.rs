mod common;

use std::time::Duration;

use common::{assert_failure_contains, assert_success, strapd, strapd_with_open_stdin};
use serde_json::{Value, json};

#[test]
fn raw_mode_uses_positional_or_stdin_input() {
    let input = r#"{"keep":null,"rows":[null,[],1,2]}"#;
    let expected = b"{\"keep\":null,\"rows\":[1,2]}\n";

    assert_success(&strapd(&["json", "sample", input], None), expected);
    assert_success(
        &strapd(&["json", "sample"], Some(input.as_bytes())),
        expected,
    );
}

#[test]
fn positional_input_does_not_wait_for_open_stdin() {
    let result = strapd_with_open_stdin(
        &["json", "sample", r#"{"keep":null,"rows":[null,1]}"#],
        Duration::from_secs(1),
    );
    assert_success(&result, b"{\"keep\":null,\"rows\":[1]}\n");
}

#[test]
fn default_and_explicit_size_are_repeatable() {
    let input = "[1,2,3,4,5,6,7]";
    let default = strapd(&["json", "sample", input], None);
    let explicit = strapd(
        &["json", "sample", input, "--size", "3", "--seed", "0"],
        None,
    );
    assert_success(&default, &explicit.output.stdout);
    let values: Value = serde_json::from_slice(&default.output.stdout).unwrap();
    assert_eq!(values.as_array().unwrap().len(), 3);

    let smaller = strapd(&["json", "sample", input, "--size", "2"], None);
    let values: Value = serde_json::from_slice(&smaller.output.stdout).unwrap();
    assert_eq!(values.as_array().unwrap().len(), 2);
}

#[test]
fn json_response_keeps_typed_data_and_reports_nested_omissions() {
    let input = r#"{"orders":[{"items":[null,[],1,2,3,4,5]}],"preserved":null}"#;
    let result = strapd(&["json", "sample", input, "--output", "json"], None);
    assert!(result.output.status.success());
    assert!(result.output.stderr.is_empty());
    let response: Value = serde_json::from_slice(&result.output.stdout).unwrap();
    assert_eq!(response.as_object().unwrap().len(), 2);
    assert_eq!(response["data"]["preserved"], Value::Null);
    assert_eq!(
        response["data"]["orders"][0]["items"]
            .as_array()
            .unwrap()
            .len(),
        3
    );
    assert_eq!(
        response["metadata"],
        json!({
            "filtered": {"nulls": 1, "emptyArrays": 1},
            "sampling": {
                "omittedTotal": 2,
                "arrays": [{"path": "/orders/0/items", "omitted": 2}]
            }
        })
    );
}

#[test]
fn json_response_includes_zero_statistics() {
    let result = strapd(&["json", "sample", "false", "--output", "json"], None);
    let response: Value = serde_json::from_slice(&result.output.stdout).unwrap();
    assert_eq!(response["data"], false);
    assert_eq!(
        response["metadata"]["filtered"],
        json!({"nulls": 0, "emptyArrays": 0})
    );
    assert_eq!(response["metadata"]["sampling"]["omittedTotal"], 0);
    assert_eq!(response["metadata"]["sampling"]["arrays"], json!([]));
}

#[test]
fn invalid_input_and_options_fail_without_success_output() {
    assert_failure_contains(
        &strapd(&["json", "sample", "{bad}", "--output", "json"], None),
        "Invalid JSON input:",
    );
    assert_failure_contains(
        &strapd(&["json", "sample", "[]", "--size", "0"], None),
        "Sample size must be a positive integer",
    );
    assert_failure_contains(
        &strapd(&["json", "sample", "[]", "--output", "yaml"], None),
        "invalid value",
    );
    assert_failure_contains(
        &strapd(&["json", "sample", "[]", "--seed", "-1"], None),
        "unexpected argument",
    );
    assert_failure_contains(
        &strapd(&["json", "prune", "[]"], None),
        "unrecognized subcommand",
    );
    assert_failure_contains(
        &strapd(&["json", "beautify", "[]", "--output", "json"], None),
        "unexpected argument",
    );
}
