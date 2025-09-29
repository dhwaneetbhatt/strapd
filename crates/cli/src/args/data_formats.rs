use clap::Subcommand;

#[derive(Subcommand, Debug)]
pub enum JsonOperation {
    /// Formats and prints the json
    #[command(aliases = ["format", "pretty", "indent", "prettify", "fmt", "readable"])]
    Beautify {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// The number of spaces to use as indentation
        #[arg(default_value_t = 2)]
        spaces: u8,
    },
    /// Minify the json and print
    #[command(aliases = ["strip", "uglify"])]
    Minify {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
}

#[derive(Subcommand, Debug)]
pub enum XmlOperation {
    /// Formats and prints the json
    #[command(aliases = ["format", "pretty", "indent", "prettify", "fmt", "readable"])]
    Beautify {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// The number of spaces to use as indentation
        #[arg(default_value_t = 2)]
        spaces: u8,
    },
    /// Minify the json and print
    #[command(aliases = ["strip", "uglify"])]
    Minify {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
}

#[derive(Subcommand, Debug)]
pub enum SqlOperation {
    /// Formats and prints the json
    #[command(aliases = ["format", "pretty", "indent", "prettify", "fmt", "readable"])]
    Beautify {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// The number of spaces to use as indentation
        #[arg(default_value_t = 2)]
        spaces: u8,
    },
    /// Minify the json and print
    #[command(aliases = ["strip", "uglify"])]
    Minify {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
}
