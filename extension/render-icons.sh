#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
icons="$root/icons"

if command -v rsvg-convert >/dev/null 2>&1; then
  for size in 16 32 48 128; do
    rsvg-convert -w "$size" -h "$size" "$icons/icon.svg" -o "$icons/$size.png"
  done
  exit 0
fi

if ! command -v magick >/dev/null 2>&1; then
  echo "Install rsvg-convert or ImageMagick to render the extension icons." >&2
  exit 1
fi

# ImageMagick's MSVG renderer ignores stroke attributes, so replay the SVG
# geometry as MVG drawing commands when librsvg is not available.
shield="fill '#0F172A' stroke '#2563EB' stroke-width 11 stroke-linejoin round path 'M 64,10 L 114,26 V 64 C 114,93 92,110 64,118 C 36,110 14,93 14,64 V 26 Z'"
glyph="fill none stroke '#FFFFFF' stroke-width 13 stroke-linecap round stroke-linejoin round path 'M 82,43 C 80,35 72,33 64,33 C 51,33 44,39 44,47 C 44,55 51,58 64,61 C 77,64 84,68 84,76 C 84,85 76,91 64,91 C 53,91 46,87 44,80'"

for size in 16 32 48 128; do
  magick -size 128x128 xc:none \
    -draw "$shield" \
    -draw "$glyph" \
    -filter Lanczos \
    -resize "${size}x${size}" \
    -depth 8 \
    "$icons/$size.png"
done
