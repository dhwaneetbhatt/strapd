# Sanitize PII

Protect personal identifiers in logs and other developer text locally, through
the Rust core, CLI, **Security → Sanitize PII**, and Pipes. All interfaces use the
same Rust implementation. Input is never sent to an identifier verification
service, and the standalone WebApp excludes input text from shareable URLs.

Omitting category flags enables all categories. `--all` explicitly selects all;
combining it with individual flags is an error. Individual flags select their
union. Positional input takes precedence over stdin, including an empty string.
Whitespace is preserved; the CLI appends its normal final newline. An empty pipe
is valid input. An interactive invocation without input shows guidance.

| Flag | Mask | Pseudonym |
| --- | --- | --- |
| `--ip-addresses` | `[REDACTED_IP_ADDRESS]` | `[IP_ADDRESS_N]` |
| `--emails` | `[REDACTED_EMAIL]` | `[EMAIL_N]` |
| `--phone-numbers` | `[REDACTED_PHONE_NUMBER]` | `[PHONE_NUMBER_N]` |
| `--payment-cards` | `[REDACTED_PAYMENT_CARD]` | `[PAYMENT_CARD_N]` |
| `--aadhaar` | `[REDACTED_AADHAAR]` | `[AADHAAR_N]` |
| `--pan` | `[REDACTED_PAN]` | `[PAN_N]` |

Masking is the default; `--pseudonymize` / `-p` assigns category-scoped ordinals
from one, in first-occurrence order. Equivalent repeated values share a token
within one input. Identical input and configuration produce identical output.
Mappings are discarded after each invocation: tokens do not identify the same
person across documents, and there is no key, stored mapping, or hash of PII.
Complete mask and pseudonym markers remain unchanged when processed again.

Canonical identity uses parsed IP addresses, exact email local parts with
case-insensitive domains, digits for cards and Aadhaar, and uppercase PAN.
Phone identity keeps the explicit `+` and extension while dropping formatting;
it never infers a country code. Different local-part case, extensions, or explicit
international prefixes can therefore yield distinct pseudonyms.

## Recognition and limits

- **IP addresses:** syntactically valid IPv4 and IPv6, including private,
  loopback and unspecified addresses. Brackets, ports and CIDR lengths remain
  outside the replacement. Zone identifiers and encoded forms are unsupported.
- **Emails:** common ASCII local parts and dotted ASCII domains, with normal
  punctuation boundaries. Straight and curly apostrophes after the domain
  preserve prose suffixes such as `'s`; supported local-part apostrophes stay
  inside the match (for example, `o'connor@example.com`).
  Quoted mailboxes, internationalized addresses and
  exhaustive RFC mailbox syntax are unsupported. No DNS or deliverability check
  occurs.
- **Phones:** 7–15 digits with an explicit international prefix, strongly grouped
  local numbers with at least 10 digits, or plausible local values under a
  `phone`, `mobile`, `telephone`, `tel`, or `contact_number` label. Spaces,
  hyphens, dots and area-code parentheses are supported. `ext`, `ext.`, `x`, and
  `#` extensions include up to six digits. Plain unlabelled local numbers and
  date-like short groups are preserved. No carrier or ownership check occurs.
- **Payment cards:** 13–19 digits, compact or common consistent space/hyphen
  groups (four-digit groups, or 4–6–5). Standalone candidates require Luhn.
  Explicit card-number labels also protect plausible checksum failures.
  No issuer or payment-network check occurs.
- **Aadhaar:** 12 digits, compact or exact 4–4–4 groups using consistent spaces
  or hyphens. Standalone candidates require Verhoeff; explicit `aadhaar` or `uid`
  fields also protect plausible checksum failures. UIDAI-style `XXXX XXXX 0124`
  displays remain unchanged. No UIDAI lookup occurs.
- **PAN:** five ASCII letters, four digits, then one letter. Standalone values
  require holder type `A`, `B`, `C`, `F`, `G`, `H`, `J`, `L`, `P`, or `T` in the
  fourth position and a numeric series from 0001 to 9999. Explicit PAN fields
  also protect structurally plausible invalid holder types or zero series. Case
  is ignored. No Income Tax Department lookup occurs.

Labels support case-insensitive compact, camel-case, underscore, hyphen and
space-separated forms such as `aadhaarNumber`, `card_number`, and `PAN number`.
Numbered field suffixes such as `aadhaar_1` and `card_number_1` are supported.
Metadata keys such as `pan_status` and `aadhaarLast4`, and innocent substrings,
do not activate label fallback. Checksum-valid cards and Aadhaar take precedence
over overlapping phone shapes; surrounding text remains byte-for-byte intact.

Syntactic or checksum validity does not prove that an identifier was issued,
is active, or belongs to a person. Coverage is finite: false positives and false
negatives are possible. Names, addresses, images/OCR, encoded or binary values,
and arbitrary unformatted identifiers are outside this first iteration. Review
sanitized output before sharing it.

## WebApp, Pipes, and library

Choose Mask or Pseudonymize, then all or individual categories. Explicitly
deselecting every category preserves input. Result is read-only with Copy and
Reset controls. Reset restores mask mode and all categories.

Pipes freeze mode and the six category booleans in version-1 configuration;
runtime input and output are excluded from saved and exported definitions.
For example, sanitize Aadhaar/PAN and then feed the result to a hash or other
transform. The operation adds no processing timer; UI scheduling is separate.

```rust
use strapd_core::sanitize::pii::{sanitize, Categories, Category, Mode};
let selection = Categories::only(Category::Aadhaar).with(Category::Pan);
let result = sanitize("PAN=ABCPD1234E", selection, Mode::Pseudonymize);
assert_eq!(result, "PAN=[PAN_1]");
```

Clean core input is borrowed without output allocation. Mask mode avoids
canonical-identity allocation. Detection scans bytes monotonically, gates work
by category, and renders original spans once.

## Performance

On the reference Apple M4, the apostrophe-boundary follow-up measures 64 KiB
mixed input at a median 0.223 ms native / 0.380 ms browser WASM for masking and
0.251 ms / 0.430 ms for pseudonyms. The measured native clean-input increase
is about 0.02–0.05 ms. Dense native 64 KiB medians (0.730–0.872 ms) miss the
stricter 0.5 ms target; dense and apostrophe-heavy WASM pseudonyms also exceed
1 ms (1.100 and 1.290 ms). Sub-millisecond latency is not guaranteed for every
input. Apostrophe-heavy native medians (0.632–0.970 ms) also miss the 0.5 ms
target, with pseudonym p95 at 1.283 ms. Initial dense 1 MiB native measurements
take 10.459–16.522 ms, or
8.243–9.293 ms with only Aadhaar/PAN enabled, exceeding the 8 ms target.
Initial fresh CLI processes take 31–45 ms total: sub-millisecond core work does not
mean sub-millisecond process startup. Results vary with input and runtime.

Release native, CLI and actual-browser WASM measurements, fixture construction,
first-call costs, median/p95, throughput and limitations are recorded in the
[OpenSpec verification report](../openspec/changes/archive/2026-10-13-gh-34-sanitize-pii/verification.md).
