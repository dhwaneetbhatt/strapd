use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::security_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_hash_md5() {
    let cli = Cli::parse_from(["strapd", "hash", "md5", "hello"]);
    match &cli.command {
        Commands::Hash { operation } => {
            let result = security_handler::handle_hash(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "5d41402abc4b2a76b9719d911017c592");
        }
        _ => panic!("Expected Hash command"),
    }
}

#[test]
fn test_cli_hash_sha1() {
    let cli = Cli::parse_from(["strapd", "hash", "sha1", "hello"]);
    match &cli.command {
        Commands::Hash { operation } => {
            let result = security_handler::handle_hash(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim(), "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d");
        }
        _ => panic!("Expected Hash command"),
    }
}

#[test]
fn test_cli_hash_sha256() {
    let cli = Cli::parse_from(["strapd", "hash", "sha256", "hello"]);
    match &cli.command {
        Commands::Hash { operation } => {
            let result = security_handler::handle_hash(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(
                output.trim(),
                "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
            );
        }
        _ => panic!("Expected Hash command"),
    }
}

#[test]
fn test_cli_hash_sha512() {
    let cli = Cli::parse_from(["strapd", "hash", "sha512", "hello"]);
    match &cli.command {
        Commands::Hash { operation } => {
            let result = security_handler::handle_hash(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            // Just satisfy length and known starting chars as full string is long
            assert_eq!(output.trim().len(), 128);
            assert!(output.trim().starts_with("9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043"));
        }
        _ => panic!("Expected Hash command"),
    }
}

#[test]
fn test_cli_hmac_sha256() {
    let cli = Cli::parse_from(["strapd", "hmac", "sha256", "secret-key", "hello"]);
    match &cli.command {
        Commands::Hmac { operation } => {
            let result = security_handler::handle_hmac(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(
                output.trim(),
                "98e7ffb964bb5a3f902db1fc101a5baa98b6f2cd56858210c9d70f26ac762fc7"
            );
        }
        _ => panic!("Expected Hmac command"),
    }
}

#[test]
fn test_cli_hmac_sha512() {
    let cli = Cli::parse_from(["strapd", "hmac", "sha512", "secret-key", "hello"]);
    match &cli.command {
        Commands::Hmac { operation } => {
            let result = security_handler::handle_hmac(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert_eq!(output.trim().len(), 128);
        }
        _ => panic!("Expected Hmac command"),
    }
}
