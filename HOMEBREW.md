# Homebrew Distribution Guide

This document explains how to distribute `strapd` via Homebrew.

## Overview

strapd can be installed via Homebrew using two methods:

1. **Official Homebrew Tap** (recommended for users)
2. **Direct Formula Installation** (for development/testing)

## Quick Start for Users

Once the tap is set up, users can install strapd with:

```bash
brew install dhwaneetbhatt/tap/strapd
```

## For Maintainers

### Setting Up a Homebrew Tap

A Homebrew "tap" is a GitHub repository that contains Homebrew formulae. To create one:

1. **Create a new GitHub repository** named `homebrew-tap`:
   ```bash
   # Repository URL should be: https://github.com/dhwaneetbhatt/homebrew-tap
   ```

2. **Initialize the tap repository**:
   ```bash
   mkdir homebrew-tap
   cd homebrew-tap
   git init
   mkdir Formula
   ```

3. **Copy the formula** from this repository:
   ```bash
   cp /path/to/strapd/Formula/strapd.rb Formula/
   ```

4. **Commit and push**:
   ```bash
   git add Formula/strapd.rb
   git commit -m "Add strapd formula"
   git remote add origin https://github.com/dhwaneetbhatt/homebrew-tap.git
   git branch -M main
   git push -u origin main
   ```

### Updating the Formula for New Releases

After creating a new release, update the formula:

1. **Run the checksum update script**:
   ```bash
   ./scripts/update-formula-checksums.sh v1.1.2
   ```

   This script will:
   - Download the release artifacts from GitHub
   - Calculate SHA256 checksums
   - Update the formula file automatically

2. **Review the changes**:
   ```bash
   git diff Formula/strapd.rb
   ```

3. **Commit and push to the tap repository**:
   ```bash
   cd /path/to/homebrew-tap
   cp /path/to/strapd/Formula/strapd.rb Formula/
   git add Formula/strapd.rb
   git commit -m "Update strapd to v1.1.2"
   git push
   ```

### Testing the Formula Locally

Before publishing, test the formula:

```bash
# Install from local formula
brew install --build-from-source Formula/strapd.rb

# Or test with brew install if already tapped
brew reinstall strapd

# Run the built-in tests
brew test strapd

# Verify installation
strapd --version
strapd str upper "test"
```

### Formula Linting

Ensure the formula passes Homebrew's audit:

```bash
brew audit --strict --online Formula/strapd.rb
```

## Release Process

1. **Create and publish a GitHub release** with version tag (e.g., `v1.1.2`)
2. **Wait for CI to build and attach binaries** to the release
3. **Update formula checksums**:
   ```bash
   ./scripts/update-formula-checksums.sh v1.1.2
   ```
4. **Copy updated formula to tap repository**:
   ```bash
   cp Formula/strapd.rb /path/to/homebrew-tap/Formula/
   cd /path/to/homebrew-tap
   git add Formula/strapd.rb
   git commit -m "Update strapd to v1.1.2"
   git push
   ```
5. **Test the installation**:
   ```bash
   brew update
   brew upgrade strapd  # or brew install if not installed
   strapd --version
   ```

## Submitting to Homebrew Core (Optional)

To make strapd available via `brew install strapd` (without a tap):

1. **Ensure the project meets Homebrew's requirements**:
   - Project must be stable and well-maintained
   - At least 75 GitHub stars (or similar popularity metric)
   - 30 days since first release
   - Notable userbase

2. **Fork homebrew-core**:
   ```bash
   git clone https://github.com/Homebrew/homebrew-core.git
   cd homebrew-core
   ```

3. **Copy the formula**:
   ```bash
   cp /path/to/strapd/Formula/strapd.rb Formula/
   ```

4. **Create a pull request** to homebrew-core
   - Follow the [contribution guidelines](https://docs.brew.sh/How-To-Open-a-Homebrew-Pull-Request)
   - Include information about the project
   - Ensure all tests pass

## Formula Maintenance

### Supported Platforms

The formula supports:
- macOS (Intel and Apple Silicon)
- Linux (x86_64 and aarch64)

### Dependencies

Currently, strapd has no runtime dependencies. If this changes:

1. Update `Formula/strapd.rb`:
   ```ruby
   depends_on "some-dependency"
   ```

2. Update this documentation

### Formula Structure

The formula (`Formula/strapd.rb`) includes:
- **Metadata**: Description, homepage, license
- **Download URLs**: Platform-specific binary downloads
- **SHA256 checksums**: Integrity verification
- **Installation**: Binary installation to `bin/`
- **Tests**: Automated verification of functionality

## Troubleshooting

### Formula Checksum Mismatch

If users report checksum errors:

1. Verify the release artifacts haven't changed
2. Recalculate checksums:
   ```bash
   ./scripts/update-formula-checksums.sh v1.1.2
   ```
3. Update the tap repository

### Installation Failures

Debug installation issues:

```bash
# Install with verbose output
brew install --verbose --debug strapd

# Check formula audit
brew audit --strict Formula/strapd.rb

# Test formula
brew test strapd
```

## Resources

- [Homebrew Formula Cookbook](https://docs.brew.sh/Formula-Cookbook)
- [Homebrew Tap Documentation](https://docs.brew.sh/Taps)
- [How to Create a Homebrew Tap](https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap)

## Support

For Homebrew-specific issues:
- Check the [Homebrew documentation](https://docs.brew.sh/)
- Ask in [Homebrew Discussions](https://github.com/Homebrew/brew/discussions)

For strapd issues:
- Open an issue in the [main repository](https://github.com/dhwaneetbhatt/strapd/issues)
