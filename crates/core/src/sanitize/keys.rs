use super::syntax;
use super::{Category, Matches};

pub(super) fn scan(matches: &mut Matches<'_>) {
    if matches.input.contains("-----BEGIN ") {
        private_blocks(matches);
    }
    if matches.input.contains("\"kty\"") || matches.input.contains("\\u") {
        jwks(matches);
    }
}

const PRIVATE_LABELS: &[&str] = &[
    "PRIVATE KEY",
    "ENCRYPTED PRIVATE KEY",
    "RSA PRIVATE KEY",
    "EC PRIVATE KEY",
    "DSA PRIVATE KEY",
    "OPENSSH PRIVATE KEY",
    "PGP PRIVATE KEY BLOCK",
];

fn private_blocks(matches: &mut Matches<'_>) {
    let input = matches.input;
    let bytes = input.as_bytes();
    let mut offset = 0;
    let mut containers = Vec::new();
    // Quoted values are indexed once; searching backwards from every opening
    // marker would make repeated malformed input quadratic.
    while offset < bytes.len() {
        if matches!(bytes[offset], b'"' | b'\'') {
            let value = syntax::quoted(bytes, offset);
            offset = value.end;
            containers.push(value.content);
        } else {
            offset += 1;
        }
    }
    offset = 0;
    while let Some(length) = input[offset..].find("-----BEGIN ") {
        let start = offset + length;
        let label_start = start + "-----BEGIN ".len();
        let header_limit = (label_start + 40).min(input.len());
        let Some(header_tail) = bytes[label_start..header_limit]
            .windows(5)
            .position(|window| window == b"-----")
        else {
            offset = label_start;
            continue;
        };
        let label_end = label_start + header_tail;
        let Some(label) = input.get(label_start..label_end) else {
            offset = label_end + 5;
            continue;
        };
        if !PRIVATE_LABELS.contains(&label) {
            offset = label_end + 5;
            continue;
        }
        let container_index = containers.partition_point(|range| range.start <= start);
        let limit = container_index
            .checked_sub(1)
            .and_then(|index| containers.get(index))
            .filter(|range| range.contains(&start))
            .map_or(input.len(), |range| range.end);
        let closing = format!("-----END {label}-----");
        let body_start = label_end + 5;
        let end = input
            .get(body_start..limit)
            .and_then(|body| body.find(&closing))
            .map_or(limit, |length| body_start + length + closing.len());
        matches.add(start..end, Category::CryptoKeys);
        offset = end.max(body_start);
    }
}

#[derive(Clone, Copy)]
enum Field {
    KeyType,
    PrivateExponent,
    RsaParameter,
    SymmetricKey,
    OtherPrimes,
    Other,
}

impl Field {
    fn parse(name: &str) -> Self {
        if name.contains('\\') && name.len() <= 128 {
            if let Ok(decoded) = serde_json::from_str::<String>(&format!("\"{name}\"")) {
                return Self::parse(&decoded);
            }
            return Self::Other;
        }
        match name {
            "kty" => Self::KeyType,
            "d" => Self::PrivateExponent,
            "p" | "q" | "dp" | "dq" | "qi" => Self::RsaParameter,
            "k" => Self::SymmetricKey,
            "oth" => Self::OtherPrimes,
            _ => Self::Other,
        }
    }

    fn is_private(self, key_types: u8) -> bool {
        match self {
            Self::PrivateExponent => key_types & 3 != 0,
            Self::RsaParameter | Self::OtherPrimes => key_types & 1 != 0,
            Self::SymmetricKey => key_types & 4 != 0,
            Self::KeyType | Self::Other => false,
        }
    }
}

struct Member {
    field: Field,
    range: std::ops::Range<usize>,
    quoted: bool,
}

struct Container {
    start: usize,
    object: bool,
    incoming_field: Option<Field>,
    pending_field: Option<Field>,
    awaiting_value: bool,
    key_types: u8,
    members: Vec<Member>,
}

impl Container {
    fn record(&mut self, field: Field, range: std::ops::Range<usize>, quoted: bool, input: &str) {
        if matches!(field, Field::KeyType) && quoted {
            let raw = &input[range];
            let decoded = if raw.contains('\\') && raw.len() <= 128 {
                serde_json::from_str::<String>(&format!("\"{raw}\"")).ok()
            } else {
                None
            };
            self.key_types |= match decoded.as_deref().unwrap_or(raw) {
                "RSA" => 1,
                "EC" | "OKP" => 2,
                "oct" => 4,
                _ => 0,
            };
        } else if !matches!(field, Field::Other | Field::KeyType) {
            self.members.push(Member {
                field,
                range,
                quoted,
            });
        }
    }

    fn take_field(&mut self) -> Option<Field> {
        if !self.awaiting_value {
            return None;
        }
        self.awaiting_value = false;
        self.pending_field.take()
    }
}

fn jwks(matches: &mut Matches<'_>) {
    let input = matches.input;
    let bytes = input.as_bytes();
    let mut containers: Vec<Container> = Vec::new();
    let mut offset = 0;
    while offset < bytes.len() {
        match bytes[offset] {
            b'{' | b'[' => {
                let incoming_field = containers.last_mut().and_then(Container::take_field);
                containers.push(Container {
                    start: offset,
                    object: bytes[offset] == b'{',
                    incoming_field,
                    pending_field: None,
                    awaiting_value: false,
                    key_types: 0,
                    members: Vec::new(),
                });
                offset += 1;
            }
            b'}' | b']' => {
                if let Some(container) = containers.pop() {
                    redact_members(matches, &container);
                    if let (Some(parent), Some(field)) =
                        (containers.last_mut(), container.incoming_field)
                    {
                        parent.record(field, container.start..offset + 1, false, input);
                    }
                }
                offset += 1;
            }
            b'"' => {
                let value = syntax::quoted(bytes, offset);
                let mut after = value.end;
                while bytes.get(after).is_some_and(u8::is_ascii_whitespace) {
                    after += 1;
                }
                if let Some(container) = containers.last_mut() {
                    if container.object && bytes.get(after) == Some(&b':') {
                        container.pending_field = Some(Field::parse(&input[value.content]));
                        container.awaiting_value = true;
                        offset = after + 1;
                        continue;
                    }
                    if let Some(field) = container.take_field() {
                        container.record(field, value.content, true, input);
                    }
                }
                offset = value.end;
            }
            byte if byte.is_ascii_whitespace() || matches!(byte, b':' | b',') => {
                offset += 1;
            }
            _ => {
                let start = offset;
                while bytes.get(offset).is_some_and(|byte| {
                    !byte.is_ascii_whitespace()
                        && !matches!(byte, b',' | b'}' | b']' | b'{' | b'[' | b'"')
                }) {
                    offset += 1;
                }
                if let Some(container) = containers.last_mut()
                    && let Some(field) = container.take_field()
                {
                    container.record(field, start..offset, false, input);
                }
            }
        }
    }
    // A truncated object can still have an unambiguous kty and private fields.
    while let Some(container) = containers.pop() {
        redact_members(matches, &container);
        if let (Some(parent), Some(field)) = (containers.last_mut(), container.incoming_field) {
            parent.record(field, container.start..input.len(), false, input);
        }
    }
}

fn redact_members(matches: &mut Matches<'_>, container: &Container) {
    for member in &container.members {
        if !member.field.is_private(container.key_types) {
            continue;
        }
        if member.quoted {
            matches.add(member.range.clone(), Category::CryptoKeys);
        } else {
            matches.replace(member.range.clone(), "\"[REDACTED_CRYPTO_KEY]\"");
        }
    }
}
