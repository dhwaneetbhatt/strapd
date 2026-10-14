mod common;
use common::{assert_failure_contains, assert_success, strapd, strapd_with_open_stdin};
use std::time::Duration;

#[test]
fn categories_modes_and_exact_input() {
    for (flag, value, mask, pseudonym) in [
        (
            "--ip-addresses",
            "::1",
            "[REDACTED_IP_ADDRESS]",
            "[IP_ADDRESS_1]",
        ),
        (
            "--emails",
            "alice@example.com",
            "[REDACTED_EMAIL]",
            "[EMAIL_1]",
        ),
        (
            "--phone-numbers",
            "+919876543210",
            "[REDACTED_PHONE_NUMBER]",
            "[PHONE_NUMBER_1]",
        ),
        (
            "--payment-cards",
            "4111111111111111",
            "[REDACTED_PAYMENT_CARD]",
            "[PAYMENT_CARD_1]",
        ),
        (
            "--aadhaar",
            "234567890124",
            "[REDACTED_AADHAAR]",
            "[AADHAAR_1]",
        ),
        ("--pan", "ABCPD1234E", "[REDACTED_PAN]", "[PAN_1]"),
    ] {
        let input = format!(" भारत\t{value}\r\n");
        assert_success(
            &strapd(&["sanitize", "pii", flag], Some(input.as_bytes())),
            format!(" भारत\t{mask}\r\n\n").as_bytes(),
        );
        assert_success(
            &strapd(&["sanitize", "pii", flag, "-p", &input], None),
            format!(" भारत\t{pseudonym}\r\n\n").as_bytes(),
        );
    }
    let input = "alice@example.com ABCPD1234E";
    for flags in [vec![], vec!["--all"]] {
        let mut args = vec!["sanitize", "pii"];
        args.extend(flags);
        args.push(input);
        assert_success(&strapd(&args, None), b"[REDACTED_EMAIL] [REDACTED_PAN]\n");
    }
    assert_success(
        &strapd(
            &["sanitize", "pii", "--aadhaar", "--pan", "-p", input],
            None,
        ),
        b"alice@example.com [PAN_1]\n",
    );
}

#[test]
fn positional_precedence_empty_markers_and_safe_errors() {
    assert_success(
        &strapd_with_open_stdin(&["sanitize", "pii", ""], Duration::from_secs(2)),
        b"\n",
    );
    assert_success(
        &strapd(
            &["sanitize", "pii", "Error: ordinary text"],
            Some(b"alice@example.com"),
        ),
        b"Error: ordinary text\n",
    );
    assert_success(&strapd(&["sanitize", "pii"], Some(b"")), b"\n");
    assert_success(
        &strapd(&["sanitize", "pii", "-p", "[EMAIL_1] [REDACTED_PAN]"], None),
        b"[EMAIL_1] [REDACTED_PAN]\n",
    );
    let error = strapd(&["sanitize", "pii", "--all", "--pan", "ABCPD1234E"], None);
    assert_failure_contains(&error, "cannot be used with");
    assert!(!String::from_utf8_lossy(&error.output.stderr).contains("ABCPD1234E"));
}

#[test]
fn help_keeps_usage_concise_and_links_to_details() {
    let result = strapd(&["sanitize", "pii", "--help"], None);
    assert!(result.output.status.success());
    let help = String::from_utf8_lossy(&result.output.stdout);
    for text in [
        "default: all",
        "Pass TEXT or pipe stdin",
        "docs/usage.md",
        "consistent within this run",
        "--pseudonymize",
        "--aadhaar",
        "--pan",
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
fn email_possessives_and_local_apostrophes_work_in_both_input_forms() {
    let input = "alice@example.com's record; alice@EXAMPLE.com’s; o'connor@example.com";
    assert_success(
        &strapd(&["sanitize", "pii", "--emails"], Some(input.as_bytes())),
        "[REDACTED_EMAIL]'s record; [REDACTED_EMAIL]’s; [REDACTED_EMAIL]\n".as_bytes(),
    );
    assert_success(
        &strapd(&["sanitize", "pii", "--emails", "-p", input], None),
        "[EMAIL_1]'s record; [EMAIL_1]’s; [EMAIL_2]\n".as_bytes(),
    );
}
