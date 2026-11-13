.PHONY: setup build native fmt fmt-check lint go-test browser-test browser-baseline wasmtime-test

WASM_TOOLS ?= wasm-tools
REACTOR ?= build/reactor.wasm

setup:
	CI=true pnpm install --frozen-lockfile --store-dir $(CURDIR)/build/pnpm-store
	python3 -m venv .venv
	.venv/bin/python -m pip install wasmtime==50.0.1
	mkdir -p build
	curl -fL https://github.com/bytecodealliance/wasmtime/releases/download/v50.0.1/wasi_snapshot_preview1.reactor.wasm -o build/reactor.wasm

build:
	mkdir -p build
	cargo build --locked --release --target wasm32-wasip1 -p strapd-poc-buffer -p strapd-poc-component
	cp target/wasm32-wasip1/release/strapd_poc_buffer.wasm build/buffer.wasm
	cp target/wasm32-wasip1/release/strapd_poc_component.wasm build/wit-core.wasm
	$(WASM_TOOLS) component new build/wit-core.wasm --adapt wasi_snapshot_preview1=$(REACTOR) -o build/component.wasm
	$(WASM_TOOLS) validate build/component.wasm
	pnpm exec jco transpile build/component.wasm -o build/js --name component --no-nodejs-compat

native:
	mkdir -p build
	TZ=UTC cargo run --locked --release --bin native

fmt:
	cargo fmt --all
	gofmt -w host/main.go
	../../webapp/node_modules/.bin/biome format --write browser.mjs package.json

fmt-check:
	cargo fmt --all -- --check
	../../webapp/node_modules/.bin/biome format browser.mjs package.json

lint:
	cargo clippy --workspace --all-targets -- -D warnings

go-test:
	cd host && GOCACHE=$(CURDIR)/build/go-cache GOPATH=$(CURDIR)/build/go-path go run -mod=readonly .

browser-baseline:
	RUSTFLAGS='--cfg getrandom_backend="wasm_js"' wasm-pack build ../../crates/wasm --target web --out-dir $(CURDIR)/build/baseline

browser-test:
	node browser.mjs

wasmtime-test:
	.venv/bin/python wasmtime_host.py
