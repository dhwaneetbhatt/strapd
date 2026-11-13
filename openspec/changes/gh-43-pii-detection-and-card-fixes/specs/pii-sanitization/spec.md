## ADDED Requirements

### Requirement: Public detection returns resolved byte spans
The library SHALL expose category and half-open UTF-8 byte ranges in input order after the same overlap resolution used by sanitization. Empty input, no selected categories and clean input SHALL return an empty collection without allocating. Detection SHALL NOT canonicalize identities or render masked output.

#### Scenario: Detection and replacement parity
- **WHEN** selected categories detect mixed UTF-8 text
- **THEN** replacing the reported spans with category placeholders exactly reproduces mask mode, and pseudonym mode replaces the same spans

### Requirement: Browser WASM exposes resolved detections
Browser WASM SHALL return detections as packed u32 category/start/end triples with the same resolved UTF-8 byte ranges as the public Rust API. Category values SHALL equal the existing category bits.

#### Scenario: Browser detection preserves offsets and selection
- **WHEN** browser WASM detects selected categories in UTF-8 text and compact JSON
- **THEN** its packed triples match native detection, and clean input or no selected categories return an empty array

### Requirement: Numeric JSON fields preserve detection semantics
Quoted JSON keys followed immediately by a colon and a numeric value SHALL recognize cards, labelled local phones and Aadhaar identically to spaced JSON. Exact card labels SHALL include card; metadata labels SHALL NOT gain fallback behavior.

#### Scenario: Compact and spaced numeric fields
- **WHEN** card, phone or Aadhaar numeric fields differ only by whitespace after their colon
- **THEN** detected category and value are identical, including invalid-checksum labelled fallback

## MODIFIED Requirements

### Requirement: Payment card recognition requires plausible structure
The payment-card category SHALL recognize standalone candidates containing 13 through 19 digits with no separator or with common space or hyphen grouping only when their normalized digits pass the Luhn checksum and their prefix and length fit Visa (4, 13/16/19), Mastercard (51–55 or 2221–2720, 16), Amex (34/37, 15), Discover (6011/65/644–649, 16/19), RuPay (60/65/81/82/508, 16), Diners (300–305/36/38/39, 14), or JCB (3528–3589, 16). Values in explicit payment-card-number fields SHALL be protected when they have a plausible digit count and grouping even if the checksum is invalid, so truncated, synthetic, or mistyped logged values do not escape sanitization. Recognition SHALL replace the complete candidate and SHALL accept common 4-6-5 and 4-6-4 grouping as well as groups of four. Labelled fallback SHALL NOT require a supported issuer prefix. Recognition SHALL NOT contact an issuer or payment network.

#### Scenario: Recognize a grouped card number
- **WHEN** a standalone space- or hyphen-grouped card candidate has 13 through 19 digits and passes issuer/length and Luhn validation
- **THEN** the entire candidate is replaced as one payment-card value

#### Scenario: Preserve a random numeric identifier
- **WHEN** an unlabeled numeric sequence fails card length, grouping, issuer/brand length, or Luhn validation
- **THEN** payment-card recognition leaves it unchanged

#### Scenario: Protect an invalid labeled card value
- **WHEN** a plausibly formatted value appears under a semantic card-number label but fails Luhn validation
- **THEN** it is still replaced as a payment-card value

#### Scenario: Recognize Amex and Diners groups
- **WHEN** checksum-valid Amex or Diners values use consistent space or hyphen 4-6-5 or 4-6-4 groups
- **THEN** each complete candidate is recognized as one payment card
