mod common;

use common::{assert_failure_contains, assert_success, strapd, strapd_with_open_stdin};
use std::time::Duration;

#[test]
fn help_keeps_usage_concise_and_links_to_details() {
    let result = strapd(&["sanitize", "secrets", "--help"], None);
    assert!(result.output.status.success());
    let help = String::from_utf8_lossy(&result.output.stdout);
    for text in [
        "default: all",
        "Pass TEXT or pipe stdin",
        "docs/sanitize-secrets.md",
        "--api-keys",
        "--passwords",
        "--tokens",
    ] {
        assert!(help.contains(text), "missing {text} in {help}");
    }
    let description = help.split("Usage:").next().unwrap();
    assert!(
        description.split_whitespace().count() <= 30,
        "{description}"
    );
}

#[test]
fn default_and_explicit_all_select_the_same_categories() {
    let input = "apiKey=xy; password=short\nAuthorization: Bearer opaque\nCookie: sid=secret";
    let default = strapd(&["sanitize", "secrets", input], None);
    let explicit_all = strapd(&["sanitize", "secrets", "--all", input], None);
    assert_success(
        &default,
        b"apiKey=[REDACTED_API_KEY]; password=[REDACTED_PASSWORD]\nAuthorization: Bearer [REDACTED_AUTH]\nCookie: sid=[REDACTED_COOKIE]\n",
    );
    assert_eq!(default.output.stdout, explicit_all.output.stdout);
}

#[test]
fn scoped_application_properties_are_redacted_through_stdin() {
    let input = b"accessKey=synthetic-access\r\nappSecret=synthetic-app\r\nwebhookSecret=synthetic-webhook\r\nstorage.secret=synthetic-storage\r\nkeyVersion=1\r\n";
    assert_success(
        &strapd(&["sanitize", "secrets"], Some(input)),
        b"accessKey=[REDACTED_API_KEY]\r\nappSecret=[REDACTED_TOKEN]\r\nwebhookSecret=[REDACTED_CRYPTO_KEY]\r\nstorage.secret=[REDACTED_TOKEN]\r\nkeyVersion=1\r\n\n",
    );
    assert_success(
        &strapd(&["sanitize", "secrets", "--api-keys"], Some(input)),
        b"accessKey=[REDACTED_API_KEY]\r\nappSecret=synthetic-app\r\nwebhookSecret=synthetic-webhook\r\nstorage.secret=synthetic-storage\r\nkeyVersion=1\r\n\n",
    );
}

#[test]
fn each_flag_and_flag_union_only_enable_selected_categories() {
    let input = "apiKey=xy; password=short; access_token=tok\nAuthorization: Bearer opaque\nCookie: sid=secret";

    assert_success(
        &strapd(&["sanitize", "secrets", "--api-keys", input], None),
        b"apiKey=[REDACTED_API_KEY]; password=short; access_token=tok\nAuthorization: Bearer opaque\nCookie: sid=secret\n",
    );
    assert_success(
        &strapd(&["sanitize", "secrets", "--passwords", "--tokens", input], None),
        b"apiKey=xy; password=[REDACTED_PASSWORD]; access_token=[REDACTED_TOKEN]\nAuthorization: Bearer opaque\nCookie: sid=secret\n",
    );
    assert_success(
        &strapd(&["sanitize", "secrets", "--auth", "--cookies", input], None),
        b"apiKey=xy; password=short; access_token=tok\nAuthorization: Bearer [REDACTED_AUTH]\nCookie: sid=[REDACTED_COOKIE]\n",
    );
}

#[test]
fn all_category_flags_are_accepted_independently() {
    let cases = [
        ("--api-keys", "apiKey=xy", "apiKey=[REDACTED_API_KEY]"),
        (
            "--auth",
            "Authorization: Bearer opaque",
            "Authorization: Bearer [REDACTED_AUTH]",
        ),
        (
            "--cookies",
            "Cookie: sid=value",
            "Cookie: sid=[REDACTED_COOKIE]",
        ),
        (
            "--databases",
            "postgres://user:pass@db/app",
            "postgres://[REDACTED_DATABASE]:[REDACTED_DATABASE]@db/app",
        ),
        (
            "--crypto-keys",
            "-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----",
            "[REDACTED_CRYPTO_KEY]",
        ),
        ("--passwords", "password=x", "password=[REDACTED_PASSWORD]"),
        (
            "--tokens",
            "access_token=x",
            "access_token=[REDACTED_TOKEN]",
        ),
        (
            "--signed-urls",
            "https://s3.example/a?X-Amz-Signature=x",
            "https://s3.example/a?X-Amz-Signature=[REDACTED_SIGNED_URL]",
        ),
    ];

    for (flag, input, expected) in cases {
        let output = if input.starts_with('-') {
            strapd(&["sanitize", "secrets", flag, "--", input], None)
        } else {
            strapd(&["sanitize", "secrets", flag, input], None)
        };
        assert_success(&output, format!("{expected}\n").as_bytes());
    }
}

#[test]
fn sanitize_and_redact_aliases_have_identical_behavior() {
    let input = "apiKey=xy";
    let expected = b"apiKey=[REDACTED_API_KEY]\n";
    for args in [
        vec!["sanitize", "secrets", input],
        vec!["redact", "secrets", input],
        vec!["sanitize", "redact", input],
    ] {
        assert_success(&strapd(&args, None), expected);
    }
}

#[test]
fn positional_input_preserves_whitespace_and_does_not_wait_for_stdin() {
    let input = "  password=short  \r\n";
    assert_success(
        &strapd(&["sanitize", "secrets", input], None),
        b"  password=[REDACTED_PASSWORD]  \r\n\n",
    );

    let open_stdin = strapd_with_open_stdin(
        &["sanitize", "secrets", "apiKey=xy"],
        Duration::from_secs(2),
    );
    assert_success(&open_stdin, b"apiKey=[REDACTED_API_KEY]\n");

    let empty_argument =
        strapd_with_open_stdin(&["sanitize", "secrets", ""], Duration::from_secs(2));
    assert_success(&empty_argument, b"\n");
}

#[test]
fn stdin_preserves_content_and_adds_only_the_normal_final_newline() {
    assert_success(&strapd(&["sanitize", "secrets", ""], None), b"\n");
    assert_success(
        &strapd(&["sanitize", "secrets", "--passwords"], Some(b"")),
        b"\n",
    );
    assert_success(
        &strapd(
            &["sanitize", "secrets", "--passwords"],
            Some(b"  password=x  "),
        ),
        b"  password=[REDACTED_PASSWORD]  \n",
    );
    assert_success(
        &strapd(
            &["sanitize", "secrets", "--passwords"],
            Some(b"password=x\n"),
        ),
        b"password=[REDACTED_PASSWORD]\n\n",
    );
}

#[test]
fn conflicting_selection_and_missing_input_fail_without_echoing_secret_text() {
    let secret = "do-not-repeat-this-input";
    let conflict = strapd(
        &["sanitize", "secrets", "--all", "--api-keys", secret],
        None,
    );
    assert_failure_contains(&conflict, "--all");
    assert!(!String::from_utf8_lossy(&conflict.output.stderr).contains(secret));

    assert_success(&strapd(&["sanitize", "secrets"], Some(b"")), b"\n");
}

#[cfg(target_os = "linux")]
#[test]
fn missing_terminal_input_shows_guidance_without_echoing_text() {
    use std::process::Command;

    use common::command_with_timeout;

    let command_line = format!("{} sanitize secrets", env!("CARGO_BIN_EXE_strapd"));
    let result = command_with_timeout(
        Command::new("script").args(["-qefc", &command_line, "/dev/null"]),
        None,
        Duration::from_secs(2),
    );

    assert!(!result.output.status.success());
    let terminal_output = String::from_utf8_lossy(&result.output.stdout);
    assert!(terminal_output.contains("provided"), "{terminal_output}");
    assert!(
        terminal_output.contains("Pass it as an argument or pipe it through stdin"),
        "{terminal_output}"
    );
}
