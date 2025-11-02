# Makefile for strapd project

.PHONY: fmt fmt-check lint build test install-hooks all help wasm-build webapp-install webapp-dev webapp-build webapp-test

# -------------------
# Rust Core Utilities
# -------------------

# Format all Rust code
fmt:
	cargo fmt

# Check if code is formatted correctly
fmt-check:
	cargo fmt -- --check

# Run linter (clippy)
lint:
	cargo clippy -- -D warnings

# Build the project
build:
	cargo build

# Run tests
test:
	cargo test

# Install git pre-commit hooks
install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hooks installed successfully!"

# Format, build, and test
all: fmt build test

# -------------------
# Webapp & WASM Tools
# -------------------

# Build WASM module for webapp
wasm-build:
	wasm-pack build crates/wasm --out-dir $(CURDIR)/webapp/wasm/pkg

# Install webapp dependencies
webapp-install:
	cd webapp && pnpm install

# Start webapp dev server
webapp-dev:
	cd webapp && pnpm dev

# Build webapp
webapp-build:
	cd webapp && pnpm build

# -------------------
# Help
# -------------------
help:
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## ?"}; {printf "  %-16s %s\n", $$1, $$2}'
