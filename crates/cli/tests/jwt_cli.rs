use std::{
    io::Write,
    process::{Command, Output, Stdio},
};

const KNOWN_HS256_TOKEN: &str = concat!(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.",
    "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.",
    "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
);

fn strapd(args: &[&str], stdin: Option<&str>) -> Output {
    let mut command = Command::new(env!("CARGO_BIN_EXE_strapd"));
    command
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if stdin.is_some() {
        command.stdin(Stdio::piped());
    } else {
        command.stdin(Stdio::null());
    }

    let mut child = command.spawn().unwrap();
    if let Some(input) = stdin {
        child
            .stdin
            .take()
            .unwrap()
            .write_all(input.as_bytes())
            .unwrap();
    }
    child.wait_with_output().unwrap()
}

fn stdout(output: &Output) -> &str {
    std::str::from_utf8(&output.stdout).unwrap().trim()
}

fn stderr(output: &Output) -> &str {
    std::str::from_utf8(&output.stderr).unwrap().trim()
}

#[test]
fn decode_outputs_only_header_and_payload_by_default() {
    let output = strapd(&["jwt", "decode", KNOWN_HS256_TOKEN], None);
    assert!(output.status.success(), "{}", stderr(&output));

    let decoded: serde_json::Value = serde_json::from_str(stdout(&output)).unwrap();
    assert_eq!(decoded["header"]["alg"], "HS256");
    assert_eq!(decoded["payload"]["sub"], "1234567890");
    assert!(decoded.get("analysis").is_none());
}

#[test]
fn decode_analysis_is_opt_in_with_forgiving_aliases() {
    for flag in ["--include-analysis", "--analyze", "--analyse"] {
        let output = strapd(&["jwt", "inspect", KNOWN_HS256_TOKEN, flag], None);
        assert!(output.status.success(), "{}", stderr(&output));
        let decoded: serde_json::Value = serde_json::from_str(stdout(&output)).unwrap();
        assert_eq!(decoded["analysis"]["expiration"]["status"], "NOT_PRESENT");
        assert_eq!(decoded["analysis"]["signature"]["status"], "UNVERIFIED");
    }
}

#[test]
fn header_and_payload_aliases_are_data_only() {
    let header = strapd(&["jwt", "meta", KNOWN_HS256_TOKEN], None);
    let payload = strapd(&["jwt", "body"], Some(KNOWN_HS256_TOKEN));
    assert!(header.status.success(), "{}", stderr(&header));
    assert!(payload.status.success(), "{}", stderr(&payload));

    let header: serde_json::Value = serde_json::from_str(stdout(&header)).unwrap();
    let payload: serde_json::Value = serde_json::from_str(stdout(&payload)).unwrap();
    assert_eq!(header["typ"], "JWT");
    assert_eq!(payload["name"], "John Doe");
}

#[test]
fn verifies_with_direct_and_environment_secrets() {
    let direct = strapd(
        &[
            "jwt",
            "check",
            KNOWN_HS256_TOKEN,
            "--secret",
            "your-256-bit-secret",
        ],
        None,
    );
    assert!(direct.status.success(), "{}", stderr(&direct));
    assert_eq!(
        stdout(&direct),
        "SUCCESS: Signature valid (Algorithm: HS256)"
    );

    let output = Command::new(env!("CARGO_BIN_EXE_strapd"))
        .args([
            "jwt",
            "verify",
            KNOWN_HS256_TOKEN,
            "--secret-env",
            "STRAPD_JWT_TEST_SECRET",
        ])
        .env("STRAPD_JWT_TEST_SECRET", "your-256-bit-secret")
        .output()
        .unwrap();
    assert!(output.status.success(), "{}", stderr(&output));
}

#[test]
fn verification_failure_uses_stderr_and_exit_one() {
    let output = strapd(
        &["jwt", "verify", KNOWN_HS256_TOKEN, "--secret", "wrong"],
        None,
    );
    assert_eq!(output.status.code(), Some(1));
    assert!(stdout(&output).is_empty());
    assert!(stderr(&output).contains("secret key mismatch"));
}

#[test]
fn signing_emits_only_a_compact_token() {
    let signed = strapd(
        &[
            "jwt",
            "create",
            r#"{"sub":"usr_123"}"#,
            "--secret",
            "dev-secret",
            "--algorithm",
            "HS512",
            "--exp",
            "3600",
        ],
        None,
    );
    assert!(signed.status.success(), "{}", stderr(&signed));
    assert_eq!(stdout(&signed).split('.').count(), 3);
    assert!(!stdout(&signed).contains("SUCCESS"));

    let verified = strapd(
        &["jwt", "verify", stdout(&signed), "--secret", "dev-secret"],
        None,
    );
    assert!(verified.status.success(), "{}", stderr(&verified));
    assert!(stdout(&verified).contains("HS512"));
}

#[test]
fn signing_reads_payload_from_stdin() {
    let output = strapd(
        &["jwt", "gen", "--secret", "dev-secret"],
        Some(r#"{"sub":"stdin"}"#),
    );
    assert!(output.status.success(), "{}", stderr(&output));
    assert_eq!(stdout(&output).split('.').count(), 3);
}

#[test]
fn clap_rejects_conflicting_or_missing_secret_sources() {
    let conflicting = strapd(
        &[
            "jwt",
            "verify",
            KNOWN_HS256_TOKEN,
            "--secret",
            "secret",
            "--secret-env",
            "JWT_SECRET",
        ],
        None,
    );
    assert!(!conflicting.status.success());
    assert!(stderr(&conflicting).contains("cannot be used with"));

    let missing = strapd(&["jwt", "verify", KNOWN_HS256_TOKEN], None);
    assert!(!missing.status.success());
    assert!(stderr(&missing).contains("required"));
}

#[test]
fn reports_missing_input_and_environment_variables() {
    let missing_input = strapd(&["jwt", "decode"], None);
    assert_eq!(missing_input.status.code(), Some(1));
    assert!(stderr(&missing_input).contains("Pass it as an argument or pipe it through stdin"));

    let missing_env = strapd(
        &[
            "jwt",
            "verify",
            KNOWN_HS256_TOKEN,
            "--secret-env",
            "STRAPD_JWT_MISSING_SECRET",
        ],
        None,
    );
    assert_eq!(missing_env.status.code(), Some(1));
    assert!(stderr(&missing_env).contains("STRAPD_JWT_MISSING_SECRET is not set"));
}

#[cfg(unix)]
#[test]
fn reports_non_unicode_environment_secret_without_echoing_it() {
    use std::os::unix::ffi::OsStringExt;

    let output = Command::new(env!("CARGO_BIN_EXE_strapd"))
        .args([
            "jwt",
            "verify",
            KNOWN_HS256_TOKEN,
            "--secret-env",
            "STRAPD_JWT_BINARY_SECRET",
        ])
        .env(
            "STRAPD_JWT_BINARY_SECRET",
            std::ffi::OsString::from_vec(vec![0xff, 0xfe]),
        )
        .output()
        .unwrap();
    assert_eq!(output.status.code(), Some(1));
    assert!(stderr(&output).contains("is not valid Unicode"));
}

#[test]
fn subcommand_help_contains_examples() {
    let output = strapd(&["jwt", "sign", "--help"], None);
    assert!(output.status.success());
    assert!(stdout(&output).contains("Examples:"));
    assert!(stdout(&output).contains("--secret-env JWT_SECRET"));
}
