use chrono::{DateTime, Local};

pub enum TimestampFormat {
    /// Human-readable format (YYYY-MM-DD HH:MM:SS UTC)
    Human,
    /// ISO 8601 / RFC 3339 format
    Iso,
}

pub fn now() -> i64 {
    Local::now().timestamp()
}

pub fn now_millis() -> i64 {
    Local::now().timestamp_millis()
}

pub fn from_timestamp(timestamp: i64, format: TimestampFormat) -> Result<String, &'static str> {
    DateTime::from_timestamp(timestamp, 0)
        .map(|dt| format_datetime(&dt.with_timezone(&Local), format))
        .ok_or("Invalid timestamp")
}

pub fn from_timestamp_millis(
    timestamp: i64,
    format: TimestampFormat,
) -> Result<String, &'static str> {
    DateTime::from_timestamp_millis(timestamp)
        .map(|dt| format_datetime(&dt.with_timezone(&Local), format))
        .ok_or("Invalid timestamp")
}

fn format_datetime(dt: &DateTime<Local>, format: TimestampFormat) -> String {
    match format {
        TimestampFormat::Human => dt.to_string(),
        TimestampFormat::Iso => dt.to_rfc3339(),
    }
}
