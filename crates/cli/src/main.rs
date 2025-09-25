use clap::Parser;
use std::io::{self, Write};

mod args;
mod handlers;
use args::{Cli, Commands};
use handlers::{base64_handler, string_handler, uuid_handler};

fn main() {
    let cli = Cli::parse();

    let result = match &cli.command {
        Commands::String { operation } => string_handler::handle(operation),
        Commands::Uuid { operation } => uuid_handler::handle(operation),
        Commands::Base64 { operation } => base64_handler::handle(operation),
    };

    match result {
        Ok(bytes) => {
            io::stdout()
                .write_all(&bytes)
                .expect("Failed to write to stdout");

            io::stdout()
                .write_all(b"\n")
                .expect("Failed to write newline to stdout");
        }
        Err(error) => {
            eprintln!("Error: {}", error);
            std::process::exit(1);
        }
    }
}
