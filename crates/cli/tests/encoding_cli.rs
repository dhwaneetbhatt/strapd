use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::encoding_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_base64_encode() {
    let cli = Cli::parse_from(["strapd", "base64", "encode", "hello world"]);

    match &cli.command {
        Commands::Base64 { operation } => {
            let result = encoding_handler::handle_base64(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "aGVsbG8gd29ybGQ=");
        }
        _ => panic!("Expected Base64 command"),
    }
}

#[test]
fn test_cli_base64_decode() {
    let cli = Cli::parse_from(["strapd", "base64", "decode", "aGVsbG8gd29ybGQ="]);

    match &cli.command {
        Commands::Base64 { operation } => {
            let result = encoding_handler::handle_base64(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "hello world");
        }
        _ => panic!("Expected Base64 command"),
    }
}

#[test]
fn test_cli_base64_decode_invalid() {
    let cli = Cli::parse_from(["strapd", "base64", "decode", "invalid-base64@"]);

    match &cli.command {
        Commands::Base64 { operation } => {
            let result = encoding_handler::handle_base64(operation);
            assert!(result.is_err());
        }
        _ => panic!("Expected Base64 command"),
    }
}

#[test]
fn test_cli_url_encode() {
    let cli = Cli::parse_from(["strapd", "url", "encode", "hello world?"]);

    match &cli.command {
        Commands::Url { operation } => {
            let result = encoding_handler::handle_url(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.contains("hello%20world%3F"));
        }
        _ => panic!("Expected Url command"),
    }
}

#[test]
fn test_cli_url_decode() {
    let cli = Cli::parse_from(["strapd", "url", "decode", "hello%20world%3F"]);

    match &cli.command {
        Commands::Url { operation } => {
            let result = encoding_handler::handle_url(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "hello world?");
        }
        _ => panic!("Expected Url command"),
    }
}

#[test]
fn test_cli_hex_encode() {
    let cli = Cli::parse_from(["strapd", "hex", "encode", "abc"]);

    match &cli.command {
        Commands::Hex { operation } => {
            let result = encoding_handler::handle_hex(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "616263");
        }
        _ => panic!("Expected Hex command"),
    }
}

#[test]
fn test_cli_hex_decode() {
    let cli = Cli::parse_from(["strapd", "hex", "decode", "616263"]);

    match &cli.command {
        Commands::Hex { operation } => {
            let result = encoding_handler::handle_hex(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "abc");
        }
        _ => panic!("Expected Hex command"),
    }
}
