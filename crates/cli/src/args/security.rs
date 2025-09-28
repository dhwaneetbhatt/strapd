use clap::Subcommand;

#[derive(Subcommand, Debug)]
pub enum HashOperation {
    /// Generate MD5 hash of the data
    Md5 {
        /// The string that needs to be hashed (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Generate SHA1 hash of the data
    Sha1 {
        /// The string that needs to be hashed (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Generate SHA256 hash of the data
    Sha256 {
        /// The string that needs to be hashed (if not provided, reads from stdin)
        input: Option<String>,
    },
    /// Generate SHA512 hash of the data
    Sha512 {
        /// The string that needs to be hashed (if not provided, reads from stdin)
        input: Option<String>,
    },
}
