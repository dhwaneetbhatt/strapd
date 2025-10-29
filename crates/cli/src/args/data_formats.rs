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

        /// Whether to sort keys in JSON
        #[arg(short = 's', long = "sort", default_value_t = false)]
        sort: bool,
    },
    /// Minify the json and print
    #[command(aliases = ["strip", "uglify"])]
    Minify {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// Whether to sort keys in JSON
        #[arg(short = 's', long = "sort", default_value_t = false)]
        sort: bool,
    },
    #[command(aliases = ["sort_keys", "arrange"])]
    Sort {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        /// Whether to format the output
        #[arg(short = 'f', long = "format", default_value_t = false)]
        format: bool,
    },
    #[command(aliases = ["transform"])]
    Convert {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        #[arg(short = 't', long = "to")]
        to: String,
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
#[derive(Subcommand, Debug)]
pub enum YamlOperation {
    #[command(aliases = ["transform"])]
    Convert {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        #[arg(short = 't', long = "to")]
        to: String,
    },
}
