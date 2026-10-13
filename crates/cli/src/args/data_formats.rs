use clap::{Subcommand, ValueEnum};

#[derive(Clone, Copy, Debug, Default, ValueEnum)]
pub enum JsonOutput {
    #[default]
    Raw,
    Json,
}

#[derive(Subcommand, Debug)]
pub enum JsonOperation {
    /// Remove empty values and optional keys from JSON; optionally sample long arrays
    Prune {
        /// JSON input (reads from stdin if omitted)
        input: Option<String>,

        /// Comma-separated object keys to remove at every depth
        #[arg(long)]
        drop_keys: Option<String>,

        /// Sample arrays using the first 3 entries and the final entry
        #[arg(long)]
        sample: bool,

        /// Override the number of leading entries; also enables sampling
        #[arg(long, value_name = "N")]
        sample_size: Option<usize>,

        /// Raw JSON value or a JSON response with data and metadata
        #[arg(long, value_enum, default_value_t = JsonOutput::Raw)]
        output: JsonOutput,
    },
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

        /// Optional root element name for XML conversion (default: "root")
        #[arg(long = "root")]
        root: Option<String>,
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
    #[command(aliases = ["transform"])]
    Convert {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,

        #[arg(short = 't', long = "to")]
        to: String,
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
