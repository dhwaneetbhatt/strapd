#!/bin/bash
set -e

# Update Homebrew Formula with SHA256 checksums from GitHub releases
# Usage: ./scripts/update-formula-checksums.sh [version]
# Example: ./scripts/update-formula-checksums.sh v1.1.2

VERSION=${1:-$(git describe --tags --abbrev=0 2>/dev/null)}

if [ -z "$VERSION" ]; then
  echo "Error: No version specified and no git tags found."
  echo "Usage: $0 <version>"
  echo "Example: $0 v1.1.0"
  exit 1
fi
FORMULA_FILE="Formula/strapd.rb"

echo "Updating formula checksums for version: $VERSION"

# Remove 'v' prefix if present for download URLs
VERSION_NUM=${VERSION#v}

# Download and calculate checksums
MACOS_INTEL_SHA=$(curl -sL "https://github.com/dhwaneetbhatt/strapd/releases/download/v${VERSION_NUM}/strapd-macos-x86_64.tar.gz" | shasum -a 256 | awk '{print $1}')
MACOS_ARM_SHA=$(curl -sL "https://github.com/dhwaneetbhatt/strapd/releases/download/v${VERSION_NUM}/strapd-macos-aarch64.tar.gz" | shasum -a 256 | awk '{print $1}')
LINUX_INTEL_SHA=$(curl -sL "https://github.com/dhwaneetbhatt/strapd/releases/download/v${VERSION_NUM}/strapd-linux-x86_64.tar.gz" | shasum -a 256 | awk '{print $1}')
LINUX_ARM_SHA=$(curl -sL "https://github.com/dhwaneetbhatt/strapd/releases/download/v${VERSION_NUM}/strapd-linux-aarch64.tar.gz" | shasum -a 256 | awk '{print $1}')

echo "Calculated checksums:"
echo "  macOS Intel:  $MACOS_INTEL_SHA"
echo "  macOS ARM:    $MACOS_ARM_SHA"
echo "  Linux Intel:  $LINUX_INTEL_SHA"
echo "  Linux ARM:    $LINUX_ARM_SHA"

# Update formula file
sed -i.bak \
  -e "s|version \".*\"|version \"${VERSION_NUM}\"|" \
  -e "s|v[0-9.]\+/strapd-macos-x86_64.tar.gz|v${VERSION_NUM}/strapd-macos-x86_64.tar.gz|g" \
  -e "s|v[0-9.]\+/strapd-macos-aarch64.tar.gz|v${VERSION_NUM}/strapd-macos-aarch64.tar.gz|g" \
  -e "s|v[0-9.]\+/strapd-linux-x86_64.tar.gz|v${VERSION_NUM}/strapd-linux-x86_64.tar.gz|g" \
  -e "s|v[0-9.]\+/strapd-linux-aarch64.tar.gz|v${VERSION_NUM}/strapd-linux-aarch64.tar.gz|g" \
  -e "s|PUT_SHA256_HERE_FOR_INTEL.*|${MACOS_INTEL_SHA}\"|" \
  -e "s|PUT_SHA256_HERE_FOR_ARM.*|${MACOS_ARM_SHA}\"|" \
  -e "s|PUT_SHA256_HERE_FOR_LINUX_INTEL.*|${LINUX_INTEL_SHA}\"|" \
  -e "s|PUT_SHA256_HERE_FOR_LINUX_ARM.*|${LINUX_ARM_SHA}\"|" \
  "$FORMULA_FILE"

# Remove backup file
rm -f "${FORMULA_FILE}.bak"

echo "Formula updated successfully!"
echo ""
echo "Next steps:"
echo "1. Review the changes in $FORMULA_FILE"
echo "2. Commit the updated formula"
echo "3. Push to your homebrew tap repository"
