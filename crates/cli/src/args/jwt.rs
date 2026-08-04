use clap::{Args, Subcommand, ValueEnum};

#[derive(Subcommand, Debug)]
pub enum JwtOperation {
    /// Decode the JWT header and payload
    #[command(
        aliases = ["inspect", "parse"],
        after_long_help = "Examples:\n  strapd jwt decode <token>\n  strapd paste | strapd jwt decode\n  strapd jwt decode <token> --include-analysis"
    )]
    Decode {
        /// Compact JWT or Authorization header (reads from stdin if omitted)
        token: Option<String>,

        /// Include derived expiration and signature analysis
        #[arg(long, visible_aliases = ["analyze", "analyse"])]
        include_analysis: bool,
    },
    /// Decode only the JWT claims payload
    #[command(
        alias = "body",
        after_long_help = "Examples:\n  strapd jwt payload <token>\n  strapd paste | strapd jwt payload | strapd json beautify"
    )]
    Payload {
        /// Compact JWT or Authorization header (reads from stdin if omitted)
        token: Option<String>,
    },
    /// Decode only the JWT protected header
    #[command(
        alias = "meta",
        after_long_help = "Examples:\n  strapd jwt header <token>\n  strapd paste | strapd jwt meta"
    )]
    Header {
        /// Compact JWT or Authorization header (reads from stdin if omitted)
        token: Option<String>,
    },
    /// Verify an HMAC JWT signature using its protected algorithm
    #[command(
        alias = "check",
        after_long_help = "Examples:\n  strapd jwt verify <token> --secret dev-secret\n  strapd jwt verify <token> --secret-env JWT_SECRET\n  pbpaste | strapd jwt check --secret-env JWT_SECRET"
    )]
    Verify {
        /// Compact JWT or Authorization header (reads from stdin if omitted)
        token: Option<String>,

        #[command(flatten)]
        secret: SecretArgs,
    },
    /// Sign a JSON claims object as an HMAC JWT
    #[command(
        aliases = ["gen", "create"],
        after_long_help = "Examples:\n  strapd jwt sign '{\"sub\":\"usr_123\"}' --secret dev-secret\n  echo '{\"sub\":\"usr_123\"}' | strapd jwt sign --secret-env JWT_SECRET\n  strapd jwt sign '{}' --secret dev-secret --algorithm HS512 --exp 3600"
    )]
    Sign {
        /// JSON claims object (reads from stdin if omitted)
        payload: Option<String>,

        #[command(flatten)]
        secret: SecretArgs,

        /// HMAC signing algorithm
        #[arg(long, value_enum, ignore_case = true, default_value_t = JwtAlgorithm::Hs256)]
        algorithm: JwtAlgorithm,

        /// Expiration duration in seconds from the current time
        #[arg(long, value_parser = clap::value_parser!(i64).range(1..))]
        exp: Option<i64>,
    },
}

#[derive(Args, Debug)]
#[group(required = true, multiple = false)]
pub struct SecretArgs {
    /// HMAC secret value
    #[arg(long)]
    pub secret: Option<String>,

    /// Name of an environment variable containing the HMAC secret
    #[arg(long)]
    pub secret_env: Option<String>,
}

#[derive(ValueEnum, Debug, Clone, Copy, Default)]
pub enum JwtAlgorithm {
    #[default]
    Hs256,
    Hs384,
    Hs512,
}

impl From<JwtAlgorithm> for strapd_core::jwt::Algorithm {
    fn from(value: JwtAlgorithm) -> Self {
        match value {
            JwtAlgorithm::Hs256 => Self::HS256,
            JwtAlgorithm::Hs384 => Self::HS384,
            JwtAlgorithm::Hs512 => Self::HS512,
        }
    }
}
