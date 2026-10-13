//! Deterministic local redaction of recognizable secret values in developer text.
//!
//! Matching uses finite grammars and labels, not entropy or credential verification.
//! Categories can overlap: a provider key inside an authorization header is still
//! an API key when only API keys are selected.

mod connections;
mod fields;
mod keys;
pub mod pii;
mod providers;
mod spans;
mod syntax;

use std::borrow::Cow;
use std::ops::Range;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u8)]
pub enum Category {
    ApiKeys = 1,
    Auth = 2,
    Cookies = 4,
    Databases = 8,
    CryptoKeys = 16,
    Passwords = 32,
    Tokens = 64,
    SignedUrls = 128,
}

impl Category {
    fn placeholder(self) -> &'static str {
        match self {
            Self::ApiKeys => "[REDACTED_API_KEY]",
            Self::Auth => "[REDACTED_AUTH]",
            Self::Cookies => "[REDACTED_COOKIE]",
            Self::Databases => "[REDACTED_DATABASE]",
            Self::CryptoKeys => "[REDACTED_CRYPTO_KEY]",
            Self::Passwords => "[REDACTED_PASSWORD]",
            Self::Tokens => "[REDACTED_TOKEN]",
            Self::SignedUrls => "[REDACTED_SIGNED_URL]",
        }
    }
}

/// Explicit category selection. `NONE` is identity; callers decide their defaults.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Categories(u8);

impl Categories {
    pub const ALL: Self = Self(u8::MAX);
    pub const NONE: Self = Self(0);

    pub const fn only(category: Category) -> Self {
        Self(category as u8)
    }

    pub const fn with(self, category: Category) -> Self {
        Self(self.0 | category as u8)
    }

    pub const fn contains(self, category: Category) -> bool {
        self.0 & category as u8 != 0
    }

    pub const fn bits(self) -> u8 {
        self.0
    }

    pub const fn from_bits(bits: u8) -> Self {
        Self(bits)
    }
}

type Replacement = spans::Span<&'static str>;

struct Matches<'a> {
    input: &'a str,
    replacements: Vec<Replacement>,
}

impl<'a> Matches<'a> {
    fn add(&mut self, range: Range<usize>, category: Category) {
        self.replace(range, category.placeholder());
    }

    fn replace(&mut self, range: Range<usize>, text: &'static str) {
        if range.is_empty()
            || self
                .input
                .get(range.clone())
                .is_none_or(syntax::placeholder)
        {
            return;
        }
        self.replacements.push(Replacement { range, value: text });
    }

    fn render(self) -> Cow<'a, str> {
        let resolved = spans::resolve(self.replacements, |a, b| a.cmp(b));
        spans::render(self.input, &resolved, |text, output| output.push_str(text))
    }
}

/// Replace recognizable selected secrets, preserving original text outside them.
/// Clean input is returned borrowed. There are no network calls or hidden defaults.
pub fn secrets(input: &str, categories: Categories) -> Cow<'_, str> {
    if input.is_empty() || categories == Categories::NONE {
        return Cow::Borrowed(input);
    }
    let mut matches = Matches {
        input,
        replacements: Vec::new(),
    };
    let field_categories =
        Categories::ALL.bits() & !(Category::Databases as u8 | Category::SignedUrls as u8);
    if categories.bits() & field_categories != 0 {
        fields::scan(&mut matches, categories);
    }
    if categories.contains(Category::ApiKeys)
        || categories.contains(Category::Tokens)
        || categories.contains(Category::CryptoKeys)
    {
        providers::scan(&mut matches, categories);
    }
    if categories.contains(Category::Databases) || categories.contains(Category::SignedUrls) {
        connections::scan(&mut matches, categories);
    }
    if categories.contains(Category::CryptoKeys) {
        keys::scan(&mut matches);
    }
    matches.render()
}
