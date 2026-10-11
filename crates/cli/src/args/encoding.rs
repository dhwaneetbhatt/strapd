use clap::Subcommand;

#[derive(Subcommand, Debug)]
pub enum Base64Operation {
    /// Encode bytes to base64
    Encode {
        /// Text argument or exact bytes from stdin
        input: Option<String>,
    },
    /// Decode a base64 string
    Decode {
        /// Base64 text (if not provided, reads from stdin)
        input: Option<String>,
    },
}

#[derive(Subcommand, Debug)]
pub enum UrlOperation {
    /// Hex encode bytes
    Encode {
        /// Text argument or exact bytes from stdin
        input: Option<String>,
    },
    /// Decode a hex string
    Decode {
        /// Hex text (if not provided, reads from stdin)
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
