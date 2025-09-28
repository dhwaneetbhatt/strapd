use clap::{Parser, Subcommand};

pub mod data_formats;
pub mod encoding;
pub mod identifiers;
pub mod security;
pub mod string;

#[derive(Parser, Debug)]
#[command(name = "strapd", version, about = "A Swiss Army knife CLI tool for developer utilities.", long_about = None)]
pub struct Cli {
    #[clap(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// String manipulation operations
    #[command(aliases = ["str", "text"])]
    String {
        #[clap(subcommand)]
        operation: string::StringOperation,
    },
    Uuid {
        #[clap(subcommand)]
        operation: identifiers::UuidOperation,
    },
    Base64 {
        #[clap(subcommand)]
        operation: encoding::Base64Operation,
    },
    Json {
        #[clap(subcommand)]
        operation: data_formats::JsonOperation,
    },
    Xml {
        #[clap(subcommand)]
        operation: data_formats::XmlOperation,
    },
    Hash {
        #[clap(subcommand)]
        operation: security::HashOperation,
    },
}
