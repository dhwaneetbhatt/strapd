use clap::Subcommand;

#[derive(Subcommand, Debug)]
pub enum Base64Operation {
    /// Encode bytes to base64
    Encode {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Decode a base64 string
    Decode {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
}

#[derive(Subcommand, Debug)]
pub enum UrlOperation {
    /// URL encode the string
    Encode {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Decode the URL encoded string
    Decode {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
}

#[derive(Subcommand, Debug)]
pub enum HexOperation {
    /// URL encode the string
    Encode {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Decode the URL encoded string
    Decode {
        /// The string to convert (if not provided, reads from stdin)
        input: Option<String>,
    },
}
