use std::borrow::Cow;
use strapd_core::sanitize::pii::{Categories, Category, Mode, sanitize};

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
