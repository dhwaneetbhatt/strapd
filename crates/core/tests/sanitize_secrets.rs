use std::borrow::Cow;

use strapd_core::sanitize::{self, Categories, Category};

const API_KEY: &str = "[REDACTED_API_KEY]";
const AUTH: &str = "[REDACTED_AUTH]";
const COOKIE: &str = "[REDACTED_COOKIE]";
const DATABASE: &str = "[REDACTED_DATABASE]";
const CRYPTO_KEY: &str = "[REDACTED_CRYPTO_KEY]";
const PASSWORD: &str = "[REDACTED_PASSWORD]";
const TOKEN: &str = "[REDACTED_TOKEN]";
const SIGNED_URL: &str = "[REDACTED_SIGNED_URL]";

#[test]
fn scoped_application_credentials_select_only_their_declared_category() {
    let cases = [
        ("app.media.accessKey", Category::ApiKeys, API_KEY),
        ("app.storage.access_key", Category::ApiKeys, API_KEY),
        ("APP_ACCESS_KEY", Category::ApiKeys, API_KEY),
        ("app.media.appSecret", Category::Tokens, TOKEN),
        ("app.storage.secret", Category::Tokens, TOKEN),
        ("APP_SECRET", Category::Tokens, TOKEN),
        ("app.media.webhookSecret", Category::CryptoKeys, CRYPTO_KEY),
        ("WEBHOOK_SECRET", Category::CryptoKeys, CRYPTO_KEY),
        ("app.webhook-secret", Category::CryptoKeys, CRYPTO_KEY),
        ("app.signingSecret", Category::CryptoKeys, CRYPTO_KEY),
        ("AWS_SECRET_ACCESS_KEY", Category::ApiKeys, API_KEY),
        ("secretaccesskey", Category::ApiKeys, API_KEY),
        ("SECRETACCESSKEY", Category::ApiKeys, API_KEY),
        ("oauth.clientSecret", Category::Tokens, TOKEN),
        ("clientsecret", Category::Tokens, TOKEN),
        ("CLIENTSECRET", Category::Tokens, TOKEN),
        ("oauth.clientsecret", Category::Tokens, TOKEN),
    ];
    for (label, category, placeholder) in cases {
        let input = format!("{label}=synthetic-value\r\n");
        let expected = format!("{label}={placeholder}\r\n");
        assert_eq!(sanitize::secrets(&input, Categories::ALL), expected);
        assert_eq!(
            sanitize::secrets(&input, Categories::only(category)),
            expected
        );
        assert_eq!(sanitize::secrets(&expected, Categories::ALL), expected);
        let disabled = Categories::from_bits(Categories::ALL.bits() & !(category as u8));
        assert_eq!(sanitize::secrets(&input, disabled), input);
    }
}

#[test]
fn scoped_credential_metadata_and_innocent_substrings_remain_visible() {
    let input = concat!(
        "app.storage.secret_name=setting\n",
        "app.storage.accessKeyVersion=1\n",
        "app.webhookSecretId=identifier\n",
        "app.appSecretPath=/local/config\n",
        "crypto.encryptionSalt=public-salt\n",
        "app.keyVersion=1\n",
        "crypto.encryptionEnabled=true\n",
        "notsecret=ordinary\n",
        "mysecret=ordinary\n",
        "accesskeyboard=ordinary\n",
        "secretary=ordinary\n",
        "publicKey=public\n",
    );
    assert_eq!(sanitize::secrets(input, Categories::ALL), input);
}

#[test]
fn every_ascii_control_character_is_preserved_without_stalling() {
    let controls: String = (0_u8..=31).map(char::from).collect();
    assert_eq!(sanitize::secrets(&controls, Categories::ALL), controls);
    assert_eq!(
        sanitize::secrets(&controls, Categories::only(Category::CryptoKeys)),
        controls
    );
    // Exercise the JWK lexer as well as the clean-input fast path.
    let input = format!("{{\"kty\":\"RSA\",{controls}\"d\":\"private\"}}");
    let expected = format!("{{\"kty\":\"RSA\",{controls}\"d\":\"[REDACTED_CRYPTO_KEY]\"}}");
    assert_eq!(
        sanitize::secrets(&input, Categories::only(Category::CryptoKeys)),
        expected
    );
}

#[test]
fn category_mask_has_stable_bits_and_union_semantics() {
    let categories = [
        Category::ApiKeys,
        Category::Auth,
        Category::Cookies,
        Category::Databases,
        Category::CryptoKeys,
        Category::Passwords,
        Category::Tokens,
        Category::SignedUrls,
    ];

    assert_eq!(Categories::NONE.bits(), 0);
    assert_eq!(Categories::ALL.bits(), 0xff);
    for (index, category) in categories.into_iter().enumerate() {
        let expected_bit = 1 << index;
        assert_eq!(Categories::only(category).bits(), expected_bit);
        assert_eq!(
            Categories::from_bits(expected_bit),
            Categories::only(category)
        );
        assert_eq!(Categories::NONE.with(category).bits(), expected_bit);
        assert_eq!(
            Categories::only(category).with(category).bits(),
            expected_bit,
            "adding the same category twice must be idempotent"
        );
    }

    assert_eq!(
        Categories::only(Category::Auth)
            .with(Category::Cookies)
            .bits(),
        0b0000_0110
    );
}

#[test]
fn no_matches_and_no_categories_borrow_the_original_text() {
    let ordinary = "  Error: café 🦀\r\nquotes ' \" punctuation ; & =  \n";
    assert!(matches!(
        sanitize::secrets("", Categories::ALL),
        Cow::Borrowed("")
    ));
    assert!(matches!(
        sanitize::secrets(ordinary, Categories::ALL),
        Cow::Borrowed(text) if text == ordinary
    ));
    assert!(matches!(
        sanitize::secrets("apiKey=secret", Categories::NONE),
        Cow::Borrowed("apiKey=secret")
    ));
}

#[test]
fn labeled_secret_categories_redact_short_and_escaped_values() {
    let input = concat!(
        "apiKey=xy; OPENAI_API_KEY: short\n",
        "password: \"a, b; \u{03c0}\\\"c\"; passphrase='x y'\n",
        "access_token=tok; refresh-token: \"two words\";\n",
        "encryption_key=abc; signingSecret: \"s;\""
    );
    let expected = format!(
        "apiKey={API_KEY}; OPENAI_API_KEY: {API_KEY}\npassword: \"{PASSWORD}\"; passphrase='{PASSWORD}'\naccess_token={TOKEN}; refresh-token: \"{TOKEN}\";\nencryption_key={CRYPTO_KEY}; signingSecret: \"{CRYPTO_KEY}\""
    );
    assert_eq!(sanitize::secrets(input, Categories::ALL), expected);
}

#[test]
fn assignment_values_include_commas_and_hashes() {
    assert_eq!(
        sanitize::secrets(
            "password=a,b#c; account=public",
            Categories::only(Category::Passwords)
        ),
        format!("password={PASSWORD}; account=public")
    );
}

#[test]
fn quoted_json_and_query_labels_use_original_value_boundaries() {
    let input = r#"{"OPENAI_API_KEY":"x,y","clientSecret":"a\"b","access_token":"a b"} https://service.example/path?password=short&label=public"#;
    let expected = format!(
        r#"{{"OPENAI_API_KEY":"{API_KEY}","clientSecret":"{TOKEN}","access_token":"{TOKEN}"}} https://service.example/path?password={PASSWORD}&label=public"#
    );
    assert_eq!(sanitize::secrets(input, Categories::ALL), expected);
}

#[test]
fn secret_label_matching_does_not_match_metadata_or_innocent_substrings() {
    let input = concat!(
        "keyboard=k; api_key_id=id; token_count=3; password_length=10; ",
        "private_key_path=/tmp/key; public_key=public; username=alice"
    );
    assert_eq!(sanitize::secrets(input, Categories::ALL), input);
}

#[test]
fn provider_families_are_consumed_as_complete_candidates() {
    let github_suffix = ["abcdefghijklmnopqrst", "uvwxyzABCDEFGHIJKLMN"].concat();
    let credentials = [
        ("ghp_", github_suffix.as_str()),
        ("github_pat_", "11ABCDEFGHIJKLMN_opqrstuvwxyzABCDEF"),
        ("glpat-", "abcdefghijklmnopqrst"),
        ("xoxb-", "123456789012-123456789012-abcdefghijklmnopqrst"),
        ("xoxe.", "123456789012-123456789012-abcdefghijklmnopqrst"),
        ("sk_live_", "1234567890abcdefghijklmnopqrstuv"),
        ("sk_org_", "1234567890abcdefghijklmnopqrstuv"),
        (
            "sk-proj-",
            "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        ),
        ("sk-ant-", "api03-abcdefghijklmnopqrstuvwxyz0123456789"),
        ("npm_", "abcdefghijklmnopqrstuvwxyz0123456789"),
        ("SG.", "abcdefghijklmnopqrst.1234567890abcdefghijklmnopqrst"),
        ("AIza", "0123456789abcdefghijklmnopqrstuvwxyzABCDE"),
        ("AKIA", "ABCDEFGHIJKLMNOP"),
    ];

    for (prefix, suffix) in credentials {
        let credential = format!("{prefix}{suffix}TAIL0123456789");
        let input = format!("before {credential} after");
        assert_eq!(
            sanitize::secrets(&input, Categories::only(Category::ApiKeys)),
            format!("before {API_KEY} after"),
            "provider credential was not consumed completely: {prefix}"
        );
    }
}

#[test]
fn provider_family_evolution_and_age_pq_identities_are_supported() {
    let credentials = [
        "ghs_1234567890abcdefghijklmnopqrstuvwxyz",
        "glrt-abcdefghijklmnop",
        "xwfp-abcdefghijklmnop",
        "sk-svcacct-abcdefghijklmnop",
        "AGE-SECRET-KEY-1ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
        "AGE-SECRET-KEY-PQ-1ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    ];

    for credential in credentials {
        let categories = if credential.starts_with("AGE-") {
            Categories::only(Category::CryptoKeys)
        } else {
            Categories::only(Category::ApiKeys)
        };
        assert_eq!(
            sanitize::secrets(credential, categories),
            if credential.starts_with("AGE-") {
                CRYPTO_KEY
            } else {
                API_KEY
            },
            "credential family was not recognized completely: {credential}"
        );
    }
}

#[test]
fn standalone_public_stripe_publishable_keys_are_preserved() {
    let input =
        "pk_live_1234567890abcdefghijklmnopqrstuv and pk_test_1234567890abcdefghijklmnopqrstuv";
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::ApiKeys)),
        input
    );
}

#[test]
fn authorization_and_cookie_categories_preserve_headers_and_attributes() {
    let input = concat!(
        "Authorization: Bearer opaque-value\r\n",
        "Proxy-Authorization: Digest username=\"alice\", realm=\"api\", nonce=\"n\", uri=\"/\", response=\"signature\"\r\n",
        "Cookie: sid=one; theme=dark; csrf=two\r\n",
        "Set-Cookie: session=secret; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/; HttpOnly; SameSite=Lax"
    );
    let expected = format!(
        "Authorization: Bearer {AUTH}\r\nProxy-Authorization: Digest {AUTH}\r\nCookie: sid={COOKIE}; theme={COOKIE}; csrf={COOKIE}\r\nSet-Cookie: session={COOKIE}; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/; HttpOnly; SameSite=Lax"
    );
    assert_eq!(sanitize::secrets(input, Categories::ALL), expected);
}

#[test]
fn authorization_and_cookies_work_in_json_and_quoted_curl_headers() {
    let input = concat!(
        "curl -H 'Authorization: Bearer opaque-value' \\\n+         -H 'Cookie: sid=one; theme=dark'\n",
        "{\"Authorization\":\"Digest realm=api, nonce=secret\",\"Cookie\":\"a=1; b=2\",\"Set-Cookie\":\"session=value; Path=/\"}"
    );
    let expected = format!(
        "curl -H 'Authorization: Bearer {AUTH}' \\\n+         -H 'Cookie: sid={COOKIE}; theme={COOKIE}'\n",
    ) + &format!(
        r#"{{"Authorization":"Digest {AUTH}","Cookie":"a={COOKIE}; b={COOKIE}","Set-Cookie":"session={COOKIE}; Path=/"}}"#
    );
    assert_eq!(sanitize::secrets(input, Categories::ALL), expected);
}

#[test]
fn api_key_selection_still_redacts_provider_key_inside_auth_header_only() {
    let input = "Authorization: Bearer ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN";
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::ApiKeys)),
        format!("Authorization: Bearer {API_KEY}")
    );
    assert_eq!(
        sanitize::secrets(
            "Authorization: Bearer opaque-value",
            Categories::only(Category::ApiKeys)
        ),
        "Authorization: Bearer opaque-value"
    );
}

#[test]
fn database_urls_and_connection_strings_keep_noncredential_spelling() {
    let input = concat!(
        "postgresql+psycopg://u%40ser:p%3Ass@db.EXAMPLE:5432/app?sslmode=require&application_name=tool\n",
        "mongodb+srv://alice:secret@a.example,b.example/catalog?retryWrites=true\n",
        "Server=db.example;Database=app;User Id=alice;Password={a;b}}c};Encrypt=true"
    );
    let expected = format!(
        "postgresql+psycopg://{DATABASE}:{DATABASE}@db.EXAMPLE:5432/app?sslmode=require&application_name=tool\n\
         mongodb+srv://{DATABASE}:{DATABASE}@a.example,b.example/catalog?retryWrites=true\n\
         Server=db.example;Database=app;User Id={DATABASE};Password={{{DATABASE}}};Encrypt=true"
    );
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Databases)),
        expected
    );
}

#[test]
fn supported_database_url_schemes_and_connection_parameters_are_redacted() {
    let urls = [
        "postgres://u:p@db/app",
        "mysql+pymysql://u:p@db/app",
        "mariadb://u:p@db/app",
        "mongodb://u:p@db/app",
        "redis://u:p@db/0",
        "rediss://u:p@db/0",
        "sqlserver://u:p@db/app",
        "jdbc:postgresql://db/app?user=alice&password=secret&sslmode=require",
    ];
    for url in urls {
        let output = sanitize::secrets(url, Categories::only(Category::Databases));
        assert!(
            !output.contains("u:p@"),
            "credentials remain in {url}: {output}"
        );
        assert!(
            !output.contains("user=alice"),
            "username remains in {url}: {output}"
        );
        assert!(
            !output.contains("password=secret"),
            "password remains in {url}: {output}"
        );
        assert!(
            output.contains(DATABASE),
            "database placeholder missing for {url}: {output}"
        );
        if url.contains("sslmode=require") {
            assert!(output.contains("sslmode=require"));
        }
    }
}

#[test]
fn libpq_and_sql_server_quoted_values_preserve_connection_syntax() {
    let input = concat!(
        "host=db.example dbname=app user='alice smith' password='p\\'q' sslmode=require\n",
        "Server=db.example;Database=app;User Id=alice;Password={p;ass}}word};Encrypt=true"
    );
    let expected = format!(
        "host=db.example dbname=app user='{DATABASE}' password='{DATABASE}' sslmode=require\n\
         Server=db.example;Database=app;User Id={DATABASE};Password={{{DATABASE}}};Encrypt=true"
    );
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Databases)),
        expected
    );
}

#[test]
fn private_key_blocks_and_jwk_private_members_are_redacted_contextually() {
    let pem = concat!(
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\n",
        "-----END PRIVATE KEY-----"
    );
    assert_eq!(
        sanitize::secrets(pem, Categories::only(Category::CryptoKeys)),
        CRYPTO_KEY
    );

    let jwk = r#"{"kty":"RSA","kid":"key-1","n":"public-n","e":"AQAB","d":"private-d","p":"private-p","q":"private-q","oth":[{"r":"private-r","d":"private-dp","t":"private-t"}]}"#;
    let expected = format!(
        r#"{{"kty":"RSA","kid":"key-1","n":"public-n","e":"AQAB","d":"{CRYPTO_KEY}","p":"{CRYPTO_KEY}","q":"{CRYPTO_KEY}","oth":"{CRYPTO_KEY}"}}"#
    );
    assert_eq!(
        sanitize::secrets(jwk, Categories::only(Category::CryptoKeys)),
        expected
    );
    assert_eq!(
        sanitize::secrets(r#"{"d":"ordinary","k":"ordinary"}"#, Categories::ALL),
        r#"{"d":"ordinary","k":"ordinary"}"#
    );
}

#[test]
fn private_key_families_and_truncated_json_string_values_are_covered() {
    for label in [
        "ENCRYPTED PRIVATE KEY",
        "RSA PRIVATE KEY",
        "EC PRIVATE KEY",
        "DSA PRIVATE KEY",
        "PGP PRIVATE KEY BLOCK",
    ] {
        let block = format!("-----BEGIN {label}-----\nmaterial\n-----END {label}-----");
        assert_eq!(
            sanitize::secrets(&block, Categories::only(Category::CryptoKeys)),
            CRYPTO_KEY,
            "private key block not recognized: {label}"
        );
    }

    let input = r#"{"pem":"-----BEGIN PRIVATE KEY-----partial-secret","status":"public"}"#;
    let expected = format!(r#"{{"pem":"{CRYPTO_KEY}","status":"public"}}"#);
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::CryptoKeys)),
        expected
    );
}

#[test]
fn jwk_private_fields_follow_key_type_order_and_preserve_duplicate_members() {
    let rsa = r#"{"d":"first","d":"second","n":"public","kty":"RSA","p":"prime"}"#;
    let expected = format!(
        r#"{{"d":"{CRYPTO_KEY}","d":"{CRYPTO_KEY}","n":"public","kty":"RSA","p":"{CRYPTO_KEY}"}}"#
    );
    assert_eq!(
        sanitize::secrets(rsa, Categories::only(Category::CryptoKeys)),
        expected
    );

    for (key_type, member, value) in [
        ("EC", "d", "private-ec"),
        ("OKP", "d", "private-okp"),
        ("oct", "k", "private-symmetric"),
    ] {
        let input = format!(r#"{{"kty":"{key_type}","{member}":"{value}","x":"public"}}"#);
        let expected = format!(r#"{{"kty":"{key_type}","{member}":"{CRYPTO_KEY}","x":"public"}}"#);
        assert_eq!(
            sanitize::secrets(&input, Categories::only(Category::CryptoKeys)),
            expected
        );
    }

    let truncated = r#"{"kty":"RSA","oth":[{"r":"private-prime","d":"private-dp"}"#;
    let output = sanitize::secrets(truncated, Categories::only(Category::CryptoKeys));
    assert!(!output.contains("private-prime"));
    assert!(!output.contains("private-dp"));
}

#[test]
fn truncated_private_key_container_is_redacted_to_input_end() {
    let input =
        "prefix -----BEGIN OPENSSH PRIVATE KEY-----\npartial-secret\nthen-more-sensitive-tail";
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::CryptoKeys)),
        format!("prefix {CRYPTO_KEY}")
    );
}

#[test]
fn compact_tokens_and_signed_urls_are_category_scoped() {
    let jwt = "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjF9.";
    assert_eq!(
        sanitize::secrets(jwt, Categories::only(Category::Tokens)),
        TOKEN
    );

    let access_key = format!("AKIA{}", "A".repeat(16));
    let signed_url = format!(
        "https://s3.example/bucket/object?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential={access_key}%2Fscope&X-Amz-Signature=abcdef&response-content-type=text%2Fplain&expires=30"
    );
    let expected = format!(
        "https://s3.example/bucket/object?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential={SIGNED_URL}&X-Amz-Signature={SIGNED_URL}&response-content-type=text%2Fplain&expires=30"
    );
    assert_eq!(
        sanitize::secrets(&signed_url, Categories::only(Category::SignedUrls)),
        expected
    );
}

#[test]
fn compact_jws_and_jwe_require_local_structural_headers_not_expiry_or_signatures() {
    use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};

    let jws_header = URL_SAFE_NO_PAD.encode(br#"{ "alg" : "HS256" }"#);
    let jws = format!("{jws_header}.e30.");
    assert_eq!(
        sanitize::secrets(&jws, Categories::only(Category::Tokens)),
        TOKEN
    );

    let jwe_header = URL_SAFE_NO_PAD.encode(br#"{"alg":"dir","enc":"A256GCM"}"#);
    let jwe = format!("{jwe_header}..iv.ciphertext.tag");
    assert_eq!(
        sanitize::secrets(&jwe, Categories::only(Category::Tokens)),
        TOKEN
    );

    let with_sentence_punctuation = format!("{jws}.");
    assert_eq!(
        sanitize::secrets(
            &with_sentence_punctuation,
            Categories::only(Category::Tokens)
        ),
        format!("{TOKEN}.")
    );
}

#[test]
fn legacy_aws_and_azure_sas_urls_redact_only_authentication_parameters() {
    let access_key = format!("AKIA{}", "A".repeat(16));
    let aws = format!(
        "https://s3.example/object?AWSAccessKeyId={access_key}&Signature=abc&Expires=30&response-content-type=text%2Fplain"
    );
    let expected_aws = format!(
        "https://s3.example/object?AWSAccessKeyId={SIGNED_URL}&Signature={SIGNED_URL}&Expires=30&response-content-type=text%2Fplain"
    );
    assert_eq!(
        sanitize::secrets(&aws, Categories::only(Category::SignedUrls)),
        expected_aws
    );

    let azure = "https://acct.blob.example/container/file?sv=2024-01-01&sr=b&sp=r&sig=abc%2Fdef&se=2030-01-01T00%3A00%3A00Z";
    let expected_azure = format!(
        "https://acct.blob.example/container/file?sv=2024-01-01&sr=b&sp=r&sig={SIGNED_URL}&se=2030-01-01T00%3A00%3A00Z"
    );
    assert_eq!(
        sanitize::secrets(azure, Categories::only(Category::SignedUrls)),
        expected_azure
    );
}

#[test]
fn percent_encoded_signed_url_parameter_names_are_decoded_for_matching_only() {
    let input =
        "https://s3.example/object?%58-Amz-Signature=abc&response-content-type=text%2Fplain";
    let expected = format!(
        "https://s3.example/object?%58-Amz-Signature={SIGNED_URL}&response-content-type=text%2Fplain"
    );
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::SignedUrls)),
        expected
    );
}

#[test]
fn repetitive_near_matches_remain_ordinary_text_and_idempotent() {
    let input =
        "sk- xoxb- AGE-SECRET-KEY-PQ-1 api_key_id token_count private_key_path ".repeat(256);
    let first = sanitize::secrets(&input, Categories::ALL);
    assert_eq!(first, input);
    assert_eq!(sanitize::secrets(&first, Categories::ALL), input);
}

#[test]
fn repeated_calls_are_deterministic_idempotent_and_utf8_safe() {
    let input = "before 🧑🏽‍💻\r\npassword=short and apiKey=xy after café";
    let first = sanitize::secrets(input, Categories::ALL);
    let second = sanitize::secrets(input, Categories::ALL);
    assert_eq!(first, second);
    assert_eq!(sanitize::secrets(&first, Categories::ALL), first);
    assert_eq!(
        first,
        format!("before 🧑🏽‍💻\r\npassword={PASSWORD} and apiKey={API_KEY} after café")
    );
}

#[test]
fn category_subsets_do_not_enable_other_labeled_secret_rules() {
    let input = "apiKey=xy; password=pass; access_token=tok; encryption_key=enc";
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Passwords)),
        format!("apiKey=xy; password={PASSWORD}; access_token=tok; encryption_key=enc")
    );
    assert_eq!(
        sanitize::secrets(
            input,
            Categories::only(Category::ApiKeys).with(Category::Tokens)
        ),
        format!("apiKey={API_KEY}; password=pass; access_token={TOKEN}; encryption_key=enc")
    );
}

#[test]
fn json_newlines_around_field_separators_preserve_formatting() {
    let input = "{\n  \"password\" \n : \n \"short\"\n}";
    let expected = format!("{{\n  \"password\" \n : \n \"{PASSWORD}\"\n}}");
    assert_eq!(sanitize::secrets(input, Categories::ALL), expected);
}

#[test]
fn libpq_hostaddr_and_tabs_around_equals_keep_connection_context() {
    let input = "hostaddr=192.0.2.10 dbname=app user\t=\t alice password\t=\t secret";
    let expected =
        format!("hostaddr=192.0.2.10 dbname=app user\t=\t {DATABASE} password\t=\t {DATABASE}");
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Databases)),
        expected
    );
}

#[test]
fn libpq_unquoted_password_consumes_semicolon_and_ampersand() {
    let input = "hostaddr=192.0.2.10 dbname=app user=alice password=one;two&three";
    let expected = format!("hostaddr=192.0.2.10 dbname=app user={DATABASE} password={DATABASE}");
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Databases)),
        expected
    );
}

#[test]
fn signed_url_fragment_is_preserved_after_signature_redaction() {
    let input = "https://s3.example/object?X-Amz-Signature=abc&expires=30#section-1";
    let expected =
        format!("https://s3.example/object?X-Amz-Signature={SIGNED_URL}&expires=30#section-1");
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::SignedUrls)),
        expected
    );
}

#[test]
fn appended_text_after_an_existing_password_placeholder_is_consumed() {
    let input = "password=[REDACTED_PASSWORD]TAIL";
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Passwords)),
        "password=[REDACTED_PASSWORD]"
    );
}

#[test]
fn acronym_and_provider_camel_case_api_key_labels_are_recognized() {
    let input = "AWSAccessKeyId=short openAIAPIKey=also-short";
    let expected = format!("AWSAccessKeyId={API_KEY} openAIAPIKey={API_KEY}");
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::ApiKeys)),
        expected
    );
}

#[test]
fn escaped_and_duplicate_jwk_key_types_do_not_leave_private_values() {
    let escaped = r#"{"kty":"R\u0053A","d":"private-value","n":"public-value"}"#;
    let expected_escaped = format!(r#"{{"kty":"R\u0053A","d":"{CRYPTO_KEY}","n":"public-value"}}"#);
    assert_eq!(
        sanitize::secrets(escaped, Categories::only(Category::CryptoKeys)),
        expected_escaped
    );

    let duplicate = r#"{"kty":"RSA","kty":"unknown","d":"private-value"}"#;
    let expected_duplicate = format!(r#"{{"kty":"RSA","kty":"unknown","d":"{CRYPTO_KEY}"}}"#);
    assert_eq!(
        sanitize::secrets(duplicate, Categories::only(Category::CryptoKeys)),
        expected_duplicate
    );
}

#[test]
fn libpq_password_values_consume_braces_delimiters_and_embedded_quotes() {
    let inputs = [
        "hostaddr=192.0.2.10 dbname=app password={one}TAIL",
        "hostaddr=192.0.2.10 dbname=app password=one;TAIL",
        "hostaddr=192.0.2.10 dbname=app password=one\"two;TAIL",
    ];

    for input in inputs {
        let output = sanitize::secrets(input, Categories::only(Category::Databases));
        assert!(!output.contains("one"), "password prefix remains: {output}");
        assert!(
            !output.contains("TAIL"),
            "password suffix remains: {output}"
        );
        assert!(
            output.contains(DATABASE),
            "database placeholder missing: {output}"
        );
    }
}

#[test]
fn sql_server_connection_password_does_not_leave_suffix_after_value() {
    let input = "Server=db.example;Database=app;Password=secret;TAIL";
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Databases)),
        format!("Server=db.example;Database=app;Password={DATABASE};TAIL")
    );
}

#[test]
fn appended_secret_after_a_quoted_placeholder_is_consumed() {
    let input = "password=\"[REDACTED_PASSWORD][ACTUALSECRET]\"";
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Passwords)),
        "password=\"[REDACTED_PASSWORD]\""
    );
}

#[test]
fn labels_with_trailing_separators_still_select_their_secret_categories() {
    let input = "api_key_=short password_=also-short";
    let expected = format!("api_key_={API_KEY} password_={PASSWORD}");
    assert_eq!(sanitize::secrets(input, Categories::ALL), expected);
}

#[test]
fn two_independent_quoted_database_strings_on_one_line_are_both_redacted() {
    let input = r#"libpq="host=pg.example dbname=app password=first"; sqlserver="Server=sql.example;Database=app;Password={second}""#;
    let expected = format!(
        r#"libpq="host=pg.example dbname=app password={DATABASE}"; sqlserver="Server=sql.example;Database=app;Password={{{DATABASE}}}""#
    );
    assert_eq!(
        sanitize::secrets(input, Categories::only(Category::Databases)),
        expected
    );
}

#[test]
fn database_connection_context_does_not_require_dbname_or_scan_password_contents() {
    let connection_string = r#"CONNECTION_STRING="host=db user=alice password=secret""#;
    let expected_connection_string =
        format!(r#"CONNECTION_STRING="host=db user={DATABASE} password={DATABASE}""#);
    assert_eq!(
        sanitize::secrets(connection_string, Categories::only(Category::Databases)),
        expected_connection_string
    );

    let ordinary_password = "password='host=not-a-db'";
    assert_eq!(
        sanitize::secrets(ordinary_password, Categories::only(Category::Databases)),
        ordinary_password
    );
}
