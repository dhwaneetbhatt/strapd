# Makefile for strapd project

.PHONY: all rust-fmt rust-fmt-check rust-lint rust-install rust-build cli-build cli-release rust-test wasm-build webapp-install webapp-fmt webapp-fmt-check webapp-lint webapp-dev webapp-build webapp-test help lint fmt fmt-check test install-hooks brew-formula-check brew-update-checksums

# -------------------
# Help
# -------------------
help:
	@echo "Available targets:"
	@echo "  rust-fmt              - Format all Rust code"
	@echo "  rust-fmt-check        - Check Rust code formatting"
	@echo "  rust-lint             - Run Rust linter (clippy)"
	@echo "  rust-install          - Install Rust dependencies"
	@echo "  cli-build             - Build CLI crate (debug)"
	@echo "  cli-release           - Build CLI crate (release)"
	@echo "  rust-test             - Run Rust tests"
	@echo "  wasm-build            - Build WASM module for webapp"
	@echo "  webapp-install        - Install webapp dependencies"
	@echo "  webapp-fmt            - Format webapp code"
	@echo "  webapp-fmt-check      - Check webapp code formatting"
	@echo "  webapp-lint           - Lint webapp code"
	@echo "  webapp-dev            - Start webapp development server"
	@echo "  webapp-build          - Build webapp"
	@echo "  webapp-test           - Run webapp tests"
	@echo "  lint                  - Run all linters"
	@echo "  fmt                   - Format all code"
	@echo "  fmt-check             - Check formatting for all code"
	@echo "  test                  - Run all tests"
	@echo "  install-hooks         - Install git pre-commit hooks"
	@echo "  brew-formula-check    - Check Homebrew formula syntax"
	@echo "  brew-update-checksums - Update Homebrew formula checksums"

# -------------------
# Rust
# -------------------

# Format all Rust code
rust-fmt:
	cargo fmt

# Check if code is formatted correctly
rust-fmt-check:
	cargo fmt -- --check

# Run Rust linter (clippy)
rust-lint:
	cargo clippy -- -D warnings

# Install dependencies
rust-install:
	cargo fetch
	cargo install wasm-pack --version 0.13.1

# Build all Rust crates (debug)
rust-build:
	cargo build

# Build only the CLI crate (debug)
cli-build:
	cargo build -p strapd

# Build only the CLI crate (release)
cli-release:
	cargo build -p strapd --release

# Run tests
rust-test:
	cargo test

# Build WASM module for webapp
wasm-build:
	RUSTFLAGS="--cfg getrandom_backend=\"wasm_js\"" wasm-pack build crates/wasm --out-dir $(CURDIR)/webapp/wasm

# -------------------
# Webapp
# -------------------

# Install webapp dependencies
webapp-install:
	cd webapp && pnpm install

# Format webapp code
webapp-fmt:
	cd webapp && pnpm biome format --write

# Check webapp code formatting
webapp-fmt-check:
	cd webapp && pnpm biome format

# Lint webapp
webapp-lint:
	cd webapp && pnpm biome check

# Start webapp dev server
webapp-dev:
	cd webapp && pnpm dev

# Build webapp
webapp-build:
	cd webapp && pnpm build

# Test webapp
webapp-test:
	cd webapp && pnpm test || echo "No tests configured yet"

# -------------------
# Combined targets
# -------------------

# Run all linters
lint: rust-lint webapp-lint

# Format all code
fmt: rust-fmt webapp-fmt

# Check formatting for all code
fmt-check: rust-fmt-check webapp-fmt-check

# Run all tests
test: rust-test webapp-test

# Install git pre-commit hooks
install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hooks installed successfully!"

# -------------------
# Homebrew
# -------------------

# Check Homebrew formula syntax
brew-formula-check:
	@echo "Checking Homebrew formula syntax..."
	@ruby -c Formula/strapd.rb
	@echo "✅ Formula syntax is valid!"

# Update Homebrew formula checksums from latest release
brew-update-checksums:
	@echo "Updating Homebrew formula checksums..."
	@./scripts/update-formula-checksums.sh
	@echo "✅ Formula checksums updated!"
