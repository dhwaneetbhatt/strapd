# strapd 🛠️

A CLI tool for developers with common utilities like string manipulation, data format conversions, encoding, security stuff, date/time processing, and more.

> **Note**: This project is under active development. More utilities and features will be added regularly.

## Why strapd?

The name `strapd` is a play on "strapped" — like having a utility belt. It's meant to be a go-to toolkit for common developer tasks.

I got tired of constant fragmentation: need to encode base64? There's a website. Want a UUID? Another site. String manipulation? Yet another. Hash something? A different tool again. Every task meant hunting for the right site or remembering bookmarks.

CLI tools aren't much better: `jq` for JSON, `base64` for encoding, `uuidgen` for UUIDs, `openssl` for hashing. Each command has its own syntax and flags. Linux tools like `sed`, `awk`, and `tr` are powerful but tricky. Opening a REPL or creating a script for a 5-second task felt tedious.

LLMs are overkill and not best suited for these tasks — they're slow, costly, and unnecessary. I wanted something fast, offline, and simple.

So I built `strapd`: one tool with simple commands and lots of intuitive aliases. It is primarily targeted for CLI, but also provides a webapp interface for those who prefer GUIs. The webapp uses the same core library as the CLI using WASM, ensuring consistency.

## Current Features

- **String Tools**: case, trim, slugify, reverse, replace, analysis
- **UUIDs**: v4, v7
- **Encoding**: Base64, URL, Hex
- **Data Formatting**: JSON, YAML, XML, SQL (beautify, minify, sort)
- **Format Conversion**: YAML ⇄ JSON
- **Security**: Hash (MD5, SHA-1, SHA-256, SHA-512), HMAC (SHA-256, SHA-512)
- **Random**: numbers, strings
- **Date/Time**: timestamps
- **Clipboard**: copy and paste (CLI only)

Head over to the [webapp](https://dhwaneetbhatt.com/strapd/) for an interactive experience!

## CLI Installation

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
