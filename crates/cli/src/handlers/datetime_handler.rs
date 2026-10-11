use crate::{
    args::datetime::{TimeOperation, TimestampFormat},
    handlers::{CommandResult, error_result, text_result},
    input::{required_text, text_with_piped_trim},
};
use strapd_core::datetime::timestamp::{self, TimestampFormat as core_ts_format};

pub fn handle(operation: &TimeOperation) -> CommandResult {
    match operation {
        TimeOperation::Now { millis, format } => {
            let result = match millis {
                true => timestamp::now_millis(),
                false => timestamp::now(),
            };
            match format {
                Some(format) => format_timestamp(result, *millis, format),
                None => text_result(result.to_string()),
            }
        }
        TimeOperation::From {
            timestamp,
            millis,
            format,
        } => {
            let input = match timestamp {
                Some(timestamp) => *timestamp,
                None => {
                    let input = required_text(None, "timestamp")?;
                    let input = text_with_piped_trim(&input);
                    input.parse::<i64>().map_err(|_| {
                        format!("Invalid timestamp '{input}': expected a whole number")
                    })?
                }
            };
            let format = format.as_ref().unwrap_or(&TimestampFormat::Human);
            format_timestamp(input, *millis, format)
        }
    }
}

fn format_timestamp(ts: i64, is_millis: bool, format: &TimestampFormat) -> CommandResult {
    let result = match is_millis {
        true => timestamp::from_timestamp_millis(ts, convert_format(format)),
        false => timestamp::from_timestamp(ts, convert_format(format)),
    };

    match result {
        Ok(dt) => text_result(dt),
        Err(msg) => error_result(msg),
    }
}

fn convert_format(input_format: &TimestampFormat) -> core_ts_format {
    match input_format {
        TimestampFormat::Human => core_ts_format::Human,
        TimestampFormat::Iso => core_ts_format::Iso,
    }
}
