# strapd 🛠️

A CLI tool for developers with common utilities like string manipulation, data format conversions, encoding, security stuff, date/time processing, and more.

> **Note**: This project is under active development. More utilities and features will be added regularly.

[![CI](https://github.com/dhwaneetbhatt/strapd/workflows/CI/badge.svg)](https://github.com/dhwaneetbhatt/strapd/actions)

## Why strapd?

The name `strapd` is a play on "strapped" — like having a utility belt. It's meant to be a go-to toolkit for common developer tasks.

I got tired of constant fragmentation: need to encode base64? There's a website. Want a UUID? Another site. String manipulation? Yet another. Hash something? A different tool again. Every task meant hunting for the right site or remembering bookmarks.

CLI tools aren't much better: `jq` for JSON, `base64` for encoding, `uuidgen` for UUIDs, `openssl` for hashing. Each command has its own syntax and flags. Linux tools like `sed`, `awk`, and `tr` are powerful but tricky. Opening a REPL or creating a script for a 5-second task felt tedious.

LLMs are overkill and not best suited for these tasks — they're slow, costly, and unnecessary. I wanted something fast, offline, and simple.

So I built `strapd`: one tool with simple commands and lots of intuitive aliases. Type commands however feels natural.

- **Fast** — Written in Rust, runs quickly
- **Portable** — Linux, macOS, Windows, single binary, no dependencies
- **Focused** — Designed for developer tasks, not everything
- **Flexible** — Multiple aliases so commands feel natural

Eventually planning to build a web version using WASM, making these same tools available in browsers.

## Current Features

- **String Operations**: Case conversion, trimming, slugification, reversal, replacement
- **UUID Generation**: Generate v4 and v7 UUIDs
- **Encoding/Decoding**: Base64, URL and Hex
- **JSON/XML/SQL Formatting**: Beautify, minify and sort JSON
- **Hashing**: MD5, SHA-1, SHA-256, SHA-512
- **Random Data**: Generate random numbers and strings
- **Date/Time**: Timestamp to date string

## Requirements

- **For building from source**: Rust 1.70+ and Cargo
- **Supported platforms**: Linux, macOS, Windows

## Installation

### Pre-built Binaries (Coming Soon)

Download from [Releases](https://github.com/dhwaneetbhatt/strapd/releases)

### Via Cargo (When Published)

```bash
cargo install strapd
```

### From Source

```bash
git clone https://github.com/dhwaneetbhatt/strapd.git
cd strapd
cargo build --release
```

The binary will be available at `target/release/strapd`.

### Adding to PATH

```bash
# Copy to a directory in PATH
sudo cp target/release/strapd /usr/local/bin/
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

## Usage

### Discovering Commands

```bash
strapd --help              # See all available commands
strapd string --help       # See string operations
strapd uuid --help         # See UUID operations
```

### Flexible Input

All operations work with stdin for seamless integration:

```bash
echo "hello world" | strapd str upper
cat file.txt | strapd string slugify
```

## Library Usage

Add `strapd-core` to `Cargo.toml`:

```toml
[dependencies]
strapd-core = "0.1.0"
```

Example usage:

```rust
use strapd_core::{string, identifiers};

// String operations
let uppercase = string::case::to_uppercase("hello");
let slug = string::transform::slugify("Hello World!", '-');
let trimmed = string::whitespace::trim("  text  ", false, false, false);

// UUID generation
let uuid_v4 = identifiers::uuid::generate_v4(1);
let uuid_v7 = identifiers::uuid::generate_v7(1);
```

## Development

### Setup

```bash
git clone https://github.com/dhwaneetbhatt/strapd.git
cd strapd
make install-hooks  # Install pre-commit hooks
```

### Available Commands

```bash
make build         # Build the project
make test          # Run tests
make lint          # Run clippy linter
make fmt           # Format code
make install-hooks # Install git pre-commit hooks
```

### Learning & Contributing

I'm learning Rust as I build this project. I'm making use of AI to learn, write docs and tests, but I'm trying to type code by hand as much as possible without relying on AI for code generation. If something is not done the Rust way - help is appreciated from expert rustaceans.

### Contributing

1. Fork and clone the repository
2. Install hooks: `make install-hooks`
3. Make changes and commit (hooks run automatically)
4. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
