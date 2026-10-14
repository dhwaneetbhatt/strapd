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
- **Data Formatting**: JSON, YAML, XML, SQL (beautify, minify, sort), plus recursive seeded JSON array sampling
- **Format Conversion**: YAML ⇄ JSON, XML ⇄ JSON
- **Security**: Hash (MD5, SHA-1, SHA-256, SHA-512), HMAC (SHA-256, SHA-512), JWT, secret sanitization
- **Random**: numbers, strings
- **Date/Time**: timestamps
- **Webapp Pipes**: reusable, sequential workflows composed from compatible tools
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
just cli-release
sudo ln -s $(pwd)/target/release/strapd /usr/local/bin/strapd
```

## Usage

Run `strapd --help` to discover commands. The [usage guide](docs/usage.md) covers CLI input and output patterns, examples across every command group, and WebApp Pipes. Detailed sanitization coverage and limits live in the [secrets](docs/sanitize-secrets.md) and [PII](docs/sanitize-pii.md) references.

## Development and Contributing

1. Fork and clone the repository
2. Run `just setup` to install the development toolchain and dependencies. It uses asdf for Node.js and pnpm, and rustup for Rust.
3. Install hooks: `just install-hooks`
4. Make changes and commit (hooks run automatically)
5. Submit a pull request

### Available Commands

```bash
just setup         # Install development tools and dependencies
just cli-build     # Build CLI (debug)
just cli-release   # Build CLI (release)
just wasm-build    # Build WASM module
just webapp-build  # Build webapp
just webapp-test   # Run webapp tests
just webapp-check  # Lint and type-check webapp
just rust-test     # Run Rust tests
just rust-lint     # Run clippy linter
just rust-fmt      # Format Rust code
just install-hooks # Install git pre-commit hooks
just --list        # Show available commands
```

For WebApp changes, run:

```bash
just webapp-test
just webapp-check
just webapp-build
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
