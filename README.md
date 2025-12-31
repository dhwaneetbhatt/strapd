# strapd 🛠️

A CLI tool for developers with common utilities like string manipulation, data format conversions, encoding, security stuff, date/time processing, and more.

## Why strapd?

The name `strapd` is a play on "strapped" — like having a utility belt for your development workflow.

### The Problem

Developer tasks are fragmented across too many tools. Need to encode base64? There's a website. UUID? Another site. String manipulation? Yet another. Every task requires hunting for the right tool or remembering yet another command syntax.

The alternatives aren't much better:
- **Web tools**: Scattered across the internet, require browser context switching
- **CLI tools**: Each has its own syntax (`jq` for JSON, `base64` for encoding, `openssl` for hashing, `sed`/`awk` for text manipulation)
- **LLMs**: Overkill, slow, costly, and unnecessary for simple utilities

### The Solution

`strapd` consolidates common developer tasks into one unified tool with simple commands and intuitive aliases. It runs locally, offline, and blazingly fast.

It's primarily CLI-focused, but also includes a webapp interface for those who prefer GUIs. Both use the same core Rust library via WASM, ensuring consistent behavior everywhere.

## Current Features

- **String Tools**: case, trim, slugify, reverse, replace, analysis
- **Identifiers**: UUIDs (v4, v7), ULIDs
- **Encoding**: Base64, URL, Hex
- **Data Formatting**: JSON, YAML, XML, SQL (beautify, minify, sort)
- **Format Conversion**: YAML ⇄ JSON, XML ⇄ JSON
- **Security**: Hash (MD5, SHA-1, SHA-256, SHA-512), HMAC (SHA-256, SHA-512)
- **Random**: numbers, strings
- **Date/Time**: timestamps
- **Clipboard**: copy and paste (CLI only)

Head over to the [webapp](https://dhwaneetbhatt.com/strapd/) for an interactive experience!

## CLI Installation

### Homebrew (macOS/Linux)

```bash
# Add the tap
brew tap dhwaneetbhatt/tap

# Install strapd
brew install strapd
```

### Quick Install Script

#### Unix/Linux/macOS

```bash
curl -fsSL https://raw.githubusercontent.com/dhwaneetbhatt/strapd/main/scripts/install.sh | bash
```

#### Windows (PowerShell)

```powershell
Invoke-RestMethod -Uri "https://raw.githubusercontent.com/dhwaneetbhatt/strapd/main/scripts/install.ps1" | Invoke-Expression
```

### Manual Download

Download pre-built binaries from [Releases](https://github.com/dhwaneetbhatt/strapd/releases).

### From Source

```bash
git clone https://github.com/dhwaneetbhatt/strapd.git
cd strapd
make cli-release
sudo ln -s $(pwd)/target/release/strapd /usr/local/bin/strapd
```

## Quick Start

```bash
# Convert text to uppercase
strapd str upper "hello world"

# Generate a UUID
strapd uuid v4

# Create a URL slug
echo "Hello, World!" | strapd str slugify
```

### Discovering Commands

```bash
strapd --help              # See all available commands
strapd string --help       # See string operations
strapd string case --help  # See string case operations
```

### Flexible Input

All operations work with stdin for seamless integration:

```bash
echo "hello world" | strapd str upper
cat file.txt | strapd string slugify
```

### Clipboard Integration

Use `strapd copy` and `strapd paste` to work with clipboard to build easy workflows:

```bash
strapd copy | strapd str upper | strapd paste
```

## Development and Contributing

1. Fork and clone the repository
2. Install hooks: `make install-hooks`
3. Make changes and commit (hooks run automatically)
4. Submit a pull request

### Available Commands

```bash
make cli-build     # Build CLI (debug)
make cli-release   # Build CLI (release)
make wasm-build    # Build WASM module
make webapp-build  # Build webapp
make test          # Run tests
make lint          # Run clippy linter
make fmt           # Format code
make install-hooks # Install git pre-commit hooks
make help          # Show all available commands
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
