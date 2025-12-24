use clap::{Args, Subcommand};

#[derive(Subcommand, Debug)]
pub enum RandomOperation {
    /// Generate a random string
    #[command(aliases = ["str", "text"])]
    String {
        #[command(flatten)]
        args: RandomStringArgs,
    },
    /// Generate a random number
    #[command(aliases = ["num", "int"])]
    Number {
        /// Minimum value (inclusive)
        /// For negative values, use `--min=-10` (with `=`) due to CLI parsing rules.
        #[arg(long, default_value = "0")]
        min: i64,

        /// Maximum value (inclusive)
        /// For negative values, use `--max=-10` (with `=`) due to CLI parsing rules.
        #[arg(long, default_value = "100")]
        max: i64,

        /// Number of values to generate
        #[arg(long, short = 'n', default_value = "1")]
        count: usize,
    },
}

#[derive(Args, Debug, Clone)]
pub struct RandomStringArgs {
    /// Length of the string (default: 16)
    #[arg(default_value = "16")]
    pub length: u8,

    /// Include lowercase letters (default: true if no flags specified)
    #[arg(short = 'l', long, visible_aliases = ["lower"])]
    pub lowercase: bool,

    /// Include uppercase letters (default: true if no flags specified)
    #[arg(short = 'u', long, visible_aliases = ["upper"])]
    pub uppercase: bool,

    /// Include digits (default: true if no flags specified)
    #[arg(short = 'd', long, visible_aliases = ["numbers"])]
    pub digits: bool,

    /// Include symbols (default: true if no flags specified)
    #[arg(short = 's', long, visible_aliases = ["special"])]
    pub symbols: bool,

    /// Custom characters to include (combined with above flags)
    #[arg(long, visible_aliases = ["chars"])]
    pub charset: Option<String>,

    /// Number of strings to generate
    #[arg(long, short = 'n', default_value = "1")]
    pub count: usize,
}
