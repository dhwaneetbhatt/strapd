use std::borrow::Cow;
use strapd_core::sanitize::pii::{Categories, Category, Mode, detect, sanitize};

fn mask(input: &str, category: Category) -> String {
    sanitize(input, Categories::only(category), Mode::Mask).into_owned()
}

#[test]
fn global_categories_preserve_surroundings() {
    for (input, category, expected) in [
        (
            "[2001:db8::1]:443 192.168.1.1/24 ::1",
            Category::IpAddresses,
            "[[REDACTED_IP_ADDRESS]]:443 [REDACTED_IP_ADDRESS]/24 [REDACTED_IP_ADDRESS]",
        ),
        (
            "भारत alice+tag@EXAMPLE.com.\r\n",
            Category::Emails,
            "भारत [REDACTED_EMAIL].\r\n",
        ),
        (
            "+91 98765 43210 ext. 123",
            Category::PhoneNumbers,
            "[REDACTED_PHONE_NUMBER]",
        ),
        (
            "(415) 555-2671 x9",
            Category::PhoneNumbers,
            "[REDACTED_PHONE_NUMBER]",
        ),
        (
            "phone_number=9876543210",
            Category::PhoneNumbers,
            "phone_number=[REDACTED_PHONE_NUMBER]",
        ),
        (
            "4111 1111 1111 1111",
            Category::PaymentCards,
            "[REDACTED_PAYMENT_CARD]",
        ),
        (
            "cardNumber: 4111-1111-1111-1112",
            Category::PaymentCards,
            "cardNumber: [REDACTED_PAYMENT_CARD]",
        ),
    ] {
        assert_eq!(mask(input, category), expected, "{input}");
    }
}

#[test]
fn indian_identifiers_checks_labels_and_boundaries() {
    for input in [
        "234567890124",
        "2345 6789 0124",
        "2345-6789-0124",
        "aadhaar=234567890123",
        "UID: 2345 6789 0123",
    ] {
        assert!(
            mask(input, Category::Aadhaar).contains("[REDACTED_AADHAAR]"),
            "{input}"
        );
    }
    for input in [
        "234567890123",
        "XXXX XXXX 0124",
        "2345-6789 0124",
        "aadhaarLast4=0124",
        "not_aadhaar=234567890123",
    ] {
        assert_eq!(mask(input, Category::Aadhaar), input);
    }
    for input in [
        "ABCPD1234E",
        "abcpd1234e",
        "pan=ABCZD0000E",
        "PAN number: ABCPD1234E",
    ] {
        assert!(
            mask(input, Category::Pan).contains("[REDACTED_PAN]"),
            "{input}"
        );
    }
    for input in [
        "ABCZD1234E",
        "ABCPD0000E",
        "xABCPD1234E",
        "ABCPD1234Ex",
        "pan_status=ABCZD0000E",
    ] {
        assert_eq!(mask(input, Category::Pan), input);
    }
}

#[test]
fn pseudonyms_follow_canonical_first_occurrences() {
    let input = "2001:db8::1 2001:0db8:0:0:0:0:0:1 alice@EXAMPLE.com alice@example.com Alice@example.com +91-98765-43210 +91 98765 43210 234567890124 2345-6789-0124 ABCPD1234E abcpd1234e";
    let expected = "[IP_ADDRESS_1] [IP_ADDRESS_1] [EMAIL_1] [EMAIL_1] [EMAIL_2] [PHONE_NUMBER_1] [PHONE_NUMBER_1] [AADHAAR_1] [AADHAAR_1] [PAN_1] [PAN_1]";
    for _ in 0..2 {
        assert_eq!(
            sanitize(input, Categories::ALL, Mode::Pseudonymize),
            expected
        );
    }
    assert_eq!(
        sanitize(expected, Categories::ALL, Mode::Pseudonymize),
        expected
    );
}

#[test]
fn clean_input_is_borrowed_and_masks_are_idempotent() {
    for text in [
        "",
        "Error: ordinary भारत\r\n",
        "9876543210",
        "version 123.456.789.0",
        "9999999999999999999999999999",
        "1",
    ] {
        assert!(
            matches!(
                sanitize(text, Categories::ALL, Mode::Mask),
                Cow::Borrowed(_)
            ),
            "{text}"
        );
    }
    let input = "alice@example.com 4111111111111111 234567890124 ABCPD1234E";
    let result = sanitize(input, Categories::ALL, Mode::Mask);
    assert_eq!(sanitize(&result, Categories::ALL, Mode::Mask), result);
    assert!(matches!(
        sanitize(input, Categories::NONE, Mode::Mask),
        Cow::Borrowed(_)
    ));
}

#[test]
fn specific_identifiers_win_over_phone_and_selections_are_isolated() {
    let input = "2345-6789-0124 4111-1111-1111-1111";
    assert_eq!(
        sanitize(input, Categories::ALL, Mode::Pseudonymize),
        "[AADHAAR_1] [PAYMENT_CARD_1]"
    );
    assert_eq!(
        mask(input, Category::Aadhaar),
        "[REDACTED_AADHAAR] 4111-1111-1111-1111"
    );
    assert_eq!(
        mask("4111111111111112", Category::PaymentCards),
        "4111111111111112"
    );
    assert_eq!(
        mask("4111-1111-1111-1111-1111-1111", Category::PaymentCards),
        "4111-1111-1111-1111-1111-1111"
    );
}

#[test]
fn punctuation_extensions_and_long_numeric_boundaries() {
    assert_eq!(mask("'ABCPD1234E'.", Category::Pan), "'[REDACTED_PAN]'.");
    assert_eq!(
        mask("::1!", Category::IpAddresses),
        "[REDACTED_IP_ADDRESS]!"
    );
    assert_eq!(
        mask("2026-10-12 1.2.3.4", Category::PhoneNumbers),
        "2026-10-12 1.2.3.4"
    );
    assert_eq!(
        mask("alice@example.com!", Category::Emails),
        "[REDACTED_EMAIL]!"
    );
    assert_eq!(
        mask("alice&bob@example.com;", Category::Emails),
        "[REDACTED_EMAIL];"
    );
    assert_eq!(
        mask("alice'bob@example.com", Category::Emails),
        "[REDACTED_EMAIL]"
    );
    assert_eq!(
        mask("phone=4155552671x9", Category::PhoneNumbers),
        "phone=[REDACTED_PHONE_NUMBER]"
    );
    assert_eq!(
        mask("+14155552671ext123", Category::PhoneNumbers),
        "[REDACTED_PHONE_NUMBER]"
    );
    let input = "123456789012345678904111111111111111";
    assert_eq!(mask(input, Category::PaymentCards), input);
    for input in [
        "x4111111111111111",
        "4111111111111111x",
        "pan_status=ABCZD0000E",
        "uid_last4=234567890123",
    ] {
        assert_eq!(sanitize(input, Categories::ALL, Mode::Mask), input);
    }
}

#[test]
fn numbered_fields_are_semantic_but_metadata_is_not() {
    for (input, category) in [
        ("aadhaar_1=234567890123", Category::Aadhaar),
        ("card_number_1=4111-1111-1111-1112", Category::PaymentCards),
        ("phone_number_1=9876543210", Category::PhoneNumbers),
    ] {
        assert!(mask(input, category).contains("[REDACTED_"));
    }
    for input in [
        "pan_status_1=ABCZD0000E",
        "aadhaarLast4=234567890123",
        "last4_uid=234567890123",
        "v2_phone_number=9876543210",
    ] {
        assert_eq!(sanitize(input, Categories::ALL, Mode::Mask), input);
    }
}

#[test]
fn email_apostrophe_boundaries_preserve_suffixes_and_canonical_identity() {
    for (input, masked, pseudonymized) in [
        (
            "alice@example.com's record",
            "[REDACTED_EMAIL]'s record",
            "[EMAIL_1]'s record",
        ),
        (
            "alice@example.com’s record",
            "[REDACTED_EMAIL]’s record",
            "[EMAIL_1]’s record",
        ),
        (
            "o'connor@example.com's o'connor@EXAMPLE.com’s",
            "[REDACTED_EMAIL]'s [REDACTED_EMAIL]’s",
            "[EMAIL_1]'s [EMAIL_1]’s",
        ),
        (
            "'o'connor@example.com'",
            "'[REDACTED_EMAIL]'",
            "'[EMAIL_1]'",
        ),
        (
            "'alice@example.com'bob@example.com'",
            "'[REDACTED_EMAIL]'[REDACTED_EMAIL]'",
            "'[EMAIL_1]'[EMAIL_2]'",
        ),
        (
            "alice@example.com'alice@EXAMPLE.com",
            "[REDACTED_EMAIL]'[REDACTED_EMAIL]",
            "[EMAIL_1]'[EMAIL_1]",
        ),
    ] {
        for (mode, expected) in [(Mode::Mask, masked), (Mode::Pseudonymize, pseudonymized)] {
            let result = sanitize(input, Categories::ALL, mode);
            assert_eq!(result, expected, "{input}");
            assert_eq!(sanitize(&result, Categories::ALL, mode), result);
        }
        assert_eq!(mask(input, Category::Pan), input);
    }
    for input in [
        "alice@missing's",
        "alice@-example.com's",
        "alice@example..com's",
        "alice@@example.com's",
        "alice@exam'ple.com",
    ] {
        assert_eq!(mask(input, Category::Emails), input);
    }
    let suffix = format!("'s{}", "x".repeat(1024));
    assert_eq!(
        mask(&format!("alice@example.com{suffix}"), Category::Emails),
        format!("[REDACTED_EMAIL]{suffix}")
    );
}

#[test]
fn compact_json_numbers_and_brand_groupings() {
    for before_colon in ["", " ", "\t"] {
        for after_colon in ["", " ", "\t"] {
            for (label, value, category) in [
                ("card", "4111111111111111", Category::PaymentCards),
                ("phone", "9876543210", Category::PhoneNumbers),
                ("aadhaar", "234567890123", Category::Aadhaar),
            ] {
                let input = format!("{{\"{label}\"{before_colon}:{after_colon}{value}}}");
                let matches = detect(&input, Categories::ALL);
                assert_eq!(matches.len(), 1, "{input:?}");
                assert_eq!(matches[0].category, category);
                assert_eq!(&input[matches[0].range.clone()], value);
            }
        }
    }
    for (input, expected) in [
        (
            r#"{"card":4111111111111111,"phone":9876543210,"aadhaar":234567890124}"#,
            r#"{"card":[REDACTED_PAYMENT_CARD],"phone":[REDACTED_PHONE_NUMBER],"aadhaar":[REDACTED_AADHAAR]}"#,
        ),
        (
            r#"{"card":9999999999999999,"aadhaar":234567890123}"#,
            r#"{"card":[REDACTED_PAYMENT_CARD],"aadhaar":[REDACTED_AADHAAR]}"#,
        ),
        (
            "3782 822463 10005; 3782-822463-10005; 3056 930902 5904; 3056-930902-5904",
            "[REDACTED_PAYMENT_CARD]; [REDACTED_PAYMENT_CARD]; [REDACTED_PAYMENT_CARD]; [REDACTED_PAYMENT_CARD]",
        ),
        (
            "::1; [2001:db8::1]:443; 192.168.1.1:80",
            "[REDACTED_IP_ADDRESS]; [[REDACTED_IP_ADDRESS]]:443; [REDACTED_IP_ADDRESS]:80",
        ),
    ] {
        assert_eq!(
            sanitize(input, Categories::ALL, Mode::Mask),
            expected,
            "{input}"
        );
    }
    for input in [
        "3782 822463-10005",
        "3056.930902.5904",
        "card_status=9999999999999999",
        "order:9876543210",
        "9876543210 4111111111111111",
    ] {
        if input == "9876543210 4111111111111111" {
            assert_eq!(
                mask(input, Category::PaymentCards),
                "9876543210 [REDACTED_PAYMENT_CARD]"
            );
        } else {
            assert_eq!(mask(input, Category::PaymentCards), input);
        }
    }
}

#[test]
fn detection_matches_both_rendering_modes_for_every_category_selection() {
    let input = "🙂 dev@example.com’s; [2001:db8::1]:443; +91 98765 43210 ext. 123; 3782 822463 10005; 2345-6789-0124; ABCPD1234E; {\"phone\":9876543210}; [EMAIL_1]";
    for bits in 0..64 {
        let categories = Categories::from_bits(bits);
        let matches = detect(input, categories);
        let mut expected_mask = String::new();
        let mut expected_pseudonym = String::new();
        let mut cursor = 0;
        let mut counts = [0; 6];
        for found in matches {
            assert!(found.range.start >= cursor);
            assert!(input.is_char_boundary(found.range.start));
            assert!(input.is_char_boundary(found.range.end));
            assert!(categories.contains(found.category));
            let name = match found.category {
                Category::IpAddresses => "IP_ADDRESS",
                Category::Emails => "EMAIL",
                Category::PhoneNumbers => "PHONE_NUMBER",
                Category::PaymentCards => "PAYMENT_CARD",
                Category::Aadhaar => "AADHAAR",
                Category::Pan => "PAN",
            };
            expected_mask.push_str(&input[cursor..found.range.start]);
            expected_pseudonym.push_str(&input[cursor..found.range.start]);
            expected_mask.push_str(&format!("[REDACTED_{name}]"));
            let index = (found.category as u8).trailing_zeros() as usize;
            counts[index] += 1;
            expected_pseudonym.push_str(&format!("[{name}_{}]", counts[index]));
            cursor = found.range.end;
        }
        expected_mask.push_str(&input[cursor..]);
        expected_pseudonym.push_str(&input[cursor..]);
        assert_eq!(sanitize(input, categories, Mode::Mask), expected_mask);
        assert_eq!(
            sanitize(input, categories, Mode::Pseudonymize),
            expected_pseudonym
        );
    }
}

fn with_luhn(prefix: &str, length: usize) -> String {
    let mut number = format!("{prefix}{}", "0".repeat(length - prefix.len() - 1));
    let sum: u32 = number
        .bytes()
        .rev()
        .enumerate()
        .map(|(i, b)| {
            let digit = u32::from(b - b'0') * if i % 2 == 0 { 2 } else { 1 };
            if digit > 9 { digit - 9 } else { digit }
        })
        .sum();
    number.push(char::from(b'0' + ((10 - sum % 10) % 10) as u8));
    number
}

#[test]
fn cards_require_supported_issuer_and_brand_length_unless_labelled() {
    for (prefix, length) in [
        ("4", 13),
        ("4", 16),
        ("4", 19),
        ("51", 16),
        ("55", 16),
        ("2221", 16),
        ("2720", 16),
        ("34", 15),
        ("37", 15),
        ("6011", 16),
        ("6011", 19),
        ("65", 19),
        ("644", 16),
        ("649", 19),
        ("60", 16),
        ("65", 16),
        ("81", 16),
        ("82", 16),
        ("508", 16),
        ("300", 14),
        ("305", 14),
        ("36", 14),
        ("38", 14),
        ("39", 14),
        ("3528", 16),
        ("3589", 16),
    ] {
        let input = with_luhn(prefix, length);
        assert_eq!(
            mask(&input, Category::PaymentCards),
            "[REDACTED_PAYMENT_CARD]",
            "{input}"
        );
    }
    for (prefix, length) in [
        ("1", 13),
        ("9", 16),
        ("4", 14),
        ("4", 15),
        ("4", 17),
        ("4", 18),
        ("34", 16),
        ("51", 19),
        ("2220", 16),
        ("2721", 16),
        ("3527", 16),
        ("3590", 16),
        ("643", 16),
        ("650", 15),
        ("81", 19),
        ("306", 14),
    ] {
        let input = with_luhn(prefix, length);
        assert_eq!(mask(&input, Category::PaymentCards), input);
        assert_eq!(
            mask(&format!("card={input}"), Category::PaymentCards),
            "card=[REDACTED_PAYMENT_CARD]"
        );
    }
}

#[test]
fn deterministic_numeric_false_positive_rates() {
    let mut state = 43u64;
    let mut cards = 0;
    for _ in 0..10000 {
        let mut number = String::new();
        for i in 0..16 {
            state ^= state << 13;
            state ^= state >> 7;
            state ^= state << 17;
            number.push(char::from(
                b'0' + if i == 0 {
                    (state % 9 + 1) as u8
                } else {
                    (state % 10) as u8
                },
            ));
        }
        cards += detect(&number, Categories::only(Category::PaymentCards)).len();
    }
    assert!(cards < 300, "{cards} / 10000 numeric strings flagged");
    for timestamp in (1600000000000u64..1900000000000)
        .step_by(30000001)
        .take(10000)
    {
        assert!(detect(&timestamp.to_string(), Categories::ALL).is_empty());
    }
}
