use clap::{Args, Subcommand, ValueEnum};
use std::path::PathBuf;
use strapd_core::string::diff::DEFAULT_CONTEXT;

#[derive(Subcommand, Debug)]
pub enum StringOperation {
    /// Compare two UTF-8 texts
    Diff(DiffArgs),
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
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// Text to find/search
        #[arg(short = 'f', long = "find", visible_short_alias = 's', visible_aliases = ["search", "pattern", "match"])]
        find: String,

        /// Text to replace
        #[arg(short = 'r', long = "replace", visible_short_alias = 'w', visible_aliases = ["with", "replacement"])]
        replace: String,
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
    /// Generate a random string
    #[command(aliases = ["rand"])]
    Random {
        #[command(flatten)]
        args: super::random::RandomStringArgs,
    },
    /// Count the lines, words, chars and bytes of a string
    #[command(aliases = ["stats"])]
    Count {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// Count the lines
        #[arg(short = 'l', long = "lines")]
        lines: bool,

        /// Count the words
        #[arg(short = 'w', long = "words")]
        words: bool,

        /// Count the characters
        #[arg(short = 'c', long = "characters")]
        chars: bool,

        /// Count the bytes
        #[arg(short = 'b', long = "bytes")]
        bytes: bool,
    },
    // Analyse the words and chars in a string
    #[command(aliases = ["analyse", "analyze", "freq"])]
    Frequency {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// Count the words
        #[arg(short = 'w', long = "words", conflicts_with_all = ["chars"])]
        words: bool,

        /// Count the characters
        #[arg(short = 'c', long = "characters", conflicts_with_all = ["words"])]
        chars: bool,
    },
}

#[derive(Args, Debug)]
pub struct DiffArgs {
    /// Literal text for each side without a file; use - to read one side from stdin
    #[arg(value_name = "TEXT")]
    pub inputs: Vec<String>,

    /// Read the from side from a file
    #[arg(long, value_name = "PATH")]
    pub from_file: Option<PathBuf>,

    /// Read the to side from a file
    #[arg(long, value_name = "PATH")]
    pub to_file: Option<PathBuf>,

    /// Number of unchanged context lines
    #[arg(short = 'U', long = "unified", value_name = "N", default_value_t = DEFAULT_CONTEXT as u32)]
    pub context: u32,

    /// Show the old and new lines in two columns
    #[arg(short = 'y', long)]
    pub side_by_side: bool,

    /// Total width of side-by-side output
    #[arg(short = 'W', long, value_name = "N", default_value_t = 130, requires = "side_by_side",
        value_parser = clap::value_parser!(u32).range(3..))]
    pub width: u32,

    /// Override the from label, then optionally the to label
    #[arg(long = "label", value_name = "TEXT", action = clap::ArgAction::Append)]
    pub labels: Vec<String>,

    /// When to use ANSI colour
    #[arg(long, value_enum, default_value = "auto")]
    pub color: DiffColor,

    /// Exit 1 if the inputs differ, or 2 on error
    #[arg(long)]
    pub exit_code: bool,
}

#[derive(Clone, Copy, Debug, ValueEnum)]
pub enum DiffColor {
    Auto,
    Always,
    Never,
}
