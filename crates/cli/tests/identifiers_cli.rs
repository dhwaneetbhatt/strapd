use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::identifiers_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_uuid_v4_defaults() {
    let cli = Cli::parse_from(["strapd", "uuid", "v4"]);

    match &cli.command {
        Commands::Uuid { operation } => {
            let result = identifiers_handler::handle_uuid(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            // Should contain 1 UUID
            assert_eq!(output.lines().count(), 1);
            // Basic UUID validation length check
            assert_eq!(output.trim().len(), 36);
        }
        _ => panic!("Expected Uuid command"),
    }
}

#[test]
fn test_cli_uuid_v4_multiple() {
    let cli = Cli::parse_from(["strapd", "uuid", "v4", "5"]);

    match &cli.command {
        Commands::Uuid { operation } => {
            let result = identifiers_handler::handle_uuid(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();

            assert_eq!(output.lines().count(), 5);
        }
        _ => panic!("Expected Uuid command"),
    }
}

#[test]
fn test_cli_uuid_v7_defaults() {
    let cli = Cli::parse_from(["strapd", "uuid", "v7"]);

    match &cli.command {
        Commands::Uuid { operation } => {
            let result = identifiers_handler::handle_uuid(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();

            assert_eq!(output.lines().count(), 1);
            assert_eq!(output.trim().len(), 36);
        }
        _ => panic!("Expected Uuid command"),
    }
}

#[test]
fn test_cli_ulid_defaults() {
    let cli = Cli::parse_from(["strapd", "ulid"]);

    match &cli.command {
        Commands::Ulid { number } => {
            let result = identifiers_handler::handle_ulid(*number);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.lines().count(), 1);
            assert_eq!(output.trim().len(), 26);
        }
        _ => panic!("Expected Ulid command"),
    }
}

#[test]
fn test_cli_ulid_multiple() {
    let cli = Cli::parse_from(["strapd", "ulid", "3"]);

    match &cli.command {
        Commands::Ulid { number } => {
            let result = identifiers_handler::handle_ulid(*number);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.lines().count(), 3);
        }
        _ => panic!("Expected Ulid command"),
    }
}
