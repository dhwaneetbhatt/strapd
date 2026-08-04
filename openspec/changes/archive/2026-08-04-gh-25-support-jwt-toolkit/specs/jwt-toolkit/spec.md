## ADDED Requirements

### Requirement: JWT operations remain local and share one core
The system SHALL perform JWT normalization, decoding, expiration analysis, HMAC verification, and signing through the same Rust core behavior used by the CLI and WASM webapp, without making network requests.

#### Scenario: Use JWT functionality offline
- **WHEN** a user decodes, analyzes, verifies, or signs a JWT through either interface without network connectivity
- **THEN** the operation completes locally with behavior consistent with the other interface

#### Scenario: Encounter an asymmetric token
- **WHEN** a user attempts to verify a token whose protected header selects an algorithm outside HS256, HS384, or HS512
- **THEN** the system rejects verification with an error that identifies the unsupported algorithm and the supported algorithms without attempting remote key discovery

### Requirement: JWT token input is forgiving but deterministic
The system SHALL accept a compact JWT directly or via stdin where supported and SHALL normalize common copied representations by trimming surrounding whitespace, removing at most one matching pair of surrounding single or double quotes, and stripping case-insensitive `Authorization:` and `Bearer` prefixes.

#### Scenario: Decode a copied authorization header
- **WHEN** a user supplies `Authorization: Bearer <token>` with surrounding whitespace
- **THEN** the system isolates and processes `<token>`

#### Scenario: Decode a quoted token
- **WHEN** a user supplies a compact JWT enclosed by one matching pair of quotes
- **THEN** the system removes that quote pair before parsing the JWT

#### Scenario: Input contains unrelated log text
- **WHEN** input contains arbitrary text around a token rather than a supported authorization prefix
- **THEN** the system rejects the input instead of searching the text for a JWT

### Requirement: JWT decoding preserves token JSON by default
The system SHALL decode the Base64URL header and payload segments, require each decoded segment to contain valid JSON of the appropriate JWT shape, and emit a combined object containing only `header` and `payload` unless analysis is explicitly requested.

#### Scenario: Decode a JWT without analysis
- **WHEN** a user runs `strapd jwt decode <token>` without an analysis flag
- **THEN** stdout contains pretty-printed JSON with the decoded `header` and `payload` and contains no derived expiration or signature fields

#### Scenario: Decode canonical Base64URL
- **WHEN** a structurally valid JWT uses unpadded Base64URL segments
- **THEN** the system decodes its header and payload successfully

#### Scenario: Decode compatible padded Base64URL
- **WHEN** a structurally valid JWT uses padded Base64URL segments
- **THEN** the system accepts the compatible padding and decodes its header and payload successfully

#### Scenario: Decode malformed input
- **WHEN** a token has other than three compact segments, invalid Base64URL, invalid UTF-8, a non-object header, or a non-object claims payload
- **THEN** the system reports the failing condition and the CLI exits with status 1 without emitting a successful result

### Requirement: Derived JWT analysis is explicitly requested
The CLI SHALL add derived metadata to decoded output only when `--include-analysis` is supplied, with `--analyze` and `--analyse` accepted as aliases, and SHALL place all derived values under a top-level `analysis` property.

#### Scenario: Analyze an active token
- **WHEN** a user decodes a token with `--include-analysis` and its numeric `exp` claim is later than the current UTC instant
- **THEN** `analysis.expiration` reports `ACTIVE`, an RFC 3339 UTC `expires_at`, and `seconds_remaining`, while `analysis.signature.status` reports `UNVERIFIED`

#### Scenario: Analyze an expired token
- **WHEN** the token's numeric `exp` claim is at or before the current UTC instant
- **THEN** `analysis.expiration` reports `EXPIRED`, the UTC expiration instant, and the signed number of remaining seconds

#### Scenario: Analyze a token without expiration
- **WHEN** the payload has no `exp` claim
- **THEN** `analysis.expiration.status` reports `NOT_PRESENT` without inventing an expiration time

#### Scenario: Analyze an invalid expiration claim
- **WHEN** the payload contains an `exp` claim that cannot be interpreted as a finite NumericDate
- **THEN** the system reports that the expiration claim is invalid rather than classifying the token as active or expired

### Requirement: Header and payload extraction are clean transforms
The CLI SHALL provide commands that emit only the decoded header or only the decoded payload as pretty-printed JSON, with no analysis envelope or explanatory text on stdout.

#### Scenario: Extract a payload for a Unix pipe
- **WHEN** a user runs `strapd jwt payload <token>` or its `body` alias
- **THEN** stdout contains only the decoded claims object suitable for a downstream command

#### Scenario: Extract a header
- **WHEN** a user runs `strapd jwt header <token>` or its `meta` alias
- **THEN** stdout contains only the decoded protected header object

### Requirement: HMAC JWT verification is algorithm-bound and constant-time
The system SHALL verify HS256, HS384, and HS512 signatures against the original encoded header and payload, SHALL select the algorithm from the protected header, and SHALL use constant-time MAC verification.

#### Scenario: Verify a valid signature
- **WHEN** a user supplies a token and matching secret to `strapd jwt verify` or its `check` alias
- **THEN** the CLI identifies the verified header algorithm, prints a concise success message, and exits with status 0

#### Scenario: Reject a mismatched signature
- **WHEN** the supplied secret does not validate the token signature
- **THEN** the CLI reports a signature mismatch on stderr and exits with status 1

#### Scenario: Reject an unapproved header algorithm
- **WHEN** the protected header is missing `alg`, selects `none`, or selects an algorithm outside HS256, HS384, and HS512
- **THEN** verification fails without allowing a caller-provided algorithm to override the protected header

### Requirement: CLI secrets support direct and environment sources
Verification and signing SHALL require exactly one secret source from `--secret <value>` or `--secret-env <variable>`, and SHALL fail clearly when an environment variable is absent or not valid Unicode.

#### Scenario: Use a direct development secret
- **WHEN** a user provides `--secret <value>`
- **THEN** the operation uses that value as the HMAC secret

#### Scenario: Use a secret from the environment
- **WHEN** a user provides `--secret-env JWT_SECRET` and that variable exists
- **THEN** the operation reads the secret value without printing it

#### Scenario: Supply conflicting secret sources
- **WHEN** a user supplies both `--secret` and `--secret-env`
- **THEN** CLI argument validation rejects the command before executing the JWT operation

### Requirement: JWT signing is explicit and composable
The CLI SHALL sign a JSON object payload using HS256 by default, SHALL allow HS384 or HS512 through `--algorithm`, SHALL accept the payload positionally or from stdin, and SHALL emit only the compact JWT on stdout.

#### Scenario: Sign with defaults
- **WHEN** a user runs `strapd jwt sign <payload> --secret <value>` without selecting an algorithm or expiration
- **THEN** the system preserves the supplied claims, creates an HS256 header with JWT type metadata, and emits a canonical JWT with unpadded Base64URL segments

#### Scenario: Select a signing algorithm
- **WHEN** a user selects HS384 or HS512 with `--algorithm`
- **THEN** the protected header and cryptographic signature use that algorithm

#### Scenario: Add a relative expiration
- **WHEN** a user signs with `--exp <positive-seconds>`
- **THEN** the system adds or replaces `exp` with the current UTC Unix time plus the requested duration and does not add or replace `iat`

#### Scenario: Reject invalid signing input
- **WHEN** the payload is not a JSON object, the algorithm is unsupported, or `--exp` is zero or negative
- **THEN** signing reports the specific validation failure, emits no token, and the CLI exits with status 1

### Requirement: CLI JWT commands are discoverable and consistent
The CLI SHALL expose `decode`, `payload`, `header`, `verify`, and `sign` beneath `strapd jwt`, accept their documented forgiving aliases, read token or payload input from stdin when the positional input is absent, and include representative examples in help output.

#### Scenario: Use a forgiving command alias
- **WHEN** a user invokes `inspect` or `parse` for decode, `body` for payload, `meta` for header, `check` for verify, or `gen` or `create` for sign
- **THEN** the alias behaves identically to its canonical command

#### Scenario: Omit piped input
- **WHEN** a command requiring token or payload input receives neither a positional value nor piped stdin
- **THEN** the CLI returns an actionable missing-input error rather than waiting indefinitely or panicking

### Requirement: The webapp provides focused JWT workflows
The webapp SHALL expose offline JWT inspection, verification, and signing through security-category tools that use the shared WASM operations, update results as inputs change, and present structured JWT content and errors accessibly on supported desktop and mobile layouts.

#### Scenario: Inspect a token in the webapp
- **WHEN** a user pastes a supported JWT or authorization header into the inspector
- **THEN** the interface shows separate header and payload JSON, an expiration state of active, expired, not present, or invalid, and an unverified signature state until a secret is supplied

#### Scenario: Verify a token in the webapp
- **WHEN** a user supplies a secret for an HS256, HS384, or HS512 token
- **THEN** the interface shows whether the signature matches without sending the token or secret over the network

#### Scenario: Sign a payload in the webapp
- **WHEN** a user provides a JSON object, secret, supported algorithm, and optional positive expiration duration
- **THEN** the interface emits a compact JWT with semantics matching the CLI

#### Scenario: Find signing through common JWT terminology
- **WHEN** a user searches the tool launcher for `encode`
- **THEN** JWT Signer appears as a result because its discovery aliases include common JWT encode terminology

#### Scenario: Use JWT output actions
- **WHEN** decoded payload or signed-token output is available
- **THEN** the interface provides relevant direct copy actions without adding tool-specific CLI-command generation or payload-to-pipe handoff

#### Scenario: Use the JWT workbench on a narrow viewport
- **WHEN** a user opens a JWT tool on a supported mobile viewport
- **THEN** token input uses monospace typography and the page remains the single vertical scrolling surface without a nested workbench scrollbar

### Requirement: The CLI advertisement page demonstrates and activates real workflows
The webapp CLI page SHALL present a product-specific, responsive path from understanding strapd through installing and verifying it, and SHALL display only command syntax validated against the current CLI.

#### Scenario: Understand strapd before installation
- **WHEN** a developer opens the CLI page
- **THEN** the hero demonstrates a real stdin-composable workflow and identifies factual offline, local, and consistent-interface benefits before asking the developer to choose an installation method

#### Scenario: Start with the recommended Homebrew installation
- **WHEN** a developer reaches installation
- **THEN** Homebrew appears first and is identified as the recommended macOS/Linux path, while other supported installation methods remain available through progressive disclosure

#### Scenario: Copy and verify an installation command
- **WHEN** a developer chooses an installation method
- **THEN** the page provides an accessible direct copy action, links to installer source where applicable, and follows installation with `strapd --version` and a real first-use command

#### Scenario: Use the CLI page on a narrow viewport
- **WHEN** the CLI page is viewed at 320 CSS pixels or at 200 percent zoom
- **THEN** page content and actions remain within the viewport, code surfaces scroll locally when necessary, and the recommended installation path remains understandable and operable

#### Scenario: Discover and share the CLI page
- **WHEN** a crawler or social preview reads the application document or the rendered CLI route
- **THEN** it receives a factual title, description, canonical deployed URL, social metadata, and software-application structured data that describe strapd's offline CLI capabilities

### Requirement: JWT tools compose with user-created webapp pipes
The webapp SHALL register JWT decode and JWT sign operations with versioned pipe contracts whose successful canonical outputs are strings, while leaving pipe creation and recipe selection entirely to the user.

#### Scenario: Configure JWT decoding in a pipe
- **WHEN** a user adds the JWT decode tool to a pipe and selects payload-only, header-only, or full decoded output
- **THEN** the step consumes the upstream token and emits the selected JSON string without derived analysis unless the step explicitly enables it

#### Scenario: Configure JWT signing in a pipe
- **WHEN** a user adds JWT signing after a JSON-producing source or transform and configures a secret, algorithm, and optional expiration
- **THEN** the step emits a compact JWT and the configured values follow the existing pipe persistence and export behavior

#### Scenario: Discover JWT tools without bundled recipes
- **WHEN** the release is loaded for the first time
- **THEN** JWT-compatible tools are discoverable in the pipe builder but no JWT pipe or recipe has been pre-created or persisted

#### Scenario: Display minified JWT-derived JSON in pipe output
- **WHEN** a pipe emits valid minified JSON on a line wider than the output pane
- **THEN** syntax highlighting preserves the line and its tokens as readable preformatted text with horizontal scrolling instead of breaking characters across the pane

### Requirement: JWT failures are precise and consistent
The system SHALL distinguish invalid compact structure, Base64URL, UTF-8, JSON, claims shape, expiration, algorithm, secret source, and signature mismatch failures and SHALL present equivalent causes across the CLI and webapp.

#### Scenario: Identify a malformed segment
- **WHEN** decoding fails in a specific compact segment
- **THEN** the error identifies the segment and failure category without echoing secrets

#### Scenario: A pipe JWT step fails
- **WHEN** a JWT operation returns an error during pipe execution
- **THEN** the pipe stops at that step and displays the operation's actionable error through the existing step-attributed failure behavior
