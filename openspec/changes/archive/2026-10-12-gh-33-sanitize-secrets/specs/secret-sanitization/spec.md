## Purpose

Provide fast, deterministic, configurable local redaction of recognizable credentials in developer text through the CLI, WebApp, and reusable Pipes.

## ADDED Requirements

### Requirement: Users select redaction categories
The sanitizer SHALL expose API keys, authorization, cookies, databases, cryptographic keys, passwords, tokens, and signed URLs as independently selectable categories. CLI category flags SHALL be `--api-keys`, `--auth`, `--cookies`, `--databases`, `--crypto-keys`, `--passwords`, `--tokens`, and `--signed-urls`. Omission of category flags SHALL select all categories; `--all` SHALL explicitly select all. Multiple category flags SHALL select their union, and `--all` combined with a category flag SHALL be rejected with helpful guidance. Explicit selection of no categories through the library or WebApp SHALL preserve input.

#### Scenario: Default and explicit all agree
- **WHEN** the same input is sanitized without category flags and with `--all`
- **THEN** both results redact every recognized category identically

#### Scenario: Select API keys only
- **WHEN** input containing a labeled API key, an opaque Bearer credential, a password, and cookies is sanitized with `--api-keys`
- **THEN** only matches recognized by API-key rules are redacted and the other values remain unchanged

#### Scenario: Select several categories
- **WHEN** a user selects authorization and cookies
- **THEN** both categories are redacted without enabling database, password, or other category rules

### Requirement: Redaction preserves text and is deterministic
The sanitizer SHALL replace complete recognized sensitive values with fixed descriptive category placeholders, preserve all surrounding text and whitespace, handle UTF-8 safely, preserve ordinary non-secret text, and produce identical output on repeated equivalent calls. Sanitizing the output again with the same categories SHALL leave it unchanged. Overlapping enabled matches SHALL never expose a sensitive suffix or process replacement text as new input.

#### Scenario: Preserve ordinary text and empty input
- **WHEN** empty input or ordinary text containing Unicode, spaces, CRLF, punctuation, or a literal `Error:` prefix is sanitized
- **THEN** it remains unchanged

#### Scenario: Resolve overlapping detections
- **WHEN** a recognized provider key appears inside an authorization header or another enabled sensitive field
- **THEN** the complete sensitive value is redacted once with a stable placeholder

#### Scenario: Preserve selected-category boundaries
- **WHEN** only API keys are enabled and a recognizable provider key occurs inside an Authorization header
- **THEN** that key is redacted while the header scheme remains and no opaque authorization credential is redacted merely because of the header

### Requirement: Labeled secrets use semantic field boundaries
The sanitizer SHALL recognize secret fields case-insensitively across snake case, kebab case, camel case, and provider-prefixed names in common assignments, JSON/YAML fields, headers, and query parameters. API-key, password/passphrase, token, and cryptographic-key fields SHALL belong to their respective categories. Quoted values SHALL be consumed with their escapes and punctuation; unquoted values SHALL follow their enclosing syntax. Explicit secret fields SHALL be redacted regardless of entropy or minimum credential length. Empty values and existing sanitizer placeholders SHALL remain stable.

#### Scenario: Recognize equivalent API-key labels
- **WHEN** `apiKey`, `API_KEY`, `X-API-Key`, or `OPENAI_API_KEY` contains a value
- **THEN** enabling API keys redacts the complete value

#### Scenario: Preserve metadata and innocent substrings
- **WHEN** input contains `keyboard`, `api_key_id`, `token_count`, `password_length`, `private_key_path`, `public_key`, or ordinary usernames
- **THEN** label recognition alone does not redact their values

#### Scenario: Scoped application credential labels
- **WHEN** dotted configuration names end in `accessKey`, `appSecret`, `webhookSecret`, or a semantic `secret` segment
- **THEN** access keys belong to API keys, webhook signing secrets belong to cryptographic keys, and application or generic scoped secrets belong to tokens
- **AND** disabled categories, salts, key versions, metadata suffixes, and innocent substring matches remain unchanged

#### Scenario: Short and escaped values
- **WHEN** a selected secret field contains a short password or a quoted value with escaped quotes, commas, semicolons, spaces, or Unicode
- **THEN** the complete value is replaced and surrounding quotes and fields are preserved

### Requirement: Recognizable provider credentials are redacted
The API-key category SHALL recognize distinctive GitHub, GitLab, Slack, Stripe, OpenAI, Anthropic, npm, SendGrid, Google API-key, and AWS access-key-ID families. Coverage SHALL include GitHub JWT-shaped installation tokens, GitLab routable access tokens, Slack rotating and workflow tokens, and Stripe organization keys. Recognition SHALL consume the whole credential candidate rather than leave a suffix because of a fixed historical length. Standalone Stripe publishable keys SHALL remain unchanged. Recognizable Google API keys SHALL be redacted conservatively regardless of unobservable permissions. Opaque provider credentials without distinctive formats SHALL require a recognized label or container.

#### Scenario: Recognize a standalone provider credential
- **WHEN** an enabled provider family appears as a complete credential candidate in surrounding text
- **THEN** API-key selection redacts it completely while preserving surrounding text

#### Scenario: Preserve a public Stripe key
- **WHEN** input contains only a standalone Stripe `pk_live_` or `pk_test_` publishable key
- **THEN** standalone provider recognition leaves it unchanged

### Requirement: Authorization and cookies follow their grammars
The authorization category SHALL redact credentials in Authorization and Proxy-Authorization fields for arbitrary schemes, preserving field names and recognizable schemes. This SHALL work for raw headers, quoted curl headers, and header values in JSON objects. The cookie category SHALL redact every request Cookie value and the initial cookie value in each Set-Cookie response field, preserving names, separators, quotes, and response attributes.

#### Scenario: Authorization parameters contain commas
- **WHEN** a Digest or AWS authorization credential contains multiple comma-separated parameters
- **THEN** all credential parameters are redacted without leaving a signature or credential suffix

#### Scenario: Cookie attributes contain dates
- **WHEN** a Set-Cookie header contains Expires, Path, Domain, Secure, HttpOnly, or SameSite attributes
- **THEN** its cookie value is redacted and those attributes remain unchanged, including commas in Expires

### Requirement: Database credentials are redacted without URL normalization
The database category SHALL redact usernames and passwords in PostgreSQL/postgres, MySQL/MariaDB, MongoDB/mongodb+srv, Redis/rediss, and SQL Server/mssql URLs, including applicable SQLAlchemy driver suffixes. It SHALL also recognize credential parameters in PostgreSQL and supported JDBC URLs and credentials in PostgreSQL/libpq and SQL Server connection strings. Hosts, ports, database names, and ordinary parameters SHALL retain their original spelling. Percent-encoded credentials, multiple MongoDB/PostgreSQL hosts, quoted libpq values, and SQL Server braced values SHALL be supported.

#### Scenario: URL contains encoded credentials
- **WHEN** a database URL contains percent-encoded username/password and ordinary parameters
- **THEN** the original credential spans are replaced while hosts, database, encoding elsewhere, and ordinary parameters are preserved

#### Scenario: SQL Server password contains semicolons
- **WHEN** a SQL Server connection string contains a braced password with semicolons or doubled closing braces
- **THEN** its complete password is redacted without exposing a tail or removing unrelated connection properties

### Requirement: Cryptographic key material is recognized contextually
The cryptographic-key category SHALL redact complete PKCS#8, encrypted PKCS#8, RSA, EC, DSA, OpenSSH, and PGP private-key blocks; age secret identities including PQ identities; and labeled encryption/signing/HMAC secrets. It SHALL recognize JWKs by their containing `kty`, redact RSA private parameters including other-prime information, EC/OKP `d`, and symmetric `k`, and preserve public key material and metadata. Ordinary object fields named `d` or `k` SHALL remain unchanged. Truncated recognized secret containers SHALL be redacted conservatively through the end of their enclosing value or input.

#### Scenario: Private key block is incomplete
- **WHEN** a private-key opening marker appears without its closing marker
- **THEN** the remaining content of its enclosing value or input is redacted

#### Scenario: JWK contains public and private members
- **WHEN** a recognized JWK contains both public and private parameters
- **THEN** private material is replaced while public parameters, key identifiers, and surrounding formatting are preserved

### Requirement: Tokens and signed URLs are recognized locally
The token category SHALL redact labeled OAuth/session/access/refresh/ID tokens and structurally recognizable standalone compact JWS/JWE tokens in their entirety. Recognition SHALL not require signature verification, a valid expiration, or provider access. Signed-URL selection SHALL redact AWS credential/signature/session-token parameters, legacy AWS signed URL parameters, and Azure SAS signatures within recognizable signed URL context, while retaining ordinary resource and expiration parameters.

#### Scenario: Expired or unsigned compact token
- **WHEN** a structurally recognizable token is expired or has an empty signature
- **THEN** token selection still redacts its complete representation

#### Scenario: Signed URL and ordinary query parameters
- **WHEN** an AWS presigned URL or Azure SAS URL contains authentication and ordinary query parameters
- **THEN** signed-URL selection redacts authentication values without enabling unrelated category rules

### Requirement: All interfaces share core behavior and remain local
The CLI, WASM, standalone WebApp tool, and Pipes block SHALL invoke the same core behavior and category selection. Redaction SHALL perform no network requests or credential verification. The CLI SHALL support positional input and stdin with argument precedence and missing-interactive-input guidance, preserve input whitespace, document `strapd redact secrets` and `strapd sanitize redact` aliases, and emit only sanitized text plus its normal final newline on successful stdout. Errors SHALL not echo raw secrets.

#### Scenario: CLI and WASM parity
- **WHEN** identical UTF-8 input and categories are supplied through CLI and WASM
- **THEN** sanitized content is identical after accounting for the CLI's normal appended output newline

#### Scenario: Positional argument wins
- **WHEN** an input argument is supplied while stdin is still open
- **THEN** the CLI completes without reading stdin

### Requirement: WebApp and Pipes make category selection usable and private
The WebApp SHALL expose a discoverable Security tool with input, read-only output, copy/clear controls, accessible category choices, and a concise coverage notice. All categories SHALL initially be enabled, and explicit selection of no categories SHALL preserve input. Raw sanitizer input SHALL be excluded from shareable URLs. Pipes SHALL expose the sanitizer as a transform with category configuration frozen in saved/exported definitions and runtime input excluded from saved configuration. UI processing SHALL avoid the existing 300 ms debounce for this tool; Pipes SHALL execute without artificial delay.

#### Scenario: API-only saved pipe
- **WHEN** a user saves and exports a sanitizer step with only API keys selected
- **THEN** running it uses only API-key rules and import/export preserves that selection without storing runtime input

#### Scenario: Mobile and keyboard operation
- **WHEN** a user operates the sanitizer at 375 px or by keyboard
- **THEN** category controls, input, output, and copy/clear actions remain usable without page-level horizontal overflow

### Requirement: Redaction adds negligible measured latency
The implementation SHALL skip disabled detection work, avoid runtime service startup and repeated pattern compilation, and demonstrate bounded processing on clean text, dense secrets, malformed structures, and repeated near-matches. Release benchmarks SHALL record environment, input construction, warm/core latency, first-call cost, CLI subprocess overhead against a comparable baseline, and WASM latency separately. Initial reference-machine targets SHALL be under 1 ms native core processing for typical input up to 64 KiB, under 10 ms for representative 1 MiB input, under 5 ms added typical CLI overhead, and under 16 ms warm WASM processing for representative 1 MiB input. Any unmet target SHALL be investigated and resolved or documented as an explicit measured limitation before completion.

#### Scenario: Measure real pipeline overhead
- **WHEN** release CLI benchmarks run repeated fresh processes with typical stdin input
- **THEN** measurements include initialization and I/O and report added sanitizer cost against the baseline

#### Scenario: Malformed near-matches grow
- **WHEN** progressively larger input contains repeated incomplete secret-like structures
- **THEN** benchmark evidence demonstrates bounded growth without repeated scans of the same remaining input

### Requirement: Coverage limits are visible
CLI help and user documentation SHALL explain finite deterministic pattern coverage, selected-category behavior, conservative handling of truncated containers, potential public Google-key redaction, unsupported opaque/encoded/binary credentials, and the absence of a completeness or credential-validity guarantee.

#### Scenario: Inspect help
- **WHEN** a user requests sanitizer help
- **THEN** the default, category flags, aliases, input forms, local execution, and coverage limits are understandable from the help and linked documentation
