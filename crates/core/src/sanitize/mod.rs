//! Deterministic local redaction of recognizable secret values in developer text.
//!
//! Matching uses finite grammars and labels, not entropy or credential verification.
//! Categories can overlap: a provider key inside an authorization header is still
//! an API key when only API keys are selected.

mod connections;
mod fields;
mod keys;
mod providers;
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

struct Replacement {
    range: Range<usize>,
    text: &'static str,
}

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
        self.replacements.push(Replacement { range, text });
    }

    fn render(mut self) -> Cow<'a, str> {
        if self.replacements.is_empty() {
            return Cow::Borrowed(self.input);
        }
        // Outer containers win. Intersecting spans are merged before rendering so
        // no detection can expose a suffix or scan replacement text.
        self.replacements.sort_unstable_by(|left, right| {
            left.range
                .start
                .cmp(&right.range.start)
                .then_with(|| right.range.end.cmp(&left.range.end))
                .then_with(|| left.text.cmp(right.text))
        });
        let mut result = String::with_capacity(self.input.len());
        let mut cursor = 0;
        let mut pending: Option<Replacement> = None;
        for replacement in self.replacements {
            if let Some(previous) = pending.as_mut() {
                if replacement.range.start < previous.range.end {
                    previous.range.end = previous.range.end.max(replacement.range.end);
                    continue;
                }
                result.push_str(&self.input[cursor..previous.range.start]);
                result.push_str(previous.text);
                cursor = previous.range.end;
            }
            pending = Some(replacement);
        }
        if let Some(previous) = pending {
            result.push_str(&self.input[cursor..previous.range.start]);
            result.push_str(previous.text);
            cursor = previous.range.end;
        }
        result.push_str(&self.input[cursor..]);
        Cow::Owned(result)
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
