# Makefile for strapd project

.PHONY: all rust-fmt rust-fmt-check rust-lint rust-install rust-install-coverage rust-build cli-build cli-release rust-test rust-coverage rust-coverage-report wasm-build webapp-install webapp-fmt webapp-fmt-check webapp-lint webapp-dev webapp-build webapp-test webapp-coverage webapp-coverage-open coverage help lint fmt fmt-check test install-hooks brew-formula-check brew-update-checksums

# -------------------
# Help
# -------------------
help:
	@echo "Available targets:"
	@echo "  rust-fmt              - Format all Rust code"
	@echo "  rust-fmt-check        - Check Rust code formatting"
	@echo "  rust-lint             - Run Rust linter (clippy)"
	@echo "  rust-install          - Install Rust dependencies"
	@echo "  rust-install-coverage - Install cargo-llvm-cov coverage tool"
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
	@echo "  rust-coverage         - Run Rust tests with coverage (HTML)"
	@echo "  rust-coverage-report  - Generate Rust coverage report (LCOV)"
	@echo "  webapp-coverage       - Run webapp tests with coverage"
	@echo "  webapp-coverage-open  - Run webapp tests with coverage and open report"
	@echo "  coverage              - Run all tests with coverage"
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

# Install coverage tools
rust-install-coverage:
	cargo install cargo-llvm-cov

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

# Run tests with coverage (HTML report) - excludes wasm wrapper crate
rust-coverage:
	@command -v cargo-llvm-cov >/dev/null 2>&1 || { echo "Installing cargo-llvm-cov..."; cargo install cargo-llvm-cov; }
	cargo llvm-cov --all-features --workspace --exclude strapd-wasm --html

# Generate coverage report (LCOV format)
rust-coverage-report:
	@command -v cargo-llvm-cov >/dev/null 2>&1 || { echo "Installing cargo-llvm-cov..."; cargo install cargo-llvm-cov; }
	cargo llvm-cov --all-features --workspace --exclude strapd-wasm --lcov --output-path lcov.info

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
	cd webapp && pnpm test

# Test webapp with coverage
webapp-coverage:
	cd webapp && pnpm test --coverage

# Test webapp with coverage and open report
webapp-coverage-open:
	cd webapp && pnpm test --coverage && open coverage/index.html

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

# Run all tests with coverage
coverage: rust-coverage webapp-coverage

# Install git pre-commit hooks
install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hooks installed successfully!"
