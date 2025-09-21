use clap::{Parser, Subcommand};

pub mod identifiers;
pub mod string;

// Re-export operation enums
pub use identifiers::UuidOperation;
pub use string::StringOperation;

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
        operation: StringOperation,
    },
    Uuid {
        #[clap(subcommand)]
        operation: UuidOperation,
    },
}
