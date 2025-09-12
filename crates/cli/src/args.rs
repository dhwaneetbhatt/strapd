use clap::{Parser, Subcommand};

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
}

#[derive(Subcommand, Debug)]
pub enum StringOperation {
    /// Convert string to uppercase
    #[command(aliases = ["upper", "upper_case", "caps", "uc"])]
    Uppercase {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Convert string to lowercase
    #[command(aliases = ["lower", "lower_case", "lc"])]
    Lowercase {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
    #[command(aliases = ["capital_case"])]
    CapitalCase {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
}
