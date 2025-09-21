use clap::Subcommand;

#[derive(Subcommand, Debug)]
pub enum UuidOperation {
    /// Generate a v4 UUID
    V4 {
        /// Number of UUIDs to generate (if not provided, defaults to 1)
        #[arg(default_value_t = 1)]
        number: usize,
    },
    /// Generate a v7 UUID
    V7 {
        /// Number of UUIDs to generate (if not provided, defaults to 1)
        #[arg(default_value_t = 1)]
        number: usize,
    },
}
