use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::data_formats_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_json_beautify_parses_and_executes() {
    let cli = Cli::parse_from(["strapd", "json", "beautify", r#"{"name":"Alice"}"#]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());

            let output = result_to_string(result).unwrap();
            assert!(!output.is_empty());
            assert!(output.lines().count() > 1); // Should be formatted
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_beautify_with_spaces() {
    let cli = Cli::parse_from(["strapd", "json", "beautify", r#"{"a":1}"#, "4"]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_beautify_with_sort_flag() {
    let cli = Cli::parse_from([
        "strapd",
        "json",
        "beautify",
        r#"{"z":1,"a":2}"#,
        "2",
        "--sort",
    ]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_minify_parses_and_executes() {
    let cli = Cli::parse_from(["strapd", "json", "minify", r#"{"name": "Bob"}"#]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());

            let output = result_to_string(result).unwrap();
            assert_eq!(output.lines().count(), 1); // Should be minified
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_convert_to_yaml() {
    let cli = Cli::parse_from([
        "strapd",
        "json",
        "convert",
        r#"{"name":"Charlie"}"#,
        "--to",
        "yaml",
    ]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_convert_to_xml() {
    let cli = Cli::parse_from([
        "strapd",
        "json",
        "convert",
        r#"{"name":"Dave"}"#,
        "--to",
        "xml",
    ]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_convert_with_custom_root() {
    let cli = Cli::parse_from([
        "strapd",
        "json",
        "convert",
        r#"{"id":123}"#,
        "--to",
        "xml",
        "--root",
        "person",
    ]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());

            let output = result_to_string(result).unwrap();
            assert!(output.contains("<person>"));
            assert!(output.contains("</person>"));
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_alias_format() {
    let cli = Cli::parse_from(["strapd", "json", "format", r#"{"a":1}"#]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_alias_uglify() {
    let cli = Cli::parse_from(["strapd", "json", "uglify", r#"{"a": 1}"#]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_ok());
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_invalid_json_returns_error() {
    let cli = Cli::parse_from(["strapd", "json", "beautify", r#"{invalid}"#]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_err());
        }
        _ => panic!("Expected Json command"),
    }
}

#[test]
fn test_cli_json_convert_invalid_format_returns_error() {
    let cli = Cli::parse_from(["strapd", "json", "convert", r#"{"a":1}"#, "--to", "csv"]);

    match &cli.command {
        Commands::Json { operation } => {
            let result = data_formats_handler::handle_json(operation);
            assert!(result.is_err());
        }
        _ => panic!("Expected Json command"),
    }
}
