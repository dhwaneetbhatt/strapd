mod common;

use common::{assert_success, strapd};

#[test]
fn hash_accepts_empty_nul_and_non_utf8_stdin() {
    assert_success(
        &strapd(&["hash", "sha256"], Some(b"")),
        b"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n",
    );
    assert_success(
        &strapd(&["hash", "sha256"], Some(&[0, 0xff, 0])),
        b"2c8d07cd986f58eb210bd800133d6645c7340c59865377c8ea431cebca0b3113\n",
    );
}

#[test]
fn hmac_accepts_nul_and_non_utf8_stdin() {
    assert_success(
        &strapd(&["hmac", "sha256", "secret"], Some(&[0, 0xff, 0])),
        b"2c2e61ad657d7a5553596977af19840293eaf75b0091774fbaf472af6f5b5684\n",
    );
}

#[test]
fn shell_line_endings_remain_normalized_for_security_commands() {
    let digest = b"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824\n";
    assert_success(&strapd(&["hash", "sha256"], Some(b"hello\n")), digest);
    assert_success(&strapd(&["hash", "sha256", "hello"], None), digest);
}
