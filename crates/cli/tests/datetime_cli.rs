use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::datetime_handler;
use strapd_core::datetime::timestamp::{self, TimestampFormat};

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_time_now_default() {
    let cli = Cli::parse_from(["strapd", "time", "now"]);
    match &cli.command {
        Commands::Time { operation } => {
            let result = datetime_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            let timestamp: i64 = output.trim().parse().unwrap();
            assert!(timestamp > 1_600_000_000); // Sanity check: reasonably recent
        }
        _ => panic!("Expected Time command"),
    }
}

#[test]
fn test_cli_time_now_millis() {
    let cli = Cli::parse_from(["strapd", "time", "now", "--millis"]);
    match &cli.command {
        Commands::Time { operation } => {
            let result = datetime_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            let timestamp: i64 = output.trim().parse().unwrap();
            assert!(timestamp > 1_600_000_000_000); // Sanity check for millis
        }
        _ => panic!("Expected Time command"),
    }
}

#[test]
fn test_cli_time_now_formatted() {
    let cli = Cli::parse_from(["strapd", "time", "now", "--format", "iso"]);
    match &cli.command {
        Commands::Time { operation } => {
            let result = datetime_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            let (date, time) = output.trim().split_once('T').unwrap();
            assert!(date.contains('-'));
            assert!(time.ends_with('Z') || time.contains(['+', '-']));
        }
        _ => panic!("Expected Time command"),
    }
}

#[test]
fn test_cli_time_from_timestamp() {
    let cli = Cli::parse_from(["strapd", "time", "from", "0", "--format", "iso"]);
    match &cli.command {
        Commands::Time { operation } => {
            let result = datetime_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            let expected = timestamp::from_timestamp(0, TimestampFormat::Iso).unwrap();
            assert_eq!(output, expected);
        }
        _ => panic!("Expected Time command"),
    }
}

#[test]
fn test_cli_time_from_timestamp_millis() {
    let cli = Cli::parse_from([
        "strapd", "time", "from", "1000", "--millis", "--format", "iso",
    ]);
    match &cli.command {
        Commands::Time { operation } => {
            let result = datetime_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            let expected = timestamp::from_timestamp(1, TimestampFormat::Iso).unwrap();
            assert_eq!(output, expected);
        }
        _ => panic!("Expected Time command"),
    }
}
