use clap::Parser;
use std::{
    env,
    io::{self, Write},
    process::{self, ExitCode},
};

use strapd::args::{Cli, Commands, string::StringOperation};
use strapd::handlers::{
    calculator_handler, clipboard_handler, conversion_handler, data_formats_handler,
    datetime_handler, diff_handler, encoding_handler, identifiers_handler, jwt_handler,
    random_handler, sanitize_handler, security_handler, string_handler,
};

fn main() -> ExitCode {
    let cli = Cli::try_parse().unwrap_or_else(|error| {
        if error.use_stderr() {
            let mut args = env::args_os().skip(1);
            if args
                .next()
                .is_some_and(|arg| matches!(arg.to_str(), Some("text" | "string" | "str")))
                && args.next().is_some_and(|arg| arg == "diff")
            {
                let exit_code = args
                    .take_while(|arg| arg != "--")
                    .any(|arg| arg == "--exit-code");
                let _ = error.print();
                process::exit(if exit_code { 2 } else { 1 });
            }
        }
        error.exit()
    });

    let result = match cli.command {
        Commands::String {
            operation: StringOperation::Diff(args),
        } => {
            let exit_code = args.exit_code;
            return match diff_handler::handle(args) {
                Ok(differs) => ExitCode::from(u8::from(exit_code && differs)),
                Err(error) => {
                    eprintln!("Error: {error}");
                    ExitCode::from(if exit_code { 2 } else { 1 })
                }
            };
        }
        ref command => handle(command),
    };

    match result {
        Ok(bytes) => {
            io::stdout()
                .write_all(&bytes)
                .expect("Failed to write to stdout");

            io::stdout()
                .write_all(b"\n")
                .expect("Failed to write newline to stdout");
            ExitCode::SUCCESS
        }
        Err(error) => {
            eprintln!("Error: {error}");
            ExitCode::FAILURE
        }
    }
}

fn handle(command: &Commands) -> strapd::handlers::CommandResult {
    match command {
        Commands::String { operation } => string_handler::handle(operation),
        Commands::Uuid { operation } => identifiers_handler::handle_uuid(operation),
        Commands::Ulid { number } => identifiers_handler::handle_ulid(*number),
        Commands::Base64 { operation } => encoding_handler::handle_base64(operation),
        Commands::Url { operation } => encoding_handler::handle_url(operation),
        Commands::Hex { operation } => encoding_handler::handle_hex(operation),
        Commands::Json { operation } => data_formats_handler::handle_json(operation),
        Commands::Yaml { operation } => data_formats_handler::handle_yaml(operation),
        Commands::Xml { operation } => data_formats_handler::handle_xml(operation),
        Commands::Sql { operation } => data_formats_handler::handle_sql(operation),
        Commands::Hash { operation } => security_handler::handle_hash(operation),
        Commands::Hmac { operation } => security_handler::handle_hmac(operation),
        Commands::Jwt { operation } => jwt_handler::handle(operation),
        Commands::Sanitize { operation } => sanitize_handler::handle(operation),
        Commands::Random { operation } => random_handler::handle(operation),
        Commands::Time { operation } => datetime_handler::handle(operation),
        Commands::Copy { input } => clipboard_handler::handle_copy(input),
        Commands::Paste {} => clipboard_handler::handle_paste(),
        Commands::Calc { expression } => calculator_handler::handle(expression),
        Commands::Convert(args) => conversion_handler::handle(args),
    }
}
