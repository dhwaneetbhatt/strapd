use clap::Subcommand;
use strapd_core::sanitize::{Categories, Category};

#[derive(Subcommand, Debug)]
pub enum SanitizeOperation {
    /// Redact recognized secrets from text (alias: `redact`)
    #[command(aliases = ["redact"])]
    Secrets(SecretsArgs),
}

#[derive(clap::Args, Debug)]
#[command(
    about = "Redact recognizable secrets from text locally",
    long_about = "Redact recognizable secrets from text offline using finite deterministic patterns. Omit category flags to enable all categories. Aliases: `strapd redact secrets` and `strapd sanitize redact`. Public Google API keys may be redacted; truncated secret blocks are redacted through the remaining input. Opaque, encoded, and binary credentials are unsupported, and coverage or credential validity is not guaranteed. Pass TEXT as an argument or pipe text through stdin."
)]
pub struct SecretsArgs {
    /// Text to sanitize; if omitted, read text from stdin
    pub text: Option<String>,

    /// Select all categories (cannot be combined with category flags)
    #[arg(long, conflicts_with_all = [
        "api_keys", "auth", "cookies", "databases", "crypto_keys", "passwords", "tokens", "signed_urls"
    ])]
    pub all: bool,

    /// Redact API keys
    #[arg(long = "api-keys", conflicts_with = "all")]
    pub api_keys: bool,

    /// Redact authorization credentials
    #[arg(long, conflicts_with = "all")]
    pub auth: bool,

    /// Redact cookie values
    #[arg(long, conflicts_with = "all")]
    pub cookies: bool,

    /// Redact database credentials
    #[arg(long, conflicts_with = "all")]
    pub databases: bool,

    /// Redact cryptographic key material
    #[arg(long = "crypto-keys", conflicts_with = "all")]
    pub crypto_keys: bool,

    /// Redact passwords and passphrases
    #[arg(long, conflicts_with = "all")]
    pub passwords: bool,

    /// Redact tokens
    #[arg(long, conflicts_with = "all")]
    pub tokens: bool,

    /// Redact signed URL credentials
    #[arg(long = "signed-urls", conflicts_with = "all")]
    pub signed_urls: bool,
}

impl SecretsArgs {
    pub fn categories(&self) -> Categories {
        let mut categories = Categories::NONE;
        for (enabled, category) in [
            (self.api_keys, Category::ApiKeys),
            (self.auth, Category::Auth),
            (self.cookies, Category::Cookies),
            (self.databases, Category::Databases),
            (self.crypto_keys, Category::CryptoKeys),
            (self.passwords, Category::Passwords),
            (self.tokens, Category::Tokens),
            (self.signed_urls, Category::SignedUrls),
        ] {
            if enabled {
                categories = categories.with(category);
            }
        }

        if self.all || categories == Categories::NONE {
            Categories::ALL
        } else {
            categories
        }
    }
}
