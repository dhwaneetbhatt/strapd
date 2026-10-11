# cli-input-handling Specification

## Purpose

Defines reliable and compatible CLI input behavior so commands consume arguments and stdin without unexpected blocking, panics, whitespace changes, or loss of arbitrary byte data.

## Requirements

### Requirement: Supplied arguments take precedence over stdin
When a command accepts either a positional argument or stdin, the CLI SHALL use a supplied argument without reading stdin and SHALL preserve the argument exactly as supplied.

#### Scenario: Argument is used without waiting for stdin
- **WHEN** a user supplies a positional input argument while stdin is interactive or remains open
- **THEN** the command processes the argument and completes without reading or waiting for stdin

#### Scenario: Empty argument remains supplied input
- **WHEN** a command that permits empty content receives an explicitly supplied empty argument
- **THEN** the command processes the empty value rather than reporting that no input source was provided

### Requirement: Missing interactive input fails promptly
When a command requires input and no argument is supplied, the CLI SHALL detect interactive stdin and return promptly with actionable guidance rather than waiting for input.

#### Scenario: Required input omitted in a terminal
- **WHEN** a user invokes an input-requiring command without an argument from an interactive terminal
- **THEN** the command exits unsuccessfully without blocking and explains that input can be passed as an argument or piped through stdin

### Requirement: Stdin failures are reported safely
The CLI SHALL propagate stdin read and input parsing failures through its normal error path and SHALL NOT panic because required input could not be read or parsed.

#### Scenario: Piped stdin cannot be read
- **WHEN** reading piped stdin returns an operating-system error
- **THEN** the command exits unsuccessfully with an actionable stdin error and does not panic

#### Scenario: Numeric stdin is invalid
- **WHEN** a numeric-input command receives piped content that cannot be parsed as the required number
- **THEN** the command exits unsuccessfully with an actionable validation error and does not panic

### Requirement: Existing whitespace behavior remains compatible
The CLI SHALL preserve each command family's existing distinction between exact argument input, normalized piped text, and exact piped bytes. Shared input acquisition SHALL NOT introduce a user-visible whitespace change.

#### Scenario: Piped text retains existing normalization
- **WHEN** a text-oriented command that currently trims surrounding piped whitespace is migrated to shared input handling
- **THEN** leading and trailing piped whitespace continues to be trimmed before that command's operation runs

#### Scenario: Positional text remains exact
- **WHEN** a text-oriented command receives a positional value containing leading or trailing whitespace
- **THEN** the operation receives that whitespace unchanged, consistent with the command's existing behavior

#### Scenario: Exact-byte encoders preserve piped bytes
- **WHEN** Base64 or Hex encoding receives piped input containing spaces, line endings, NUL bytes, or non-UTF-8 bytes
- **THEN** the operation receives every input byte unchanged

### Requirement: Empty input follows the operation's existing contract
The CLI SHALL distinguish the absence of an interactive input source from empty content and SHALL preserve operation-specific validation of empty or whitespace-only values.

#### Scenario: Empty content is valid for a byte operation
- **WHEN** a byte-oriented operation that supports empty content receives an empty argument or empty non-interactive stdin
- **THEN** the operation produces its defined empty-input result

#### Scenario: JWT input is empty after normalization
- **WHEN** a JWT command receives input that is empty or whitespace-only after its existing normalization
- **THEN** the command retains its existing missing-input error contract

#### Scenario: Structured text is empty after normalization
- **WHEN** a formatter receives empty piped text
- **THEN** the formatter returns its normal format-validation error rather than panicking or blocking

### Requirement: Byte-oriented security operations accept arbitrary bytes compatibly
Hash and HMAC message input SHALL support arbitrary byte sequences from stdin without requiring valid UTF-8, while retaining their existing surrounding-whitespace normalization for piped messages and their existing textual argument and secret contracts.

#### Scenario: Hash receives non-UTF-8 stdin
- **WHEN** a user pipes arbitrary non-UTF-8 bytes to a hash command
- **THEN** the digest is calculated without a Unicode decoding failure after the existing surrounding-whitespace normalization is applied at the byte boundary

#### Scenario: HMAC receives binary message input
- **WHEN** a user pipes a message containing NUL or non-UTF-8 bytes to an HMAC command
- **THEN** the authentication code is calculated over the normalized message bytes using the supplied secret

#### Scenario: Shell newline remains normalized for security input
- **WHEN** a user pipes `hello` followed by a line ending to a hash or HMAC command
- **THEN** the result remains the same as supplying the positional message `hello`

### Requirement: Conversion retains explicit source composition
The conversion command SHALL continue to support argument-only, stdin-only, and combined stdin-plus-argument expressions while applying its existing whitespace normalization at the composition boundary.

#### Scenario: Conversion uses only arguments
- **WHEN** a conversion expression is supplied entirely as arguments and stdin has no piped content
- **THEN** the CLI parses the joined arguments as the complete expression

#### Scenario: Conversion uses only stdin
- **WHEN** a conversion expression is supplied through stdin with no expression arguments
- **THEN** the CLI parses the normalized stdin content as the complete expression

#### Scenario: Conversion combines stdin and arguments
- **WHEN** stdin contains the first portion of an expression and arguments contain the remaining portion
- **THEN** the CLI combines the normalized sources with a valid separator and parses the resulting expression

#### Scenario: Conversion receives neither source
- **WHEN** conversion has no expression arguments and stdin supplies no usable content
- **THEN** the command exits unsuccessfully with its existing no-input guidance

### Requirement: JWT input and secret contracts remain stable
JWT token and payload input SHALL use the shared input behavior without changing observable normalization, missing-input errors, or environment-backed secret resolution.

#### Scenario: JWT uses a supplied token without stdin
- **WHEN** a JWT token is supplied as an argument
- **THEN** the command uses that token without reading stdin and retains its current output contract

#### Scenario: JWT reads normalized piped input
- **WHEN** a JWT token or signing payload is supplied through stdin
- **THEN** the command applies its existing surrounding-whitespace normalization before validation

#### Scenario: JWT secret comes from the environment
- **WHEN** a JWT command selects an environment variable as its secret source
- **THEN** secret resolution and its errors remain separate from generic argument-or-stdin input handling
