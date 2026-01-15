use strapd_core::conversion::{ConversionRequest, convert};

// ============================================================================
// Length Conversion Tests
// ============================================================================

#[test]
fn test_convert_km_to_mi() {
    let request = ConversionRequest {
        value: 10.0,
        from_unit: "km".to_string(),
        to_unit: Some("mi".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 6.21371).abs() < 0.0001);
}

#[test]
fn test_convert_m_to_km() {
    let request = ConversionRequest {
        value: 1000.0,
        from_unit: "m".to_string(),
        to_unit: Some("km".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1.0).abs() < 0.0001);
}

#[test]
fn test_convert_ft_to_m() {
    let request = ConversionRequest {
        value: 100.0,
        from_unit: "feet".to_string(),
        to_unit: Some("m".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 30.48).abs() < 0.01);
}

#[test]
fn test_convert_in_to_cm() {
    let request = ConversionRequest {
        value: 10.0,
        from_unit: "inch".to_string(),
        to_unit: Some("cm".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 25.4).abs() < 0.01);
}

// ============================================================================
// Bytes Conversion Tests
// ============================================================================

#[test]
fn test_convert_bytes_to_kb() {
    let request = ConversionRequest {
        value: 1024.0,
        from_unit: "bytes".to_string(),
        to_unit: Some("kb".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1.0).abs() < 0.0001);
}

#[test]
fn test_convert_bytes_to_kib() {
    // kb and kib are now aliases - both use 1024-based
    let request = ConversionRequest {
        value: 1024.0,
        from_unit: "bytes".to_string(),
        to_unit: Some("kib".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1.0).abs() < 0.0001);
}

#[test]
fn test_convert_gb_to_mb() {
    let request = ConversionRequest {
        value: 1.5,
        from_unit: "gb".to_string(),
        to_unit: Some("mb".to_string()),
    };
    let result = convert(&request).unwrap();
    // 1.5 GB = 1.5 * 1024 MB = 1536 MB (1024-based)
    assert!((result.output_value - 1536.0).abs() < 0.01);
}

#[test]
fn test_convert_mib_to_bytes() {
    let request = ConversionRequest {
        value: 1.0,
        from_unit: "mib".to_string(),
        to_unit: Some("bytes".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1048576.0).abs() < 1.0);
}

// ============================================================================
// Time Conversion Tests
// ============================================================================

#[test]
fn test_convert_hours_to_minutes() {
    let request = ConversionRequest {
        value: 2.0,
        from_unit: "hours".to_string(),
        to_unit: Some("minutes".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 120.0).abs() < 0.0001);
}

#[test]
fn test_convert_ms_to_s() {
    let request = ConversionRequest {
        value: 5000.0,
        from_unit: "ms".to_string(),
        to_unit: Some("s".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 5.0).abs() < 0.0001);
}

#[test]
fn test_convert_days_to_hours() {
    let request = ConversionRequest {
        value: 1.0,
        from_unit: "day".to_string(),
        to_unit: Some("h".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 24.0).abs() < 0.0001);
}

#[test]
fn test_convert_week_to_days() {
    let request = ConversionRequest {
        value: 2.0,
        from_unit: "weeks".to_string(),
        to_unit: Some("days".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 14.0).abs() < 0.0001);
}

// ============================================================================
// Temperature Conversion Tests
// ============================================================================

#[test]
fn test_convert_c_to_f() {
    let request = ConversionRequest {
        value: 0.0,
        from_unit: "c".to_string(),
        to_unit: Some("f".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 32.0).abs() < 0.0001);
}

#[test]
fn test_convert_f_to_c() {
    let request = ConversionRequest {
        value: 212.0,
        from_unit: "f".to_string(),
        to_unit: Some("c".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 100.0).abs() < 0.0001);
}

#[test]
fn test_convert_c_to_k() {
    let request = ConversionRequest {
        value: 0.0,
        from_unit: "c".to_string(),
        to_unit: Some("k".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 273.15).abs() < 0.01);
}

#[test]
fn test_convert_k_to_c() {
    let request = ConversionRequest {
        value: 273.15,
        from_unit: "k".to_string(),
        to_unit: Some("c".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 0.0).abs() < 0.01);
}

#[test]
fn test_convert_f_to_k() {
    let request = ConversionRequest {
        value: 32.0,
        from_unit: "f".to_string(),
        to_unit: Some("k".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 273.15).abs() < 0.01);
}

#[test]
fn test_convert_negative_temperature() {
    let request = ConversionRequest {
        value: -40.0,
        from_unit: "c".to_string(),
        to_unit: Some("f".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - (-40.0)).abs() < 0.01);
}

// ============================================================================
// Data Rate Conversion Tests
// ============================================================================

#[test]
fn test_convert_mbps_to_bps() {
    let request = ConversionRequest {
        value: 1.0,
        from_unit: "mbps".to_string(),
        to_unit: Some("bps".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1_000_000.0).abs() < 1.0);
}

#[test]
fn test_convert_mbps_to_mbytes_ps() {
    let request = ConversionRequest {
        value: 8.0,
        from_unit: "mbps".to_string(),
        to_unit: Some("MBps".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1.0).abs() < 0.0001);
}

#[test]
fn test_convert_gbps_to_mbps() {
    let request = ConversionRequest {
        value: 1.0,
        from_unit: "gbps".to_string(),
        to_unit: Some("mbps".to_string()),
    };
    let result = convert(&request).unwrap();
    assert!((result.output_value - 1000.0).abs() < 0.01);
}
