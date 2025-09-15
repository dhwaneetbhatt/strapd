use clap::Parser;
use std::io::{self, Read, Write};
use strapd_core::{string, uuid};

mod args;
use args::{Cli, Commands, StringOperation, UuidOperation};

fn main() {
    let cli = Cli::parse();

    let result = match &cli.command {
        Commands::String { operation } => {
            let input = get_input_string(match operation {
                StringOperation::Uppercase { input }
                | StringOperation::Lowercase { input }
                | StringOperation::CapitalCase { input } => input.as_ref(),
            });

            match operation {
                StringOperation::Uppercase { .. } => string::to_uppercase(&input),
                StringOperation::Lowercase { .. } => string::to_lowercase(&input),
                StringOperation::CapitalCase { .. } => string::to_capitalcase(&input),
            }
        }
        Commands::Uuid { operation } => match operation {
            UuidOperation::V4 { number } => uuid::generate_v4(&number),
            UuidOperation::V7 { number } => uuid::generate_v7(&number),
        },
    };

    io::stdout()
        .write_all(result.as_bytes())
        .expect("Failed to write to stdout");
    io::stdout()
        .write_all(b"\n")
        .expect("Failed to write newline to stdout");
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
