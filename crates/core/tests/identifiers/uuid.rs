use strapd_core::identifiers::uuid;

// UUID v4 Tests
#[test]
fn test_generate_v4_single() {
    let result = uuid::generate_v4(1);
    assert_eq!(result.len(), 36); // UUID v4 = 36 chars with hyphens
    assert_eq!(result.chars().filter(|&c| c == '-').count(), 4);
}

#[test]
fn test_generate_v4_format() {
    let result = uuid::generate_v4(1);
    // Check format: 8-4-4-4-12
    let parts: Vec<&str> = result.split('-').collect();
    assert_eq!(parts.len(), 5);
    assert_eq!(parts[0].len(), 8);
    assert_eq!(parts[1].len(), 4);
    assert_eq!(parts[2].len(), 4);
    assert_eq!(parts[3].len(), 4);
    assert_eq!(parts[4].len(), 12);
}

#[test]
fn test_generate_v4_is_hex() {
    let result = uuid::generate_v4(1);
    let hex_chars: String = result.chars().filter(|&c| c != '-').collect();
    assert!(hex_chars.chars().all(|c| c.is_ascii_hexdigit()));
}

#[test]
fn test_generate_v4_multiple() {
    let result = uuid::generate_v4(3);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 3);

    for line in lines {
        assert_eq!(line.len(), 36);
    }
}

#[test]
fn test_generate_v4_uniqueness() {
    let result = uuid::generate_v4(100);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 100);

    // Check all UUIDs are unique
    let mut unique_set = std::collections::HashSet::new();
    for line in lines {
        assert!(unique_set.insert(line));
    }
}

#[test]
fn test_generate_v4_version_field() {
    let result = uuid::generate_v4(1);
    let parts: Vec<&str> = result.split('-').collect();
    // Version field is first character of third group
    let version_char = parts[2].chars().next().unwrap();
    assert_eq!(version_char, '4'); // UUID v4
}

#[test]
fn test_generate_v4_large_number() {
    let result = uuid::generate_v4(1000);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 1000);
}

// UUID v7 Tests
#[test]
fn test_generate_v7_single() {
    let result = uuid::generate_v7(1);
    assert_eq!(result.len(), 36);
    assert_eq!(result.chars().filter(|&c| c == '-').count(), 4);
}

#[test]
fn test_generate_v7_format() {
    let result = uuid::generate_v7(1);
    let parts: Vec<&str> = result.split('-').collect();
    assert_eq!(parts.len(), 5);
    assert_eq!(parts[0].len(), 8);
    assert_eq!(parts[1].len(), 4);
    assert_eq!(parts[2].len(), 4);
    assert_eq!(parts[3].len(), 4);
    assert_eq!(parts[4].len(), 12);
}

#[test]
fn test_generate_v7_is_hex() {
    let result = uuid::generate_v7(1);
    let hex_chars: String = result.chars().filter(|&c| c != '-').collect();
    assert!(hex_chars.chars().all(|c| c.is_ascii_hexdigit()));
}

#[test]
fn test_generate_v7_multiple() {
    let result = uuid::generate_v7(3);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 3);

    for line in lines {
        assert_eq!(line.len(), 36);
    }
}

#[test]
fn test_generate_v7_uniqueness() {
    let result = uuid::generate_v7(100);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 100);

    let mut unique_set = std::collections::HashSet::new();
    for line in lines {
        assert!(unique_set.insert(line));
    }
}

#[test]
fn test_generate_v7_version_field() {
    let result = uuid::generate_v7(1);
    let parts: Vec<&str> = result.split('-').collect();
    let version_char = parts[2].chars().next().unwrap();
    assert_eq!(version_char, '7'); // UUID v7
}

#[test]
fn test_generate_v7_lexicographic_order() {
    // UUID v7 should be sortable (roughly timestamp-based)
    let result = uuid::generate_v7(10);
    let lines: Vec<&str> = result.lines().collect();

    // Check that consecutive UUIDs are in ascending order
    for i in 0..lines.len() - 1 {
        assert!(lines[i] < lines[i + 1] || lines[i] == lines[i + 1]);
    }
}

#[test]
fn test_generate_v7_large_number() {
    let result = uuid::generate_v7(1000);
    let lines: Vec<&str> = result.lines().collect();
    assert_eq!(lines.len(), 1000);
}

// Edge Cases
#[test]
fn test_generate_v4_single_line() {
    // Test that single UUID has no newlines
    let result = uuid::generate_v4(1);
    assert_eq!(result.len(), 36);
    assert!(!result.contains('\n'));
}

#[test]
fn test_generate_v7_single_line() {
    // Test that single UUID has no newlines
    let result = uuid::generate_v7(1);
    assert_eq!(result.len(), 36);
    assert!(!result.contains('\n'));
}

// Comparison Tests
#[test]
fn test_v4_and_v7_different() {
    let v4 = uuid::generate_v4(1);
    let v7 = uuid::generate_v7(1);

    assert_ne!(v4, v7);

    let v4_parts: Vec<&str> = v4.split('-').collect();
    let v7_parts: Vec<&str> = v7.split('-').collect();

    // Version fields should be different
    assert_eq!(v4_parts[2].chars().next().unwrap(), '4');
    assert_eq!(v7_parts[2].chars().next().unwrap(), '7');
}
