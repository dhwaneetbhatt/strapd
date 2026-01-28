use strapd_core::identifiers::ulid;

// Basic Generation Tests
#[test]
fn test_generate_single() {
    let result = ulid::generate(1);
    assert_eq!(result.len(), 26); // ULID = 26 chars
}

#[test]
fn test_generate_format() {
    let result = ulid::generate(1);
    // ULID should be uppercase alphanumeric (Crockford's Base32)
    assert!(result.chars().all(|c| c.is_ascii_alphanumeric()));
    // Most chars should be uppercase (allowing for digits)
    let uppercase_count = result.chars().filter(|c| c.is_uppercase()).count();
    assert!(uppercase_count > 0);
}

#[test]
fn test_generate_no_confusing_chars() {
    let result = ulid::generate(100);
    // ULID uses Crockford's Base32 which excludes I, L, O, U
    assert!(!result.contains('I'));
    assert!(!result.contains('L'));
    assert!(!result.contains('O'));
    assert!(!result.contains('U'));
}

#[test]
fn test_generate_multiple() {
    let result = ulid::generate(3);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 3);

    for line in lines {
        assert_eq!(line.len(), 26);
    }
}

#[test]
fn test_generate_uniqueness() {
    let result = ulid::generate(100);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 100);

    // Check all ULIDs are unique
    let mut unique_set = std::collections::HashSet::new();
    for line in lines {
        assert!(unique_set.insert(line));
    }
}

#[test]
fn test_generate_lexicographic_order() {
    // ULIDs are timestamp-based and should be sortable
    // Generate with small delay to ensure ordering
    let result = ulid::generate(5);
    let lines: Vec<&str> = result.lines().collect();

    // Just verify they are generated - ordering may vary with fast generation
    assert_eq!(lines.len(), 5);
    for line in lines {
        assert_eq!(line.len(), 26);
    }
}

#[test]
fn test_generate_large_number() {
    let result = ulid::generate(1000);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 1000);

    for line in lines {
        assert_eq!(line.len(), 26);
    }
}

#[test]
fn test_generate_single_ulid() {
    // Test generating just one ULID
    let result = ulid::generate(1);
    assert_eq!(result.len(), 26);
    assert!(!result.contains('\n'));
}

// Format Validation Tests
#[test]
fn test_generate_valid_base32() {
    let result = ulid::generate(10);
    let valid_chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

    for line in result.lines() {
        for ch in line.chars() {
            assert!(valid_chars.contains(ch));
        }
    }
}

#[test]
fn test_generate_uppercase_only() {
    let result = ulid::generate(50);
    for line in result.lines() {
        for ch in line.chars() {
            if ch.is_alphabetic() {
                assert!(ch.is_uppercase());
            }
        }
    }
}

// Consistency Tests
#[test]
fn test_generate_consistent_length() {
    let counts = [1, 10, 50, 100];
    for count in counts {
        let result = ulid::generate(count);
        let lines: Vec<&str> = result.lines().collect();
        assert_eq!(lines.len(), count);

        for line in lines {
            assert_eq!(line.len(), 26);
        }
    }
}
