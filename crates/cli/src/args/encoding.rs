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
