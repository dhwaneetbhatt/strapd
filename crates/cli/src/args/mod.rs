use clap::{Parser, Subcommand};

pub mod data_formats;
pub mod datetime;
pub mod encoding;
pub mod identifiers;
pub mod random;
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
    Ulid {
        /// Number of ULIDs to generate (if not provided, defaults to 1)
        #[arg(default_value_t = 1)]
        number: usize,
    },
    Base64 {
        #[clap(subcommand)]
        operation: encoding::Base64Operation,
    },
    Url {
        #[clap(subcommand)]
        operation: encoding::UrlOperation,
    },
    Hex {
        #[clap(subcommand)]
        operation: encoding::HexOperation,
    },
    Json {
        #[clap(subcommand)]
        operation: data_formats::JsonOperation,
    },
    Yaml {
        #[clap(subcommand)]
        operation: data_formats::YamlOperation,
    },
    Xml {
        #[clap(subcommand)]
        operation: data_formats::XmlOperation,
    },
    Sql {
        #[clap(subcommand)]
        operation: data_formats::SqlOperation,
    },
    Hash {
        #[clap(subcommand)]
        operation: security::HashOperation,
    },
    Hmac {
        #[clap(subcommand)]
        operation: security::HmacOperation,
    },
    Random {
        #[clap(subcommand)]
        operation: random::RandomOperation,
    },
    #[command(aliases = ["ts", "timestamp"])]
    Time {
        #[clap(subcommand)]
        operation: datetime::TimeOperation,
    },
    Copy {
        /// The string to copy (if not provided, reads from stdin)
        input: Option<String>,
    },
    Paste {},
    /// Evaluate a mathematical expression
    #[command(aliases = ["calculate", "eval"])]
    Calc {
        /// Mathematical expression to evaluate (if not provided, reads from stdin)
        expression: Option<String>,
    },
}
