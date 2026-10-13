# PII Sanitization Specification

## Purpose

Provide fast, deterministic, configurable local masking and pseudonymization of recognizable personal identifiers in developer text through the CLI, WebApp, reusable Pipes, and shared Rust core.

## Requirements

### Requirement: Users select PII categories and replacement mode
The sanitizer SHALL expose IP addresses, email addresses, phone numbers, payment card numbers, Aadhaar numbers, and PAN numbers as independently selectable categories. CLI category flags SHALL be `--ip-addresses`, `--emails`, `--phone-numbers`, `--payment-cards`, `--aadhaar`, and `--pan`. Omission of category flags SHALL select all categories; `--all` SHALL explicitly select all. Multiple category flags SHALL select their union, and `--all` combined with a category flag SHALL be rejected with helpful guidance. Masking SHALL be the default mode, while `--pseudonymize` and `-p` SHALL select pseudonymization. Explicit selection of no categories through the library or WebApp SHALL preserve input.

#### Scenario: Default masking and explicit all agree
- **WHEN** the same input is sanitized without category flags and with `--all`
- **THEN** both results mask every recognized category identically

#### Scenario: Select Indian identifiers and pseudonymize
- **WHEN** input containing several PII categories is processed with `--aadhaar --pan --pseudonymize`
- **THEN** only Aadhaar and PAN matches are replaced with pseudonyms

#### Scenario: Reject conflicting selection
- **WHEN** `--all` is combined with one or more category flags
- **THEN** the CLI rejects the invocation and explains how category selection works

### Requirement: Masking is deterministic and preserves surrounding text
Mask mode SHALL replace complete recognized values with `[REDACTED_IP_ADDRESS]`, `[REDACTED_EMAIL]`, `[REDACTED_PHONE_NUMBER]`, `[REDACTED_PAYMENT_CARD]`, `[REDACTED_AADHAAR]`, or `[REDACTED_PAN]` according to category. It SHALL preserve all text and whitespace outside selected matches, handle UTF-8 safely, preserve ordinary non-PII text, and return identical output on repeated equivalent calls. Reprocessing masked output SHALL leave it unchanged. Overlapping enabled matches SHALL be resolved deterministically without exposing a matched suffix or processing replacement text as new input.

#### Scenario: Preserve ordinary and empty input
- **WHEN** empty input or ordinary text containing Unicode, spaces, CRLF, punctuation, or a literal `Error:` prefix is masked
- **THEN** it remains unchanged

#### Scenario: Mask repeated values
- **WHEN** the same email occurs more than once in the input
- **THEN** every occurrence becomes `[REDACTED_EMAIL]` and surrounding content remains byte-for-byte unchanged

#### Scenario: Resolve overlapping candidates
- **WHEN** a candidate could be classified as both a phone number and a more specific checksum-validated identifier
- **THEN** the complete value is replaced once using the more specific category

### Requirement: Pseudonymization preserves invocation-local relationships
Pseudonymization SHALL replace selected matches with category-scoped, one-based ordinal tokens in first-surviving-occurrence order: `[IP_ADDRESS_N]`, `[EMAIL_N]`, `[PHONE_NUMBER_N]`, `[PAYMENT_CARD_N]`, `[AADHAAR_N]`, and `[PAN_N]`. Repeated canonically equivalent values in the same invocation SHALL receive the same token; distinct values in the same category SHALL receive distinct tokens. Identical input and selection SHALL produce identical output across repeated runs without a key, stored mapping, randomness, or network state. Tokens SHALL NOT establish stable identity across different inputs, and reprocessing pseudonymized output SHALL leave it unchanged.

Canonical equivalence SHALL use the parsed address for IPs, exact local part plus case-insensitive domain for emails, digits plus explicit international prefix and extension for phones, digits for payment cards and Aadhaar, and uppercase characters for PAN. Canonicalization SHALL NOT infer a phone country code or merge values whose equivalence is ambiguous.

#### Scenario: Repeated and distinct values retain relationships
- **WHEN** an input contains the same email twice and a different email once
- **THEN** the repeated email receives `[EMAIL_1]` both times and the other receives `[EMAIL_2]`

#### Scenario: Equivalent formatting shares a pseudonym
- **WHEN** the same Aadhaar number appears once compact and once in supported grouped form
- **THEN** both occurrences receive the same Aadhaar pseudonym

#### Scenario: Repeated runs are deterministic
- **WHEN** identical input, selected categories, and pseudonym mode are processed in separate invocations
- **THEN** their output is identical without consulting persistent state

### Requirement: Network and contact identifiers use bounded deterministic recognition
The IP category SHALL recognize complete syntactically valid IPv4 and IPv6 addresses, including bracketed IPv6 and addresses adjacent to ports or CIDR prefixes, while replacing only the address span. The email category SHALL recognize common ASCII mailbox forms with semantic token boundaries and case-insensitive domain comparison. The phone category SHALL recognize E.164 numbers and strongly formatted international or local numbers with plausible digit counts; plain unformatted local numbers SHALL require a recognized phone, mobile, telephone, or contact-number label. A recognized extension SHALL be included in the phone match. Detection SHALL make no network request, DNS lookup, deliverability check, or carrier query.

#### Scenario: Preserve IP structure outside the address
- **WHEN** bracketed IPv6 with a port and IPv4 with a CIDR prefix are selected for masking
- **THEN** the address values are masked while brackets, ports, slashes, and prefix lengths remain visible

#### Scenario: Avoid an ambiguous plain number
- **WHEN** an unlabeled digit sequence could be an identifier, timestamp, or local telephone number and lacks strong phone formatting
- **THEN** phone recognition leaves it unchanged

#### Scenario: Preserve email possessives and local-part apostrophes
- **WHEN** a common ASCII email is followed by a straight or curly apostrophe and a possessive suffix
- **THEN** only the email is replaced, both apostrophe forms preserve the suffix, and supported apostrophes inside the local part remain part of the email's canonical identity

#### Scenario: Labeled local phone number
- **WHEN** a plausible local number occurs as the value of a recognized phone label
- **THEN** the complete number and extension, if present, are treated as one phone match

### Requirement: Payment card recognition requires plausible structure
The payment-card category SHALL recognize standalone candidates containing 13 through 19 digits with no separator or with common space or hyphen grouping only when their normalized digits pass the Luhn checksum. Values in explicit payment-card-number fields SHALL be protected when they have a plausible digit count and grouping even if the checksum is invalid, so truncated, synthetic, or mistyped logged values do not escape sanitization. Recognition SHALL replace the complete candidate and SHALL NOT validate the number with an issuer or payment network.

#### Scenario: Recognize a grouped card number
- **WHEN** a standalone space- or hyphen-grouped card candidate has 13 through 19 digits and passes Luhn validation
- **THEN** the entire candidate is replaced as one payment-card value

#### Scenario: Preserve a random numeric identifier
- **WHEN** an unlabeled numeric sequence fails card length, grouping, or Luhn validation
- **THEN** payment-card recognition leaves it unchanged

#### Scenario: Protect an invalid labeled card value
- **WHEN** a plausibly formatted value appears under a semantic card-number label but fails Luhn validation
- **THEN** it is still replaced as a payment-card value

### Requirement: Aadhaar numbers are recognized offline
The Aadhaar category SHALL recognize standalone 12-digit values in compact form or exact `4-4-4` groups separated consistently by spaces or hyphens when their normalized digits pass the Verhoeff checksum. A plausible 12-digit value in an explicit Aadhaar or UID field SHALL be protected even if its checksum is invalid. Existing UIDAI-style partially masked values SHALL remain unchanged. Recognition SHALL NOT query UIDAI or claim that a checksum-valid value was issued, active, or belongs to a person.

#### Scenario: Recognize equivalent Aadhaar formatting
- **WHEN** a checksum-valid Aadhaar candidate appears in compact and supported grouped forms
- **THEN** both forms are recognized as the same canonical Aadhaar value

#### Scenario: Preserve a standalone checksum failure
- **WHEN** an unlabeled 12-digit candidate fails Verhoeff validation
- **THEN** standalone Aadhaar recognition leaves it unchanged

#### Scenario: Protect a labeled checksum failure
- **WHEN** a plausible 12-digit value appears in an Aadhaar-labelled field but fails Verhoeff validation
- **THEN** it is still replaced as an Aadhaar value

#### Scenario: Preserve an already masked Aadhaar display
- **WHEN** input contains a UIDAI-style value exposing only its final four digits
- **THEN** it remains unchanged

### Requirement: PAN numbers use the documented structural format
The PAN category SHALL recognize case-insensitive ten-character candidates containing five ASCII letters, four digits from `0001` through `9999`, and one final ASCII letter. The fourth character SHALL be one of the documented holder types `A`, `B`, `C`, `F`, `G`, `H`, `J`, `L`, `P`, or `T` for standalone recognition. A structurally plausible ten-character value in an explicit PAN field SHALL be protected even if its holder-type or numeric-series component is invalid. Recognition SHALL use token boundaries, preserve surrounding punctuation, perform no Income Tax Department lookup, and make no claim that a recognized PAN was issued or is active.

#### Scenario: Recognize a standalone PAN
- **WHEN** a standalone PAN candidate has the documented structure and holder-type character
- **THEN** the complete ten-character value is replaced

#### Scenario: Treat letter case as equivalent
- **WHEN** the same PAN appears in upper and lower case during pseudonymization
- **THEN** both occurrences receive the same PAN pseudonym

#### Scenario: Preserve a similar alphanumeric token
- **WHEN** an unlabeled ten-character token has an invalid holder-type character, invalid numeric series, or an adjoining alphanumeric character
- **THEN** standalone PAN recognition leaves it unchanged

### Requirement: All interfaces share core behavior and remain local
The CLI, WASM, standalone WebApp tool, and Pipes transform SHALL invoke the same core detection, category selection, masking, and pseudonymization behavior. Processing SHALL perform no network request or identifier verification. The CLI SHALL accept positional input and stdin with argument precedence and missing-interactive-input guidance, preserve input whitespace, and emit only sanitized text plus its normal final newline on successful stdout. Errors SHALL not echo raw PII.

#### Scenario: CLI and WASM parity
- **WHEN** identical UTF-8 input, category selection, and mode are supplied through CLI and WASM
- **THEN** sanitized content is identical after accounting for the CLI's normal appended output newline

#### Scenario: Positional argument wins
- **WHEN** an input argument is supplied while stdin is still open
- **THEN** the CLI completes without reading stdin

#### Scenario: Processing is offline
- **WHEN** any supported interface sanitizes PII without network availability
- **THEN** it produces the same result as when network access is available

### Requirement: WebApp and Pipes expose private, composable controls
The WebApp SHALL expose a discoverable Security tool with input, read-only output, copy and clear controls, a mask or pseudonymize choice, accessible category controls, and a concise coverage notice. Mask mode and all categories SHALL initially be selected; explicit selection of no categories SHALL preserve input. Raw sanitizer input SHALL be excluded from shareable URLs. Pipes SHALL expose the sanitizer as a transform with mode and category configuration frozen in saved and exported definitions while runtime input and output remain excluded from saved configuration. Processing SHALL introduce no artificial operation delay beyond the UI's minimal interaction scheduling.

#### Scenario: Saved pseudonymizing pipe retains configuration
- **WHEN** a user saves and exports a pipe configured to pseudonymize only Aadhaar and PAN
- **THEN** reload and import preserve that exact behavior without storing runtime input or generated output

#### Scenario: Mobile and keyboard operation
- **WHEN** a user operates the sanitizer at 375 px or by keyboard
- **THEN** mode controls, category controls, input, output, copy, and clear actions remain usable without page-level horizontal overflow

### Requirement: PII sanitization adds negligible measured latency
The implementation SHALL skip disabled detection work, avoid runtime service startup and repeated pattern compilation, avoid allocating for clean input, and demonstrate bounded processing on clean text, mixed PII, dense PII, and repeated malformed near-matches. Release measurements SHALL record the reference environment, deterministic input construction, validated match counts and output, first-call cost, median, p95, and throughput for native core, fresh CLI subprocess, and actual WASM execution. Mask and pseudonym modes and all-category versus representative single-category operation SHALL be measured separately.

On the reference development environment, initial targets SHALL be a native-core median at or below 0.5 ms and p95 below 1 ms for representative 64 KiB input, a native-core median below 8 ms for representative 1 MiB input, median added CLI cost below 1 ms for representative 4 KiB input against a comparable command baseline, and warm WASM median at or below 1 ms for representative 64 KiB input. Any unmet target SHALL be investigated and optimized or reported as an explicit measured limitation before completion; total fresh-process CLI latency SHALL be reported separately from added sanitizer cost.

#### Scenario: Measure the hot path
- **WHEN** release native benchmarks process representative 64 KiB clean, mixed, and dense fixtures repeatedly
- **THEN** the report includes first-call, median, p95, throughput, validated results, and comparison with the sub-millisecond target

#### Scenario: Measure real CLI overhead
- **WHEN** fresh CLI processes sanitize representative stdin input
- **THEN** alternating paired measurements report both total latency and added sanitizer cost against a baseline with comparable I/O and output size

#### Scenario: Adversarial input grows
- **WHEN** progressively larger inputs contain incomplete emails, long numeric runs, invalid checksums, colon-heavy text, and repeated near-matches
- **THEN** benchmark evidence demonstrates bounded approximately linear growth without rescanning the same remaining suffix

### Requirement: Coverage limits and validation semantics are visible
CLI help and user documentation SHALL explain finite deterministic coverage, category and mode selection, invocation-local pseudonym scope, supported formatting, checksum use, labeled-field fallback, possible false positives and negatives, already-masked behavior, local execution, and the absence of issuer, UIDAI, Income Tax Department, DNS, carrier, or deliverability verification. Documentation SHALL distinguish syntactic or checksum validity from proof that an identifier exists or belongs to a person.

#### Scenario: Inspect help and documentation
- **WHEN** a user reviews `strapd sanitize pii --help` and the linked documentation
- **THEN** defaults, flags, input forms, pseudonym scope, offline guarantees, performance results, and coverage limitations are understandable
