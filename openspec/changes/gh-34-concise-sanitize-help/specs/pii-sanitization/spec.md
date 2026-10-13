## MODIFIED Requirements

### Requirement: Coverage limits and validation semantics are visible
CLI help SHALL briefly describe the operation, category defaults and input forms, expose category and mode flags, and link to user documentation. The pseudonym flag help SHALL explain that placeholders are consistent within one invocation. User documentation SHALL explain finite deterministic coverage, category and mode selection, invocation-local pseudonym scope, supported formatting, checksum use, labeled-field fallback, possible false positives and negatives, already-masked behavior, local execution, and the absence of issuer, UIDAI, Income Tax Department, DNS, carrier, or deliverability verification. Documentation SHALL distinguish syntactic or checksum validity from proof that an identifier exists or belongs to a person.

#### Scenario: Inspect help and documentation
- **WHEN** a user reviews `strapd sanitize pii --help` and the linked documentation
- **THEN** help provides concise usage guidance and the documentation explains offline guarantees, performance results and coverage limitations
