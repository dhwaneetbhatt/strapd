# strapd installation script for Windows
# Usage: Invoke-RestMethod -Uri "https://raw.githubusercontent.com/dhwaneetbhatt/strapd/main/scripts/install.ps1" | Invoke-Expression

param(
    [string]$InstallDir = "$env:USERPROFILE\.strapd"
)

$ErrorActionPreference = "Stop"

$REPO = "dhwaneetbhatt/strapd"

# Colors for output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Detect architecture
function Get-Architecture {
    $arch = $env:PROCESSOR_ARCHITECTURE
    switch ($arch) {
        "AMD64" { return "x86_64" }
        "ARM64" { return "aarch64" }
        default {
            Write-Error "Unsupported architecture: $arch"
            exit 1
        }
    }
}

# Check if directory is in PATH
function Test-InPath {
    param([string]$Dir)
    $paths = $env:PATH -split ';'
    return $paths -contains $Dir
}

# Add directory to PATH
function Add-ToPath {
    param([string]$Dir)

    if (Test-InPath $Dir) {
        Write-Status "Directory already in PATH: $Dir"
        return
    }

    try {
        # Add to user PATH
        $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($userPath) {
            $newPath = "$userPath;$Dir"
        } else {
            $newPath = $Dir
        }
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")

        # Update current session PATH
        $env:PATH += ";$Dir"

        Write-Success "Added $Dir to PATH"
        Write-Warning "Please restart your terminal or run 'refreshenv' for PATH changes to take effect"
    } catch {
        Write-Warning "Failed to add $Dir to PATH automatically"
        Write-Status "Please manually add $Dir to your PATH environment variable"
    }
}

# Main installation function
function Install-Strapd {
    Write-Status "Installing strapd..."

    # Detect architecture
    $arch = Get-Architecture
    Write-Status "Detected architecture: $arch"

    # Build filename and URL
    $filename = "strapd-windows-$arch.zip"
    $downloadUrl = "https://github.com/$REPO/releases/latest/download/$filename"

    Write-Status "Downloading $filename..."

    # Create install directory
    if (!(Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        Write-Status "Created install directory: $InstallDir"
    }

    # Download file
    $zipPath = Join-Path $InstallDir "strapd.zip"
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
        Write-Success "Downloaded strapd"
    } catch {
        Write-Error "Failed to download strapd: $($_.Exception.Message)"
        exit 1
    }

    # Extract file
    try {
        Expand-Archive -Path $zipPath -DestinationPath $InstallDir -Force
        Remove-Item $zipPath
        Write-Success "Extracted strapd"
    } catch {
        Write-Error "Failed to extract strapd: $($_.Exception.Message)"
        exit 1
    }

    # Verify binary exists
    $binaryPath = Join-Path $InstallDir "strapd.exe"
    if (!(Test-Path $binaryPath)) {
        Write-Error "strapd.exe not found after extraction"
        exit 1
    }

    # Add to PATH
    Add-ToPath $InstallDir

    # Verify installation
    try {
        $version = & $binaryPath --version 2>$null
        if ($version) {
            Write-Success "strapd installed successfully! Version: $version"
        } else {
            Write-Success "strapd installed successfully!"
        }
        Write-Status "Installed to: $binaryPath"
        Write-Status "Try: strapd --help"
    } catch {
        Write-Warning "strapd installed but verification failed"
        Write-Status "Binary location: $binaryPath"
    }
}

# Run installation
Install-Strapd