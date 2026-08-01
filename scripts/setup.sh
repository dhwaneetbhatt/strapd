#!/usr/bin/env bash
set -euo pipefail

# Sets up the development toolchain and installs project dependencies.
# Usage: ./scripts/setup.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_VERSION="24.13.1"
PNPM_VERSION="10.15.1"

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

info() {
  printf '\n==> %s\n' "$1"
}

cd "$ROOT_DIR"

if ! command_exists asdf; then
  echo "asdf is required to install Node.js. Install asdf, then rerun this script." >&2
  exit 1
fi

if ! command_exists curl; then
  echo "curl is required to install Rust with rustup." >&2
  exit 1
fi

if ! asdf plugin list | grep -qx "nodejs"; then
  info "Adding the asdf Node.js plugin"
  asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
fi

info "Installing Node.js ${NODE_VERSION} with asdf"
asdf install nodejs "$NODE_VERSION"

info "Enabling pnpm ${PNPM_VERSION} through Corepack"
asdf exec corepack prepare "pnpm@${PNPM_VERSION}" --activate
asdf exec corepack enable
asdf reshim nodejs "$NODE_VERSION"

export PATH="$HOME/.cargo/bin:$PATH"

if ! command_exists rustup; then
  info "Installing Rust with rustup"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile default
fi

info "Installing the stable Rust toolchain and WASM target"
rustup toolchain install stable --profile default
rustup default stable
rustup target add wasm32-unknown-unknown

info "Installing project dependencies and building the local WASM package"
make rust-install wasm-build webapp-install

printf '\nSetup complete. Try: make test\n'
