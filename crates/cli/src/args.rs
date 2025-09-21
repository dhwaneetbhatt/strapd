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
    Uuid {
        #[clap(subcommand)]
        operation: UuidOperation,
    },
}

#[derive(Subcommand, Debug)]
pub enum StringOperation {
    /// Convert string to uppercase
    #[command(aliases = ["upper", "upper_case", "uc"])]
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
    /// Convert string to capital case (first letter of each word is a capital letter)
    #[command(aliases = ["capital_case", "title_case"])]
    CapitalCase {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Reverse the string
    #[command(aliases = ["rev"])]
    Reverse {
        /// The string to reverse (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Replaces all matches of a pattern with another string
    Replace {
        #[arg(
            help = "Accepts either:\n- input search replace_with\n- search replace_with (input taken from stdin)",
            value_names = ["input", "search", "replace_with"],
            num_args = 2..=3
        )]
        params: Vec<String>,
    },
    /// Remove whitespaces from the string.
    /// Trims leading and trailing whitespaces by default.
    Trim {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// Trim leading whitespace only
        #[arg(short = 'l', long = "left",
              visible_aliases = ["leading", "start", "ltrim"],
              conflicts_with_all = ["right", "all"])]
        left: bool,

        /// Trim trailing whitespace only
        #[arg(short = 'r', long = "right",
              visible_aliases = ["trailing", "end", "rtrim"],
              conflicts_with_all = ["left", "all"])]
        right: bool,

        /// Trim both sides and collapse internal whitespace
        #[arg(short = 'a', long = "all",
              visible_aliases = ["collapse", "strip", "everything"],
              conflicts_with_all = ["left", "right"])]
        all: bool,
    },
    /// Converts the string into a URL slug
    Slugify {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// The separator to use (uses - (dash) by default)
        #[arg(short = 's', long = "separator", default_value_t = '-')]
        separator: char,
    },
}

#[derive(Subcommand, Debug)]
pub enum UuidOperation {
    /// Generate a v4 UUID
    V4 {
        /// Number of UUIDs to generate (if not provided, defaults to 1)
        #[arg(default_value_t = 1)]
        number: usize,
    },
    /// Generate a v7 UUID
    V7 {
        /// Number of UUIDs to generate (if not provided, defaults to 1)
        #[arg(default_value_t = 1)]
        number: usize,
    },
}
