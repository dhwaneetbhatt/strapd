# Makefile for strapd project

.PHONY: fmt fmt-check build test all help

# Format all Rust code
fmt:
	cargo fmt

# Check if code is formatted correctly
fmt-check:
	cargo fmt -- --check

# Build the project
build:
	cargo build

# Run tests
test:
	cargo test

# Format, build, and test
all: fmt build test

# Show available targets
help:
	@echo "Available targets:"
	@echo "  fmt       - Format all Rust code"
	@echo "  fmt-check - Check if code is formatted correctly"
	@echo "  build     - Build the project"
	@echo "  test      - Run tests"
	@echo "  all       - Format, build, and test"
	@echo "  help      - Show this help message"
