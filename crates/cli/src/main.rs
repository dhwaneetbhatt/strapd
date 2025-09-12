use clap::Parser;
use std::io::{self, Read, Write};
use strapd_core::string;

mod args;
use args::{Cli, Commands, StringOperation};

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::String { operation } => {
            let input = get_input_string(match operation {
                StringOperation::Uppercase { input }
                | StringOperation::Lowercase { input }
                | StringOperation::CapitalCase { input } => input.as_ref(),
            });

            let result = match operation {
                StringOperation::Uppercase { .. } => string::to_uppercase(&input),
                StringOperation::Lowercase { .. } => string::to_lowercase(&input),
                StringOperation::CapitalCase { .. } => string::to_capitalcase(&input),
            };

            io::stdout()
                .write_all(result.as_bytes())
                .expect("Failed to write to stdout");
            io::stdout()
                .write_all(b"\n")
                .expect("Failed to write newline to stdout");
        }
    }
}

fn get_input_string(input_arg: Option<&String>) -> String {
    match input_arg {
        Some(input) => input.clone(),
        None => {
            let mut buffer = String::new();
            io::stdin()
                .read_to_string(&mut buffer)
                .expect("Failed to read from stdin");
            buffer.trim().to_string()
        }
    }
}
