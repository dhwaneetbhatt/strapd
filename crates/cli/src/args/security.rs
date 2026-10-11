use clap::Subcommand;

#[derive(Subcommand, Debug)]
pub enum HashOperation {
    /// Generate MD5 hash of the data
    Md5 {
        /// Message to hash; stdin also accepts arbitrary bytes
        input: Option<String>,
    },
    /// Generate SHA1 hash of the data
    Sha1 {
        /// Message to hash; stdin also accepts arbitrary bytes
        input: Option<String>,
    },
    /// Generate SHA256 hash of the data
    Sha256 {
        /// Message to hash; stdin also accepts arbitrary bytes
        input: Option<String>,
    },
    /// Generate SHA512 hash of the data
    Sha512 {
        /// Message to hash; stdin also accepts arbitrary bytes
        input: Option<String>,
    },
}

#[derive(Subcommand, Debug)]
pub enum HmacOperation {
    /// Generate SHA256 hash of the data
    Sha256 {
        /// The secret key
        secret: String,

        /// Message to authenticate; stdin also accepts arbitrary bytes
        input: Option<String>,
    },
    /// Generate SHA512 hash of the data
    Sha512 {
        /// The secret key
        secret: String,

        /// Message to authenticate; stdin also accepts arbitrary bytes
        input: Option<String>,
    },
}
