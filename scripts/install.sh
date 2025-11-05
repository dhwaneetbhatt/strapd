#!/bin/bash
set -e

# strapd installation script
# Usage: curl -fsSL https://raw.githubusercontent.com/dhwaneetbhatt/strapd/main/scripts/install.sh | bash

REPO="dhwaneetbhatt/strapd"
INSTALL_DIR="${STRAPD_INSTALL_DIR:-/usr/local/bin}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        *)          echo "unsupported";;
    esac
}

# Detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64)   echo "x86_64";;
        aarch64|arm64)  echo "aarch64";;
        *)              echo "unsupported";;
    esac
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main installation function
install_strapd() {
    print_status "Installing strapd..."

    # Detect platform
    OS=$(detect_os)
    ARCH=$(detect_arch)

    if [ "$OS" = "unsupported" ]; then
        print_error "Unsupported operating system: $(uname -s)"
        exit 1
    fi

    if [ "$ARCH" = "unsupported" ]; then
        print_error "Unsupported architecture: $(uname -m)"
        exit 1
    fi

    print_status "Detected platform: $OS-$ARCH"

    # Check required commands
    if ! command_exists curl; then
        print_error "curl is required but not installed"
        exit 1
    fi

    if ! command_exists tar; then
        print_error "tar is required but not installed"
        exit 1
    fi

    # Build filename
    FILENAME="strapd-${OS}-${ARCH}.tar.gz"
    DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${FILENAME}"

    print_status "Downloading $FILENAME..."

    # Create temporary directory
    TMP_DIR=$(mktemp -d)
    cd "$TMP_DIR"

    # Download and extract
    if curl -fsSL "$DOWNLOAD_URL" | tar xz; then
        print_success "Downloaded and extracted strapd"
    else
        print_error "Failed to download or extract strapd"
        exit 1
    fi

    # Check if binary exists
    if [ ! -f "strapd" ]; then
        print_error "strapd binary not found after extraction"
        exit 1
    fi

    # Make binary executable
    chmod +x strapd

    # Install binary
    print_status "Installing to $INSTALL_DIR..."

    if [ -w "$INSTALL_DIR" ]; then
        mv strapd "$INSTALL_DIR/"
        print_success "Installed strapd to $INSTALL_DIR/strapd"
    else
        print_status "Installing with sudo (requires password)..."
        if sudo mv strapd "$INSTALL_DIR/"; then
            print_success "Installed strapd to $INSTALL_DIR/strapd"
        else
            print_error "Failed to install strapd"
            exit 1
        fi
    fi

    # Clean up
    cd /
    rm -rf "$TMP_DIR"

    # Verify installation
    if command_exists strapd; then
        VERSION=$(strapd --version 2>/dev/null || echo "unknown")
        print_success "strapd installed successfully! Version: $VERSION"
        print_status "Try: strapd --help"
    else
        print_warning "strapd installed but not found in PATH"
        print_status "You may need to add $INSTALL_DIR to your PATH or restart your terminal"
    fi
}

# Run installation
install_strapd