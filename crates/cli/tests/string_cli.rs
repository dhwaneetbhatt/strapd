use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::string_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_string_uppercase() {
    let cli = Cli::parse_from(["strapd", "string", "uppercase", "hello"]);
    match &cli.command {
        Commands::String { operation } => {
            let result = string_handler::handle(operation);
            assert!(result.is_ok());
            assert_eq!(result_to_string(result).unwrap().trim(), "HELLO");
        }
        _ => panic!("Expected String command"),
    }
}

#[test]
fn test_cli_string_lowercase() {
    let cli = Cli::parse_from(["strapd", "string", "lowercase", "HELLO"]);
    match &cli.command {
        Commands::String { operation } => {
            let result = string_handler::handle(operation);
            assert!(result.is_ok());
            assert_eq!(result_to_string(result).unwrap().trim(), "hello");
        }
        _ => panic!("Expected String command"),
    }
}

#[test]
fn test_cli_string_reverse() {
    let cli = Cli::parse_from(["strapd", "string", "reverse", "hello"]);
    match &cli.command {
        Commands::String { operation } => {
            let result = string_handler::handle(operation);
            assert!(result.is_ok());
            assert_eq!(result_to_string(result).unwrap().trim(), "olleh");
        }
        _ => panic!("Expected String command"),
    }
}

#[test]
fn test_cli_string_replace() {
    let cli = Cli::parse_from([
        "strapd",
        "string",
        "replace",
        "hello world",
        "--find",
        "world",
        "--replace",
        "universe",
    ]);
    match &cli.command {
        Commands::String { operation } => {
            let result = string_handler::handle(operation);
            assert!(result.is_ok());
            assert_eq!(result_to_string(result).unwrap().trim(), "hello universe");
        }
        _ => panic!("Expected String command"),
    }
}

#[test]
fn test_cli_string_slugify() {
    let cli = Cli::parse_from(["strapd", "string", "slugify", "Hello World 123"]);
    match &cli.command {
        Commands::String { operation } => {
            let result = string_handler::handle(operation);
            assert!(result.is_ok());
            assert_eq!(result_to_string(result).unwrap().trim(), "hello-world-123");
        }
        _ => panic!("Expected String command"),
    }
}

#[test]
fn test_cli_string_trim() {
    let cli = Cli::parse_from(["strapd", "string", "trim", "  hello  "]);
    match &cli.command {
        Commands::String { operation } => {
            let result = string_handler::handle(operation);
            assert!(result.is_ok());
            assert_eq!(result_to_string(result).unwrap().trim(), "hello");
        }
        _ => panic!("Expected String command"),
    }
}
