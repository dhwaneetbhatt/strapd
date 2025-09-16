use clap::Parser;
use std::io::{self, Read, Write};
use strapd_core::{string, uuid};

mod args;
use args::{Cli, Commands, StringOperation, UuidOperation};

fn main() {
    let cli = Cli::parse();

    let result = match &cli.command {
        Commands::String { operation } => match operation {
            StringOperation::Uppercase { input } => {
                get_input_string(input, |s| string::to_uppercase(&s))
            }
            StringOperation::Lowercase { input } => {
                get_input_string(input, |s| string::to_lowercase(&s))
            }
            StringOperation::CapitalCase { input } => {
                get_input_string(input, |s| string::to_capitalcase(&s))
            }
            StringOperation::Trim {
                input,
                left,
                right,
                all,
            } => get_input_string(input, |s| string::trim(&s, *left, *right, *all)),
        },
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

fn get_input_string<R>(input: &Option<String>, f: impl FnOnce(&str) -> R) -> R {
    let s = match input.as_deref() {
        Some(s) => s,
        None => {
            let mut buf = String::new();
            io::stdin()
                .read_to_string(&mut buf)
                .expect("Failed to read from stdin");
            &buf.trim().to_string()
        }
    };
    f(s)
}
