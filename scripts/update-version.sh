#!/bin/bash

# Update version numbers in package.json and Cargo.toml files
# Usage: ./scripts/update-version.sh <version>
# Example: ./scripts/update-version.sh 1.2.0

set -e

VERSION=$1

# Validate version format (basic check)
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Invalid version format. Expected format: X.Y.Z (e.g., 1.2.0)"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Configure sed in-place arguments for different platforms
case "$(uname)" in
    Darwin*)
        # macOS / BSD sed requires an explicit (possibly empty) backup suffix
        SED_INPLACE=(-i '')
        ;;
    *)
        # GNU sed (common on Linux) uses -i without an empty-string suffix
        SED_INPLACE=(-i)
        ;;
esac

echo "Updating version to $VERSION..."

# Update webapp/package.json
echo "  Updating webapp/package.json..."
sed "${SED_INPLACE[@]}" "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$PROJECT_ROOT/webapp/package.json"

# Update crates/cli/Cargo.toml
echo "  Updating crates/cli/Cargo.toml..."
sed "${SED_INPLACE[@]}" "/^\[package\]/,/^\[/{s/version = \"[^\"]*\"/version = \"$VERSION\"/;}" "$PROJECT_ROOT/crates/cli/Cargo.toml"

# Update crates/core/Cargo.toml
echo "  Updating crates/core/Cargo.toml..."
sed "${SED_INPLACE[@]}" "/^\[package\]/,/^\[/{s/version = \"[^\"]*\"/version = \"$VERSION\"/;}" "$PROJECT_ROOT/crates/core/Cargo.toml"

# Update crates/wasm/Cargo.toml
echo "  Updating crates/wasm/Cargo.toml..."
sed "${SED_INPLACE[@]}" "/^\[package\]/,/^\[/{s/version = \"[^\"]*\"/version = \"$VERSION\"/;}" "$PROJECT_ROOT/crates/wasm/Cargo.toml"

echo "✓ Version updated to $VERSION in all files:"
echo "  - webapp/package.json"
echo "  - crates/cli/Cargo.toml"
echo "  - crates/core/Cargo.toml"
echo "  - crates/wasm/Cargo.toml"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Update CHANGELOG.md with your changes"
echo "  3. Commit: git commit -am \"Update version to $VERSION\""
echo "  4. (Optional) Tag for release: git tag v$VERSION"
