use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::calculator_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_calc_simple_addition() {
    let cli = Cli::parse_from(["strapd", "calc", "1 + 2"]);
    match &cli.command {
        Commands::Calc { expression } => {
            let result = calculator_handler::handle(expression);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "3");
        }
        _ => panic!("Expected Calc command"),
    }
}

#[test]
fn test_cli_calc_precedence() {
    let cli = Cli::parse_from(["strapd", "calc", "2 * 3 + 4"]);
    match &cli.command {
        Commands::Calc { expression } => {
            let result = calculator_handler::handle(expression);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "10");
        }
        _ => panic!("Expected Calc command"),
    }
}

#[test]
fn test_cli_calc_invalid() {
    let cli = Cli::parse_from(["strapd", "calc", "1 + "]);
    match &cli.command {
        Commands::Calc { expression } => {
            let result = calculator_handler::handle(expression);
            assert!(result.is_err());
        }
        _ => panic!("Expected Calc command"),
    }
}

#[test]
fn test_cli_calc_division_by_zero() {
    let cli = Cli::parse_from(["strapd", "calc", "1 / 0"]);
    match &cli.command {
        Commands::Calc { expression } => {
            let result = calculator_handler::handle(expression);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), "Division by zero");
        }
        _ => panic!("Expected Calc command"),
    }
}
