use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::conversion_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_convert_single_args() {
    let cli = Cli::parse_from(["strapd", "convert", "10", "m", "to", "ft"]);

    match &cli.command {
        Commands::Convert(args) => {
            let result = conversion_handler::handle(args);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            // Default precision is 2
            assert!(output.contains("32.81"));
            assert!(output.contains("ft"));
        }
        _ => panic!("Expected Convert command"),
    }
}

#[test]
fn test_cli_convert_quoted_arg() {
    let cli = Cli::parse_from(["strapd", "convert", "10 km to mi"]);

    match &cli.command {
        Commands::Convert(args) => {
            let result = conversion_handler::handle(args);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.contains("6.21"));
            assert!(output.contains("mi"));
        }
        _ => panic!("Expected Convert command"),
    }
}

#[test]
fn test_cli_convert_precision() {
    let cli = Cli::parse_from(["strapd", "convert", "10 m to ft", "--precision", "2"]);

    match &cli.command {
        Commands::Convert(args) => {
            let result = conversion_handler::handle(args);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.contains("32.81"));
        }
        _ => panic!("Expected Convert command"),
    }
}

#[test]
fn test_cli_convert_all() {
    // Note: this test depends on "temp" or a valid category being present in core.
    // Assuming "C" (Celsius) is supported as per typical unit converters.
    let cli = Cli::parse_from(["strapd", "convert", "0 C", "--all"]);

    match &cli.command {
        Commands::Convert(args) => {
            let result = conversion_handler::handle(args);
            // If C is not valid unit, this might fail, but assuming standard implementation.
            if result.is_ok() {
                let output = result_to_string(result).unwrap();
                // 0 C = 32 F, 273.15 K
                // Output lowercases units: f, k
                assert!(output.to_lowercase().contains("32"));
                assert!(output.to_lowercase().contains("f"));
                assert!(output.contains("273.15"));
                assert!(output.to_lowercase().contains("k"));
            } else {
                // Retry logic removed for brevity, assuming C works based on manual run
                panic!("Failed to convert 0 C");
            }
        }
        _ => panic!("Expected Convert command"),
    }
}

#[test]
fn test_cli_convert_invalid_unit() {
    let cli = Cli::parse_from(["strapd", "convert", "10 invalid_unit to something"]);

    match &cli.command {
        Commands::Convert(args) => {
            let result = conversion_handler::handle(args);
            assert!(result.is_err());
        }
        _ => panic!("Expected Convert command"),
    }
}
