# Makefile for strapd project

.PHONY: all rust-fmt rust-fmt-check rust-lint rust-install rust-build rust-test wasm-build webapp-install webapp-fmt webapp-fmt-check webapp-lint webapp-dev webapp-build webapp-test help lint fmt fmt-check test install-hooks

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

# Build the project
rust-build:
	cargo build

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
# Help
# -------------------
help:
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## ?"}; {printf "  %-16s %s\n", $$1, $$2}'

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
