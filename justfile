set shell := ["zsh", "-cu"]

default:
    @just --list

setup:
    ./scripts/setup.sh

install-hooks:
    cp scripts/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit

rust-test *args:
    TZ=UTC cargo test {{args}}

rust-fmt:
    cargo fmt

rust-fmt-check:
    cargo fmt -- --check

rust-lint:
    cargo clippy -- -D warnings

cli-build:
    cargo build -p strapd

cli-release:
    cargo build -p strapd --release

wasm-build:
    RUSTFLAGS='--cfg getrandom_backend="wasm_js"' wasm-pack build crates/wasm --out-dir {{justfile_directory()}}/webapp/wasm

webapp-test *args:
    cd webapp && pnpm test {{args}}

webapp-check:
    cd webapp && pnpm biome check && pnpm exec tsc --noEmit

webapp-fmt:
    cd webapp && pnpm biome check --write

webapp-build:
    cd webapp && pnpm build

webapp-dev:
    cd webapp && pnpm dev --host 127.0.0.1
