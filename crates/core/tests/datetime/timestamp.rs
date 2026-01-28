use strapd_core::datetime::timestamp::{self, TimestampFormat};

// Now Tests
#[test]
fn test_now_returns_valid_timestamp() {
    let result = timestamp::now();
    // Timestamp should be positive and reasonable (after 2020)
    assert!(result > 1_577_836_800); // Jan 1, 2020
    assert!(result < 4_000_000_000); // Before year 2096
}

#[test]
fn test_now_millis_returns_valid_timestamp() {
    let result = timestamp::now_millis();
    // Timestamp should be positive and reasonable
    assert!(result > 1_577_836_800_000); // Jan 1, 2020 in ms
    assert!(result < 4_000_000_000_000); // Before year 2096 in ms
}

#[test]
fn test_now_and_now_millis_correlation() {
    let now_sec = timestamp::now();
    let now_ms = timestamp::now_millis();

    // Convert seconds to milliseconds and check they're close
    let now_sec_in_ms = now_sec * 1000;
    let diff = (now_ms - now_sec_in_ms).abs();

    // Should be within 1 second (1000 ms) of each other
    assert!(diff < 1000);
}

// Conversion Tests - Human Format
#[test]
fn test_from_timestamp_human_epoch() {
    let result = timestamp::from_timestamp(0, TimestampFormat::Human);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(!formatted.is_empty());
}

#[test]
fn test_from_timestamp_human_known_value() {
    // Jan 1, 2020 00:00:00 UTC
    let result = timestamp::from_timestamp(1577836800, TimestampFormat::Human);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(!formatted.is_empty());
    // Human format should contain date components
    assert!(formatted.contains("2020") || formatted.contains("2019")); // Accounting for timezone
}

#[test]
fn test_from_timestamp_human_recent() {
    let result = timestamp::from_timestamp(1_700_000_000, TimestampFormat::Human);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(!formatted.is_empty());
}

// Conversion Tests - ISO Format
#[test]
fn test_from_timestamp_iso_epoch() {
    let result = timestamp::from_timestamp(0, TimestampFormat::Iso);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(!formatted.is_empty());
    // ISO format should contain 'T' separator
    assert!(formatted.contains('T'));
}

#[test]
fn test_from_timestamp_iso_known_value() {
    let result = timestamp::from_timestamp(1577836800, TimestampFormat::Iso);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(formatted.contains('T'));
    assert!(formatted.contains("2020") || formatted.contains("2019"));
}

#[test]
fn test_from_timestamp_iso_format_structure() {
    let result = timestamp::from_timestamp(1_700_000_000, TimestampFormat::Iso);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    // ISO format should have timezone indicator
    assert!(formatted.contains('+') || formatted.contains('-') || formatted.ends_with('Z'));
}

// Conversion Tests - Milliseconds Human Format
#[test]
fn test_from_timestamp_millis_human_epoch() {
    let result = timestamp::from_timestamp_millis(0, TimestampFormat::Human);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(!formatted.is_empty());
}

#[test]
fn test_from_timestamp_millis_human_known_value() {
    let result = timestamp::from_timestamp_millis(1577836800000, TimestampFormat::Human);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(!formatted.is_empty());
    assert!(formatted.contains("2020") || formatted.contains("2019"));
}

// Conversion Tests - Milliseconds ISO Format
#[test]
fn test_from_timestamp_millis_iso_epoch() {
    let result = timestamp::from_timestamp_millis(0, TimestampFormat::Iso);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(formatted.contains('T'));
}

#[test]
fn test_from_timestamp_millis_iso_known_value() {
    let result = timestamp::from_timestamp_millis(1577836800000, TimestampFormat::Iso);
    assert!(result.is_ok());
    let formatted = result.unwrap();
    assert!(formatted.contains('T'));
    assert!(formatted.contains("2020") || formatted.contains("2019"));
}

// Error Handling Tests
#[test]
fn test_from_timestamp_invalid_negative() {
    // Very large negative timestamp (before valid range)
    let result = timestamp::from_timestamp(i64::MIN, TimestampFormat::Human);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Invalid timestamp");
}

#[test]
fn test_from_timestamp_invalid_far_future() {
    // Far future timestamp beyond valid range
    let result = timestamp::from_timestamp(i64::MAX, TimestampFormat::Human);
    assert!(result.is_err());
}

#[test]
fn test_from_timestamp_millis_invalid_negative() {
    let result = timestamp::from_timestamp_millis(i64::MIN, TimestampFormat::Human);
    assert!(result.is_err());
}

#[test]
fn test_from_timestamp_millis_invalid_far_future() {
    let result = timestamp::from_timestamp_millis(i64::MAX, TimestampFormat::Human);
    assert!(result.is_err());
}

// Format Comparison Tests
#[test]
fn test_format_difference_human_vs_iso() {
    let timestamp = 1_700_000_000;
    let human = timestamp::from_timestamp(timestamp, TimestampFormat::Human).unwrap();
    let iso = timestamp::from_timestamp(timestamp, TimestampFormat::Iso).unwrap();

    // Both should contain year but in different formats
    assert_ne!(human, iso);
}

#[test]
fn test_format_consistency() {
    let timestamp = 1_700_000_000;

    let result1 = timestamp::from_timestamp(timestamp, TimestampFormat::Iso).unwrap();
    let result2 = timestamp::from_timestamp(timestamp, TimestampFormat::Iso).unwrap();

    assert_eq!(result1, result2);
}

// Edge Cases
#[test]
fn test_from_timestamp_near_epoch() {
    let result = timestamp::from_timestamp(1, TimestampFormat::Iso);
    assert!(result.is_ok());
}

#[test]
fn test_from_timestamp_millis_near_epoch() {
    let result = timestamp::from_timestamp_millis(1, TimestampFormat::Iso);
    assert!(result.is_ok());
}

#[test]
fn test_from_timestamp_year_2038() {
    // Test around the 32-bit Unix timestamp limit
    let result = timestamp::from_timestamp(2_147_483_647, TimestampFormat::Iso);
    assert!(result.is_ok());
}

#[test]
fn test_from_timestamp_recent_values() {
    // Test with recent timestamps
    let timestamps = [1_600_000_000, 1_650_000_000, 1_700_000_000];

    for ts in timestamps {
        let human = timestamp::from_timestamp(ts, TimestampFormat::Human);
        let iso = timestamp::from_timestamp(ts, TimestampFormat::Iso);

        assert!(human.is_ok());
        assert!(iso.is_ok());
    }
}
