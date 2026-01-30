use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::random_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_random_string_defaults() {
    let cli = Cli::parse_from(["strapd", "random", "string"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            // Default length is 16
            assert_eq!(output.trim().len(), 16);
            assert_eq!(output.lines().count(), 1);
        }
        _ => panic!("Expected Random command"),
    }
}

#[test]
fn test_cli_random_string_length() {
    let cli = Cli::parse_from(["strapd", "random", "string", "20"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim().len(), 20);
        }
        _ => panic!("Expected Random command"),
    }
}

#[test]
fn test_cli_random_string_specific_charset() {
    // Only lowercase
    let cli = Cli::parse_from(["strapd", "random", "string", "--lower", "100"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.trim().chars().all(|c| c.is_ascii_lowercase()));
        }
        _ => panic!("Expected Random command"),
    }

    // Only uppercase
    let cli = Cli::parse_from(["strapd", "random", "string", "--upper", "100"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.trim().chars().all(|c| c.is_ascii_uppercase()));
        }
        _ => panic!("Expected Random command"),
    }

    // Only digits
    let cli = Cli::parse_from(["strapd", "random", "string", "--digits", "100"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.trim().chars().all(|c| c.is_ascii_digit()));
        }
        _ => panic!("Expected Random command"),
    }
}

#[test]
fn test_cli_random_string_multiple() {
    let cli = Cli::parse_from(["strapd", "random", "string", "-n", "5"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.lines().count(), 5);
        }
        _ => panic!("Expected Random command"),
    }
}

#[test]
fn test_cli_random_number_defaults() {
    let cli = Cli::parse_from(["strapd", "random", "number"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            let num: i64 = output.trim().parse().unwrap();
            assert!(num >= 0 && num <= 100);
        }
        _ => panic!("Expected Random command"),
    }
}

#[test]
fn test_cli_random_number_range() {
    let cli = Cli::parse_from(["strapd", "random", "number", "--min", "10", "--max", "20"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            let num: i64 = output.trim().parse().unwrap();
            assert!(num >= 10 && num <= 20);
        }
        _ => panic!("Expected Random command"),
    }
}

#[test]
fn test_cli_random_number_multiple() {
    let cli = Cli::parse_from(["strapd", "random", "number", "-n", "5"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.lines().count(), 5);
        }
        _ => panic!("Expected Random command"),
    }
}

#[test]
fn test_cli_random_string_custom_charset() {
    let cli = Cli::parse_from(["strapd", "random", "string", "--charset", "abc", "20"]);
    match &cli.command {
        Commands::Random { operation } => {
            let result = random_handler::handle(operation);
            assert!(result.is_ok());

            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim().len(), 20);

            // Verify all characters are from the custom charset
            assert!(output.trim().chars().all(|c| "abc".contains(c)));
        }
        _ => panic!("Expected Random command"),
    }
}
