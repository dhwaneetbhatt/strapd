use clap::Parser;
use std::io::{self, Write};

mod args;
mod handlers;
use args::{Cli, Commands};
use handlers::{
    clipboard_handler, data_formats_handler, datetime_handler, encoding_handler,
    identifiers_handler, random_handler, security_handler, string_handler,
};

fn main() {
    let cli = Cli::parse();

    let result = match &cli.command {
        Commands::String { operation } => string_handler::handle(operation),
        Commands::Uuid { operation } => identifiers_handler::handle_uuid(operation),
        Commands::Base64 { operation } => encoding_handler::handle_base64(operation),
        Commands::Url { operation } => encoding_handler::handle_url(operation),
        Commands::Hex { operation } => encoding_handler::handle_hex(operation),
        Commands::Json { operation } => data_formats_handler::handle_json(operation),
        Commands::Yaml { operation } => data_formats_handler::handle_yaml(operation),
        Commands::Xml { operation } => data_formats_handler::handle_xml(operation),
        Commands::Sql { operation } => data_formats_handler::handle_sql(operation),
        Commands::Hash { operation } => security_handler::handle_hash(operation),
        Commands::Hmac { operation } => security_handler::handle_hmac(operation),
        Commands::Random { operation } => random_handler::handle(operation),
        Commands::Time { operation } => datetime_handler::handle(operation),
        Commands::Copy { input } => clipboard_handler::handle_copy(input),
        Commands::Paste {} => clipboard_handler::handle_paste(),
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
            eprintln!("Error: {error}");
            std::process::exit(1);
        }
    }
}
