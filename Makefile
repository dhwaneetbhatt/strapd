# Makefile for strapd project

.PHONY: fmt fmt-check lint build test install-hooks all help

# Format all Rust code
fmt:
	cargo fmt

# Check if code is formatted correctly
fmt-check:
	cargo fmt -- --check

# Run linter
lint:
	cargo clippy -- -D warnings

# Build the project
build:
	cargo build

# Run tests
test:
	cargo test

# Install git hooks
install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hooks installed successfully!"

# Format, build, and test
all: fmt build test

# Show available targets
help:
	@echo "Available targets:"
	@echo "  fmt           - Format all Rust code"
	@echo "  fmt-check     - Check if code is formatted correctly"
	@echo "  lint          - Run linter (clippy)"
	@echo "  build         - Build the project"
	@echo "  test          - Run tests"
	@echo "  install-hooks - Install git pre-commit hooks"
	@echo "  all           - Format, build, and test"
	@echo "  help          - Show this help message"
