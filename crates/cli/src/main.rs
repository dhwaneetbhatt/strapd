use clap::Parser;
use std::io::{self, Read, Write};
use strapd_core::{identifiers, string};

mod args;
use args::{Cli, Commands, StringOperation, UuidOperation};

fn main() {
    let cli = Cli::parse();

    let result = match &cli.command {
        Commands::String { operation } => match operation {
            StringOperation::Uppercase { input } => {
                let input = get_input_string(input);
                string::case::to_uppercase(&input)
            }
            StringOperation::Lowercase { input } => {
                let input = get_input_string(input);
                string::case::to_lowercase(&input)
            }
            StringOperation::CapitalCase { input } => {
                let input = get_input_string(input);
                string::case::to_capitalcase(&input)
            }
            StringOperation::Reverse { input } => {
                let input = get_input_string(input);
                string::transform::reverse(&input)
            }
            StringOperation::Replace { params } => match params.as_slice() {
                [search, replacement] => {
                    let input = get_input_string(&None);
                    string::transform::replace(&input, search, replacement)
                }
                [input, search, replacement] => {
                    string::transform::replace(input, search, replacement)
                }
                _ => unreachable!(),
            },
            StringOperation::Trim {
                input,
                left,
                right,
                all,
            } => {
                let input = get_input_string(input);
                string::whitespace::trim(&input, *left, *right, *all)
            }
            StringOperation::Slugify { input, separator } => {
                let input = get_input_string(input);
                string::transform::slugify(&input, *separator)
            }
        },
        Commands::Uuid { operation } => match operation {
            UuidOperation::V4 { number } => identifiers::uuid::generate_v4(*number),
            UuidOperation::V7 { number } => identifiers::uuid::generate_v7(*number),
        },
    };

    io::stdout()
        .write_all(result.as_bytes())
        .expect("Failed to write to stdout");
    io::stdout()
        .write_all(b"\n")
        .expect("Failed to write newline to stdout");
}

fn get_input_string(input: &Option<String>) -> String {
    match input.as_ref() {
        Some(s) => s.clone(),
        None => {
            let mut buf = String::new();
            io::stdin()
                .read_to_string(&mut buf)
                .expect("Failed to read from stdin");
            buf.trim().to_string()
        }
    }
}
