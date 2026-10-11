mod common;

use std::time::Duration;

use common::{assert_failure_contains, assert_success, strapd, strapd_with_open_stdin};

#[test]
fn byte_encoding_preserves_exact_piped_bytes() {
    assert_success(
        &strapd(&["base64", "encode"], Some(&[0, 255, b'\n'])),
        b"AP8K\n",
    );
    assert_success(
        &strapd(&["hex", "encode"], Some(&[0, 255, b'\n'])),
        b"00ff0a\n",
    );
    assert_success(&strapd(&["base64", "encode"], Some(b"")), b"\n");
    assert_success(
        &strapd(&["base64", "encode", "argument"], Some(b"ignored stdin")),
        b"YXJndW1lbnQ=\n",
    );
}

#[test]
fn supplied_argument_does_not_wait_for_open_stdin() {
    let output = strapd_with_open_stdin(&["base64", "encode", "argument"], Duration::from_secs(2));
    assert_success(&output, b"YXJndW1lbnQ=\n");
}

#[test]
fn text_encoding_and_decoding_trim_piped_input_only() {
    assert_success(
        &strapd(&["url", "encode", "  hello  "], None),
        b"%20%20hello%20%20\n",
    );
    assert_success(
        &strapd(&["url", "encode"], Some(b"  hello  \n")),
        b"hello\n",
    );
    assert_success(&strapd(&["hex", "decode"], Some(b"  616263  \n")), b"abc\n");
    assert_failure_contains(
        &strapd(&["hex", "decode", "  616263  "], None),
        "Invalid hex input",
    );
}

#[test]
fn formats_and_strings_retain_piped_normalization() {
    assert_success(
        &strapd(&["json", "minify"], Some(b"  {\"b\":2,\"a\":1}  \n")),
        b"{\"b\":2,\"a\":1}\n",
    );
    assert_success(
        &strapd(&["string", "uppercase", "  hello  "], None),
        b"  HELLO  \n",
    );
    assert_success(
        &strapd(&["string", "uppercase"], Some(b"  hello  \n")),
        b"HELLO\n",
    );
    assert_success(
        &strapd(&["yaml", "convert", "--to", "json"], Some(b"  a: 1  \n")),
        b"{\"a\":1}\n",
    );
    assert_success(
        &strapd(&["xml", "minify"], Some(b"  <root> <a>1</a> </root>  \n")),
        b"<root><a>1</a></root>\n",
    );
    assert_success(
        &strapd(&["sql", "minify"], Some(b"  SELECT * FROM users;  \n")),
        b"SELECT *FROM users;\n",
    );
}

#[test]
fn security_retains_text_compatibility_before_binary_migration() {
    assert_success(
        &strapd(&["hash", "sha256"], Some(b"hello\n")),
        b"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824\n",
    );
    assert_success(
        &strapd(&["hmac", "sha256", "secret"], Some(b"hello\n")),
        b"88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b\n",
    );
    assert_success(
        &strapd(&["hash", "sha256"], Some(b"")),
        b"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n",
    );
}

#[test]
fn conversion_calculator_and_datetime_trim_piped_input() {
    assert_success(
        &strapd(&["convert", "mi"], Some(b"  10 km  \n")),
        b"6.21 mi\n",
    );
    assert_success(&strapd(&["calc"], Some(b"  1 + 2  \n")), b"3\n");
    assert_success(
        &strapd(&["time", "from"], Some(b"  0  \n")),
        b"1970-01-01 00:00:00 +00:00\n",
    );
}

#[test]
fn jwt_rejects_empty_normalized_input() {
    assert_failure_contains(
        &strapd(&["jwt", "decode"], Some(b"  \n")),
        "No JWT token provided",
    );
}

#[test]
fn invalid_encoded_and_structured_text_use_normal_error_paths() {
    assert_failure_contains(
        &strapd(&["base64", "decode"], Some(b"not base64!\n")),
        "Invalid base64 input",
    );
    assert_failure_contains(
        &strapd(&["json", "minify"], Some(b"")),
        "Invalid json input",
    );
}

#[test]
fn conversion_supports_each_source_combination_and_empty_input() {
    assert_success(
        &strapd(&["convert", "10", "km", "to", "mi"], None),
        b"6.21 mi\n",
    );
    assert_success(&strapd(&["convert"], Some(b"10 km to mi\n")), b"6.21 mi\n");
    assert_success(&strapd(&["convert", "mi"], Some(b"10 km\n")), b"6.21 mi\n");
    assert_failure_contains(&strapd(&["convert"], Some(b" \n")), "No input provided");
}

#[test]
fn datetime_invalid_number_is_fallible() {
    assert_failure_contains(
        &strapd(&["time", "from"], Some(b"not-a-number\n")),
        "Invalid timestamp 'not-a-number': expected a whole number",
    );
}

#[test]
fn clipboard_argument_path_completes_without_stdin() {
    let result = strapd(&["copy", "clipboard input"], None);
    assert!(result.elapsed.as_secs() < 5);
    // Headless CI may not provide a clipboard, so either successful copying or a
    // normal clipboard error is acceptable; an input wait or panic is not.
    if !result.output.status.success() {
        assert!(String::from_utf8_lossy(&result.output.stderr).contains("clipboard"));
    }
}

#[test]
fn clipboard_piped_path_completes_without_panicking() {
    let result = strapd(&["copy"], Some(b"  clipboard input  \n"));
    assert!(result.elapsed.as_secs() < 5);
    if !result.output.status.success() {
        assert!(String::from_utf8_lossy(&result.output.stderr).contains("clipboard"));
    }
}
