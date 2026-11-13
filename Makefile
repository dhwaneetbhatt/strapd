# Makefile for strapd project

.PHONY: all setup rust-fmt rust-fmt-check rust-lint rust-audit rust-install rust-install-coverage rust-build cli-build cli-release rust-test rust-coverage rust-coverage-report wasm-build webapp-install webapp-fmt webapp-fmt-check webapp-lint webapp-audit webapp-dev webapp-build webapp-test webapp-e2e webapp-coverage webapp-coverage-open audit coverage help lint fmt fmt-check test install-hooks brew-formula-check brew-update-checksums

# -------------------
# Help
# -------------------
help:
	@echo "Available targets:"
	@echo "  setup                 - Install development tools and project dependencies"
	@echo "  rust-fmt              - Format all Rust code"
	@echo "  rust-fmt-check        - Check Rust code formatting"
	@echo "  rust-lint             - Run Rust linter (clippy)"
	@echo "  rust-audit            - Audit Rust dependencies for vulnerabilities"
	@echo "  rust-install          - Install Rust dependencies"
	@echo "  rust-install-coverage - Install cargo-llvm-cov coverage tool"
	@echo "  cli-build             - Build CLI crate (debug)"
	@echo "  cli-release           - Build CLI crate (release)"
	@echo "  rust-test             - Run Rust tests"
	@echo "  wasm-build            - Build WASM module for webapp"
	@echo "  portable-wasm-setup   - Install pinned portable WASM tooling"
	@echo "  portable-wasm-build   - Build portable core module and component"
	@echo "  portable-wasm-test    - Test portable artifact contracts"
	@echo "  portable-wasm-package - Package portable artifacts and checksums"
	@echo "  webapp-install        - Install webapp dependencies"
	@echo "  webapp-fmt            - Format webapp code"
	@echo "  webapp-fmt-check      - Check webapp code formatting"
	@echo "  webapp-lint           - Lint webapp code"
	@echo "  webapp-audit          - Audit webapp dependencies for high-severity vulnerabilities"
	@echo "  webapp-dev            - Start webapp development server"
	@echo "  webapp-build          - Build webapp"
	@echo "  webapp-test           - Run webapp tests"
	@echo "  webapp-e2e            - Run webapp browser tests"
	@echo "  rust-coverage         - Run Rust tests with coverage (HTML)"
	@echo "  rust-coverage-report  - Generate Rust coverage report (LCOV)"
	@echo "  webapp-coverage       - Run webapp tests with coverage"
	@echo "  webapp-coverage-open  - Run webapp tests with coverage and open report"
	@echo "  coverage              - Run all tests with coverage"
	@echo "  audit                 - Audit all dependencies for vulnerabilities"
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

# Install development tools and project dependencies
setup:
	./scripts/setup.sh

# Format all Rust code
rust-fmt:
	cargo fmt

# Check if code is formatted correctly
rust-fmt-check:
	cargo fmt -- --check

# Run Rust linter (clippy)
rust-lint:
	cargo clippy -- -D warnings

rust-audit:
	cargo audit

# Install dependencies
rust-install:
	cargo fetch
	cargo install wasm-pack --version 0.15.0 --locked --force

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
	cargo test $(TEST_ARGS)

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

# Portable library: one WIT contract, core WASI module and component.
WASM_TOOLS ?= $(CURDIR)/target/portable-tools/bin/wasm-tools
PORTABLE_DIR = $(CURDIR)/target/portable-wasm
PORTABLE_PYTHON = $(CURDIR)/target/portable-test/bin/python
WASI_ADAPTER = $(CURDIR)/target/portable-tools/reactor-50.0.1.wasm

.PHONY: portable-wasm-setup portable-wasm-build portable-wasm-test portable-wasm-package

portable-wasm-setup:
	rustup target add wasm32-wasip1
	cargo install wasm-tools --version 1.263.0 --locked --root $(CURDIR)/target/portable-tools
	$(MAKE) $(WASI_ADAPTER)

$(WASI_ADAPTER):
	mkdir -p $(dir $@)
	curl -fL https://github.com/bytecodealliance/wasmtime/releases/download/v50.0.1/wasi_snapshot_preview1.reactor.wasm -o $@.download
	echo "6d52112df28f0caee9018f911f279f94f848230b2f0ed02138290363e925671f  $@.download" | shasum -a 256 -c -
	mv $@.download $@

portable-wasm-build: $(WASI_ADAPTER)
	mkdir -p $(PORTABLE_DIR)
	cargo build --locked --release --target wasm32-wasip1 -p strapd-wasm-portable
	cp target/wasm32-wasip1/release/strapd_wasm_portable.wasm $(PORTABLE_DIR)/strapd.wasm
	cp crates/wasm-portable/wit/tools.wit $(PORTABLE_DIR)/tools.wit
	$(WASM_TOOLS) validate $(PORTABLE_DIR)/strapd.wasm
	$(WASM_TOOLS) component new $(PORTABLE_DIR)/strapd.wasm --adapt wasi_snapshot_preview1=$(WASI_ADAPTER) -o $(PORTABLE_DIR)/strapd.component.wasm
	$(WASM_TOOLS) validate $(PORTABLE_DIR)/strapd.component.wasm

target/portable-test/.wasmtime-50.0.1:
	python3 -m venv $(CURDIR)/target/portable-test
	$(PORTABLE_PYTHON) -m pip install wasmtime==50.0.1
	touch $@

portable-wasm-test: portable-wasm-build target/portable-test/.wasmtime-50.0.1
	$(PORTABLE_PYTHON) crates/wasm-portable/tests/contract.py $(PORTABLE_DIR)

portable-wasm-package: portable-wasm-build
	cd $(PORTABLE_DIR) && shasum -a 256 strapd.wasm strapd.component.wasm tools.wit > SHA256SUMS
	tar -czf $(CURDIR)/target/strapd-wasm.tar.gz -C $(PORTABLE_DIR) strapd.wasm strapd.component.wasm tools.wit SHA256SUMS

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

webapp-audit:
	cd webapp && pnpm audit --audit-level high

# Start webapp dev server
webapp-dev:
	cd webapp && pnpm dev

# Build webapp
webapp-build:
	cd webapp && pnpm build

# Test webapp
webapp-test:
	cd webapp && pnpm test $(TEST_ARGS)

# Test responsive flows in a real browser
webapp-e2e:
	cd webapp && pnpm test:e2e $(TEST_ARGS)

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
test: rust-test webapp-test webapp-e2e

# Run all tests with coverage
coverage: rust-coverage webapp-coverage

audit: rust-audit webapp-audit

# Install git pre-commit hooks
install-hooks:
	cp scripts/pre-commit .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hooks installed successfully!"
