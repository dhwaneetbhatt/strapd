# AI Agent Context - strapd Project

## Project Overview
**strapd** is a developer toolkit providing common utilities through multiple interfaces:
- **CLI**: Fast, offline command-line tool for developers
- **Webapp**: Browser-based GUI using the same core logic via WASM
- **Library**: Reusable Rust crate (`strapd-core`)

**Tech Stack**: Rust, WebAssembly (WASM), TypeScript/React, Vite

**Philosophy**: One unified tool to replace fragmented websites and CLI tools for common developer tasks (encoding, UUIDs, string manipulation, hashing, etc.)

## Project Structure

```
strapd/
├── crates/
│   ├── cli/          # Command-line interface binary
│   │   ├── src/
│   │   │   ├── args/       # CLI argument parsing (clap)
│   │   │   ├── handlers/   # Command handlers
│   │   │   └── main.rs
│   │   └── Cargo.toml
│   ├── core/         # Shared business logic library
│   │   ├── src/
│   │   │   ├── encoding/   # Base64, URL, Hex
│   │   │   ├── identifiers/ # UUID, ULID
│   │   │   ├── string/     # String manipulation
│   │   │   ├── security/   # Hashing, HMAC
│   │   │   ├── random/     # Random generation
│   │   │   ├── datetime/   # Date/time utilities
│   │   │   └── data_formats/ # JSON, YAML, XML, SQL
│   │   ├── tests/
│   │   └── Cargo.toml
│   └── wasm/         # WASM bindings for webapp
│       ├── src/
│       │   ├── encoding_ops.rs
│       │   ├── identifier_ops.rs
│       │   ├── string_ops.rs
│       │   └── lib.rs
│       └── Cargo.toml
├── webapp/           # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── tools/      # Tool UI components
│   │   │       ├── encoding/
│   │   │       ├── identifiers/
│   │   │       └── string/
│   │   ├── lib/
│   │   │   ├── wasm/       # WASM wrapper
│   │   │   └── utils/      # Utility functions
│   │   ├── tools/          # Tool definitions & logic
│   │   └── types/          # TypeScript types
│   ├── wasm/         # Built WASM output (generated)
│   ├── package.json
│   └── vite.config.ts
├── scripts/          # Installation & git hooks
├── Makefile          # Build automation
├── README.md         # User-facing documentation
├── CLAUDE.md         # Legacy AI context (deprecated)
└── AGENTS.md         # This file (AI agent context)
```

## Architecture & Data Flow

### CLI Flow
```
User Input → CLI Args Parser → Handler → strapd_core → Output
```

### Webapp Flow
```
User Input → React Component → Tool Definition → WASM Wrapper → strapd_wasm → strapd_core → Result
```

**Key Insight**: Both CLI and webapp use the same `strapd_core` library, ensuring consistent behavior.

## Current Features

### String Tools
- **Case conversion**: uppercase, lowercase, capitalize
- **Analysis**: count lines, words, chars, bytes
- **Transform**: reverse, replace, slugify
- **Whitespace**: trim (left, right, all)

### Identifiers
- **UUID**: v4 (random), v7 (timestamp-based)
- **ULID**: Universally Unique Lexicographically Sortable Identifier

### Encoding
- **Base64**: encode/decode
- **URL**: encode/decode
- **Hex**: encode/decode

### Data Formatting
- **JSON**: beautify, minify, sort keys
- **YAML**: beautify, minify
- **XML**: beautify, minify
- **SQL**: beautify

### Format Conversion
- **YAML ⇄ JSON**: bidirectional conversion

### Security
- **Hash**: MD5, SHA-1, SHA-256, SHA-512
- **HMAC**: SHA-256, SHA-512

### Random
- **Numbers**: generate random numbers
- **Strings**: generate random strings

### Date/Time
- **Timestamps**: Unix timestamps, ISO 8601

### Clipboard (CLI only)
- **Copy/Paste**: `strapd copy` and `strapd paste` for workflow automation

## Development Workflow

### Adding a New Feature

#### 1. Backend (Rust Core)
Add the core logic to `crates/core/src/<category>/`:
```rust
// Example: crates/core/src/encoding/hex.rs
pub fn encode(input: &Vec<u8>) -> String {
    hex::encode(input)
}

pub fn decode(input: &str) -> Result<Vec<u8>, &'static str> {
    hex::decode(input).map_err(|_| "Invalid hex input")
}
```

#### 2. CLI Integration
- Add args in `crates/cli/src/args/<category>.rs`
- Add handler in `crates/cli/src/handlers/<category>_handler.rs`
- Wire up in `crates/cli/src/main.rs`

#### 3. WASM Bindings
Add WASM exports in `crates/wasm/src/<category>_ops.rs`:
```rust
use wasm_bindgen::prelude::*;
use strapd_core::encoding;

#[wasm_bindgen]
pub fn hex_encode(input: &str) -> String {
    encoding::hex::encode(&input.as_bytes().to_vec())
}

#[wasm_bindgen]
pub fn hex_decode(input: &str) -> String {
    match encoding::hex::decode(input) {
        Ok(bytes) => String::from_utf8_lossy(&bytes).to_string(),
        Err(e) => format!("Error: {}", e),
    }
}
```

#### 4. Webapp Integration
- Add to `WasmModule` interface in `webapp/src/lib/wasm/index.ts`
- Add wrapper methods in `WasmWrapper` class
- Add operations to `webapp/src/lib/utils/<category>/index.ts`
- Create tool definition in `webapp/src/tools/<category>-tools.ts`
- Create React component in `webapp/src/components/tools/<category>/<tool>-tool.tsx`
- Export component from `webapp/src/components/tools/index.ts`

#### 5. Build & Test
```bash
make wasm-build      # Rebuild WASM
make webapp-dev      # Test in browser
make cli-build       # Build CLI
./target/debug/strapd <command>  # Test CLI
```

### Build Commands

```bash
# Rust
make rust-build      # Build all Rust crates (debug)
make rust-lint       # Run clippy linter
make rust-fmt        # Format Rust code
make rust-test       # Run Rust tests

# CLI
make cli-build       # Build CLI (debug)
make cli-release     # Build CLI (release)

# WASM
make wasm-build      # Build WASM module for webapp

# Webapp
make webapp-install  # Install pnpm dependencies
make webapp-dev      # Start dev server (Vite)
make webapp-build    # Build production webapp
make webapp-lint     # Lint webapp (Biome)
make webapp-fmt      # Format webapp (Biome)
make webapp-test     # Run webapp tests

# Combined
make lint            # Run all linters
make fmt             # Format all code
make test            # Run all tests
make install-hooks   # Install git pre-commit hooks
```

## Key Technologies

### Backend
- **Rust 1.70+**: Core language
- **Cargo Workspaces**: Multi-crate management
- **clap**: CLI argument parsing
- **wasm-bindgen**: Rust ↔ JavaScript interop
- **wasm-pack**: WASM build tool

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool & dev server
- **Chakra UI**: Component library
- **React Router**: Navigation
- **Biome**: Linting & formatting

### Dependencies
- `hex`: Hex encoding/decoding
- `base64`: Base64 encoding/decoding
- `uuid`: UUID generation
- `ulid`: ULID generation
- `serde`: Serialization/deserialization
- `serde_json`, `serde_yaml`: Format handling

## Important Patterns

### Error Handling
- **Rust**: Use `Result<T, E>` for fallible operations
- **WASM**: Return error strings (e.g., `"Error: Invalid input"`)
- **Webapp**: Display errors in UI via `ToolResult` type

### Tool Definition Pattern (Webapp)
```typescript
const toolDefinition: ToolDefinition = {
  id: "category-toolname",
  name: "Tool Name",
  description: "Brief description",
  category: "category",
  aliases: ["alias1", "alias2"],
  component: ToolComponent,
  operation: (inputs) => {
    // Call WASM wrapper
    return wasmWrapper.operation(inputs.text);
  },
};
```

### Component Pattern (Webapp)
- Use `useBaseTool` hook for state management
- Use `useAutoProcess` for automatic processing on input change
- Follow existing component structure (see `base64-tool.tsx`)

## Testing Strategy

### Rust Tests
- Unit tests in `crates/core/src/` modules
- Integration tests in `crates/core/tests/`
- Run with `make rust-test`

### Webapp Tests
- Component tests (planned)
- Run with `make webapp-test`

### Manual Testing
- CLI: Test commands manually
- Webapp: Test in browser at `http://localhost:5173/`

## CI/CD

- **GitHub Actions**: Automated testing and building
- **Pre-commit hooks**: Linting and formatting checks
- **Release binaries**: Built for multiple platforms

## Common Tasks for AI Agents

### Adding a New Tool
1. Implement in `crates/core/src/<category>/`
2. Add WASM bindings in `crates/wasm/src/<category>_ops.rs`
3. Rebuild WASM: `make wasm-build`
4. Add to webapp WASM wrapper
5. Create tool definition and component
6. Test in browser and CLI

### Debugging WASM Issues
- Check browser console for errors
- Verify WASM module is rebuilt: `make wasm-build`
- Check `webapp/wasm/` directory for generated files
- Ensure `WasmModule` interface matches Rust exports

### Code Style
- **Rust**: Follow `rustfmt` defaults (`.rustfmt.toml`)
- **Webapp**: Follow Biome configuration
- Run `make fmt` before committing

## Repository Information

- **GitHub**: https://github.com/dhwaneetbhatt/strapd
- **License**: Apache License 2.0
- **Main Branch**: `main`
- **Status**: Active development
- **Webapp**: https://dhwaneetbhatt.com/strapd/

## Notes for AI Agents

1. **Consistency is key**: Both CLI and webapp should behave identically
2. **WASM rebuild required**: After changing Rust code, always run `make wasm-build`
3. **Follow patterns**: Look at existing tools (e.g., Base64, UUID) as templates
4. **Test both interfaces**: Verify changes work in both CLI and webapp
5. **Update documentation**: Keep README.md and this file in sync with new features
6. **Error messages**: Make them helpful and user-friendly
7. **Performance**: Keep operations fast and lightweight
8. **Offline-first**: All core functionality should work without internet
