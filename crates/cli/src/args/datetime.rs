use clap::{Subcommand, ValueEnum};

#[derive(Subcommand, Debug)]
pub enum TimeOperation {
    /// Get current Unix timestamp
    Now {
        /// Output in milliseconds
        #[arg(short = 'm', long)]
        millis: bool,

        /// Format the output to human readable string
        #[arg(short = 'f', long)]
        format: Option<TimestampFormat>,
    },

    /// Convert timestamp to human-readable date
    From {
        /// Unix timestamp (reads from stdin if not provided)
        timestamp: Option<i64>,

        /// Input is in milliseconds
        #[arg(short = 'm', long)]
        millis: bool,

        /// Format of the datetime output
        #[arg(short = 'f', long)]
        format: Option<TimestampFormat>,
    },
}

#[derive(Clone, Debug, ValueEnum)]
pub enum TimestampFormat {
    /// Human-readable format (YYYY-MM-DD HH:MM:SS UTC)
    Human,
    /// ISO 8601 / RFC 3339 format
    Iso,
}
