use clap::Subcommand;
use strapd_core::sanitize::{Categories, Category};

const PII_HELP: &str = "Mask personal identifiers locally. Select categories with flags (default: all). Pass TEXT or pipe stdin. See docs/sanitize-pii.md for details.";
const SECRETS_HELP: &str = "Redact secrets locally. Select categories with flags (default: all). Pass TEXT or pipe stdin. See docs/sanitize-secrets.md for details.";

#[derive(Subcommand, Debug)]
pub enum SanitizeOperation {
    /// Redact recognized secrets from text (alias: `redact`)
    #[command(aliases = ["redact"], long_about = SECRETS_HELP)]
    Secrets(SecretsArgs),
    /// Mask or pseudonymize personal identifiers locally
    #[command(long_about = PII_HELP)]
    Pii(PiiArgs),
}

#[derive(clap::Args, Debug)]
#[command(about = "Mask or pseudonymize personal identifiers offline")]
pub struct PiiArgs {
    /// Text to sanitize; otherwise read stdin
    pub text: Option<String>,
    /// Select all categories (conflicts with individual category flags)
    #[arg(long, conflicts_with_all = ["ip_addresses", "emails", "phone_numbers", "payment_cards", "aadhaar", "pan"])]
    pub all: bool,
    /// Mask IPv4 and IPv6 addresses
    #[arg(long)]
    pub ip_addresses: bool,
    /// Mask common ASCII email addresses
    #[arg(long)]
    pub emails: bool,
    /// Mask international, formatted, or labelled phone numbers
    #[arg(long)]
    pub phone_numbers: bool,
    /// Mask payment card numbers
    #[arg(long)]
    pub payment_cards: bool,
    /// Mask Aadhaar numbers
    #[arg(long)]
    pub aadhaar: bool,
    /// Mask PAN numbers
    #[arg(long)]
    pub pan: bool,
    /// Use numbered placeholders, consistent within this run
    #[arg(long, short = 'p')]
    pub pseudonymize: bool,
}

impl PiiArgs {
    pub fn categories(&self) -> strapd_core::sanitize::pii::Categories {
        use strapd_core::sanitize::pii::{Categories, Category};
        let mut selected = Categories::NONE;
        for (enabled, category) in [
            (self.ip_addresses, Category::IpAddresses),
            (self.emails, Category::Emails),
            (self.phone_numbers, Category::PhoneNumbers),
            (self.payment_cards, Category::PaymentCards),
            (self.aadhaar, Category::Aadhaar),
            (self.pan, Category::Pan),
        ] {
            if enabled {
                selected = selected.with(category);
            }
        }
        if self.all || selected == Categories::NONE {
            Categories::ALL
        } else {
            selected
        }
    }
}

#[derive(clap::Args, Debug)]
#[command(about = "Redact recognizable secrets from text locally")]
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
