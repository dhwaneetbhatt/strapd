//! Offline, bounded recognition of common personal identifiers.
mod contacts;
mod numbers;
mod scanner;

use super::spans::{self, Span};
use std::{borrow::Cow, collections::HashMap, net::IpAddr};

/// One resolved match, with a half-open UTF-8 byte range in the original input.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Match {
    pub category: Category,
    pub range: std::ops::Range<usize>,
}

/// Detect selected identifiers in input order using the same spans as sanitization.
/// Clean input returns an empty vector without allocating.
pub fn detect(input: &str, categories: Categories) -> Vec<Match> {
    resolved(input, categories, false)
        .into_iter()
        .map(|span| Match {
            category: span.value.category,
            range: span.range,
        })
        .collect()
}

#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
#[repr(u8)]
pub enum Category {
    IpAddresses = 1,
    Emails = 2,
    PhoneNumbers = 4,
    PaymentCards = 8,
    Aadhaar = 16,
    Pan = 32,
}

impl Category {
    fn name(self) -> &'static str {
        match self {
            Self::IpAddresses => "IP_ADDRESS",
            Self::Emails => "EMAIL",
            Self::PhoneNumbers => "PHONE_NUMBER",
            Self::PaymentCards => "PAYMENT_CARD",
            Self::Aadhaar => "AADHAAR",
            Self::Pan => "PAN",
        }
    }

    fn placeholder(self) -> &'static str {
        match self {
            Self::IpAddresses => "[REDACTED_IP_ADDRESS]",
            Self::Emails => "[REDACTED_EMAIL]",
            Self::PhoneNumbers => "[REDACTED_PHONE_NUMBER]",
            Self::PaymentCards => "[REDACTED_PAYMENT_CARD]",
            Self::Aadhaar => "[REDACTED_AADHAAR]",
            Self::Pan => "[REDACTED_PAN]",
        }
    }
}

/// Explicit selection; interfaces choose their own defaults.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Categories(u8);

impl Categories {
    pub const ALL: Self = Self(63);
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
        Self(bits & 63)
    }
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum Mode {
    #[default]
    Mask,
    Pseudonymize,
}

#[derive(Eq, Hash, PartialEq)]
enum Canonical<'a> {
    Ip(IpAddr),
    Text(Cow<'a, str>),
}

struct Identity<'a> {
    category: Category,
    canonical: Canonical<'a>,
}

/// Preserve surrounding bytes, returning clean input borrowed. Pseudonym mappings
/// exist only for this invocation and are numbered after overlap resolution.
pub fn sanitize(input: &str, categories: Categories, mode: Mode) -> Cow<'_, str> {
    let matches = resolved(input, categories, mode == Mode::Pseudonymize);
    let mut identities = HashMap::new();
    let mut counts = [0; 6];
    spans::render(input, &matches, |identity, output| {
        if mode == Mode::Mask {
            output.push_str(identity.category.placeholder());
        } else {
            let key = (identity.category, &identity.canonical);
            let token = identities.entry(key).or_insert_with(|| {
                let index = (identity.category as u8).trailing_zeros() as usize;
                counts[index] += 1;
                format!("[{}_{}]", identity.category.name(), counts[index])
            });
            output.push_str(token);
        }
    })
}

fn resolved(input: &str, categories: Categories, pseudonymize: bool) -> Vec<Span<Identity<'_>>> {
    if input.is_empty() || categories == Categories::NONE {
        return Vec::new();
    }
    spans::resolve(scanner::scan(input, categories, pseudonymize), |a, b| {
        (a.category as u8).cmp(&(b.category as u8))
    })
}

fn candidate<'a>(
    range: std::ops::Range<usize>,
    category: Category,
    canonical: Canonical<'a>,
) -> Span<Identity<'a>> {
    Span {
        range,
        value: Identity {
            category,
            canonical,
        },
    }
}
