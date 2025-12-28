# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Homebrew support**: Added Homebrew formula for easy installation on macOS and Linux
  - Created `Formula/strapd.rb` with support for Intel and ARM architectures
  - Added `scripts/update-formula-checksums.sh` to automate formula updates
  - Added `HOMEBREW.md` documentation for maintainers
  - Added Makefile targets: `brew-formula-check` and `brew-update-checksums`
- Updated README.md with Homebrew installation instructions

## [v1.1.2] - 2025-12-26

### webapp

- fix: timestamp converter milliseconds toggle now properly scales value to maintain same time point

## [v1.1.1] - 2025-12-24

### webapp

- feat: improved user experience and fix styling issues in tools.

## [v1.1.0] - 2025-12-24

### cli

- feat: `strapd random string` supports custom charset.

### core

- **Breaking**: `strapd_core::random::string()` now takes `count` and returns `Result<Vec<String>, String>`.

### webapp

- feat: random string generation with custom charset option.
- fix: URL state was not preserved for random string tool.

## [v1.0.0] - 2025-12-23

- Initial release.
- Core features:
  - **String**: case conversions, analysis, transform, whitespace tools
  - **Identifiers**: UUID v4/v7, ULID
  - **Encoding**: Base64, URL, Hex (encode/decode)
  - **Data Formatting**: JSON/YAML/XML beautify/minify, SQL beautify, JSON key sorting
  - **Format Conversion**: YAML ⇄ JSON
  - **Security**: Hash (MD5/SHA-1/SHA-256/SHA-512), HMAC (SHA-256/512)
  - **Random**: numbers and strings
  - **Date/Time**: Unix timestamps, ISO 8601
- CLI: Fast offline tool mirroring core functionality.
- WASM: Bindings for webapp with consistent behavior.
- Webapp: React + TypeScript frontend using WASM module.
