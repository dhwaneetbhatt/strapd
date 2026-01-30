use clap::Parser;
use strapd::args::{Cli, Commands};
use strapd::handlers::data_formats_handler;

// Helper to convert Result<Vec<u8>, String> to String
fn result_to_string(result: Result<Vec<u8>, String>) -> Result<String, String> {
    result.map(|bytes| String::from_utf8(bytes).expect("Invalid UTF-8"))
}

#[test]
fn test_cli_xml_beautify() {
    let input = "<root><a>val</a><b>val</b></root>";
    let cli = Cli::parse_from(["strapd", "xml", "beautify", input]);

    match &cli.command {
        Commands::Xml { operation } => {
            let result = data_formats_handler::handle_xml(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.contains("\n")); // Should be formatted
            assert!(output.contains("  <a>val</a>")); // Indentation
        }
        _ => panic!("Expected Xml command"),
    }
}

#[test]
fn test_cli_xml_minify() {
    let input = r#"
    <root>
        <a>val</a>
    </root>"#;
    let cli = Cli::parse_from(["strapd", "xml", "minify", input]);

    match &cli.command {
        Commands::Xml { operation } => {
            let result = data_formats_handler::handle_xml(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(!output.contains("\n")); // Should be one line
            assert!(output.contains("<root><a>val</a></root>"));
        }
        _ => panic!("Expected Xml command"),
    }
}

#[test]
fn test_cli_xml_convert_to_json() {
    let input = "<root><a>val</a></root>";
    let cli = Cli::parse_from(["strapd", "xml", "convert", input, "--to", "json"]);

    match &cli.command {
        Commands::Xml { operation } => {
            let result = data_formats_handler::handle_xml(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.contains(r#""a":"val""#));
        }
        _ => panic!("Expected Xml command"),
    }
}

#[test]
fn test_cli_xml_convert_invalid_target() {
    let input = "<root><a>val</a></root>";
    let cli = Cli::parse_from(["strapd", "xml", "convert", input, "--to", "yaml"]);

    match &cli.command {
        Commands::Xml { operation } => {
            let result = data_formats_handler::handle_xml(operation);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), "XML can only be converted to json");
        }
        _ => panic!("Expected Xml command"),
    }
}

#[test]
fn test_cli_yaml_convert_to_json() {
    let input = "a: 1\nb: 2";
    let cli = Cli::parse_from(["strapd", "yaml", "convert", input, "--to", "json"]);

    match &cli.command {
        Commands::Yaml { operation } => {
            let result = data_formats_handler::handle_yaml(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.contains(r#""a":1"#));
        }
        _ => panic!("Expected Yaml command"),
    }
}

#[test]
fn test_cli_yaml_convert_invalid_target() {
    let input = "a: 1";
    let cli = Cli::parse_from(["strapd", "yaml", "convert", input, "--to", "xml"]);

    match &cli.command {
        Commands::Yaml { operation } => {
            let result = data_formats_handler::handle_yaml(operation);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), "YAML can only be converted to json");
        }
        _ => panic!("Expected Yaml command"),
    }
}

#[test]
fn test_cli_sql_beautify() {
    let input = "SELECT * FROM users WHERE id = 1";
    let cli = Cli::parse_from(["strapd", "sql", "beautify", input]);

    match &cli.command {
        Commands::Sql { operation } => {
            let result = data_formats_handler::handle_sql(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(output.contains("\n")); // Should be formatted
            assert!(output.to_lowercase().contains("select"));
        }
        _ => panic!("Expected Sql command"),
    }
}

#[test]
fn test_cli_sql_minify() {
    let input = r#"
    SELECT *
    FROM users
    "#;
    let cli = Cli::parse_from(["strapd", "sql", "minify", input]);

    match &cli.command {
        Commands::Sql { operation } => {
            let result = data_formats_handler::handle_sql(operation);
            assert!(result.is_ok());
            let output = result_to_string(result).unwrap();
            assert!(!output.contains("\n")); // Should be one line
        }
        _ => panic!("Expected Sql command"),
    }
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
