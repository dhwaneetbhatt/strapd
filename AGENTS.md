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
│   │   │   ├── jwt/        # JWT decoding, analysis, verification, signing
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
- **JSON Sample**: seeded recursive array sampling after removing null and empty-array entries from arrays; CLI `--output json` adds metadata only at the CLI edge; see `docs/usage.md`
- **YAML**: beautify, minify
- **XML**: beautify, minify
- **SQL**: beautify

### Format Conversion
- **YAML ⇄ JSON**: bidirectional conversion

### Security
- **Sanitize secrets**: Configurable deterministic redaction shared by CLI, WASM, WebApp, and Pipes; see `docs/sanitize-secrets.md`
- **Sanitize PII**: Local masking and invocation-local pseudonymization of IPs, emails, phones, cards, Aadhaar and PAN; see `docs/sanitize-pii.md`
- **Hash**: MD5, SHA-1, SHA-256, SHA-512
- **HMAC**: SHA-256, SHA-512
- **JWT**: decode/extract, expiration analysis, HS256/HS384/HS512 verification and signing

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
    just wasm-build      # Rebuild WASM
    just webapp-dev      # Test in browser
    just cli-build       # Build CLI
./target/debug/strapd <command>  # Test CLI
```

### Build Commands

Use `just` recipes for common lifecycle commands: setup, build, test, lint, format, and the dev server. Keep `justfile` limited to reusable project commands; run one-off diagnostics or feature scripts directly instead of adding a recipe for each. Do not invoke `cargo`, `pnpm`, `wasm-pack`, or `make` directly in agent workflows. Prefix shell commands with `rtk`, including `rtk just <recipe>`.

Pass focused test arguments through the existing recipes, for example `rtk just rust-test -p strapd-core --test json_sample` or `rtk just webapp-test --run src/tools/json-sample.test.ts`.

```bash
# Rust
just rust-lint       # Run clippy linter
just rust-fmt        # Format Rust code
just rust-test       # Run Rust tests

# CLI
just cli-build       # Build CLI (debug)
just cli-release     # Build CLI (release)

# WASM
just wasm-build      # Build WASM module for webapp

# Webapp
just webapp-dev      # Start dev server (Vite)
just webapp-build    # Build production webapp
just webapp-check    # Lint and type-check webapp
just webapp-test     # Run webapp tests

# Combined
just rust-lint       # Lint Rust
just rust-fmt        # Format Rust
just rust-test       # Test Rust
just webapp-test     # Test webapp
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
- Keep production code and tests in separate files; do not place `#[cfg(test)]` test bodies in implementation files.
- Put module-level Rust tests in a sibling `tests.rs` file or a dedicated `tests/` tree, and integration tests under each crate's `tests/` directory.
- Integration tests in `crates/core/tests/`
- Run with `just rust-test`

### Webapp Tests
- Component tests (planned)
- Run with `just webapp-test`

### Manual Testing
- CLI: Test commands manually
- Webapp: Test in browser at `http://localhost:5173/`

## CI/CD

- **GitHub Actions**: Automated testing and building
- **Pre-commit hooks**: Linting and formatting checks
- **Release binaries**: Built for multiple platforms

## Common Tasks for AI Agents

### Delegation and Context Economy
- Use `gpt-6-luna` only for substantial, bounded testing, benchmarks, research, or exploration. Never use Luna for production coding, fixes, refactoring, or implementation.
- Keep requirements, production implementation, integration, and final review in the primary thread. If production coding is delegated, use the primary model.
- Group related work into one assignment. Handle small lookups and edits directly when delegation overhead would exceed the savings.
- Give each agent a clear deliverable, file ownership, required skill paths, allowed commands, and exclusions. Concurrent writers must own disjoint files.
- Use fresh, narrowly scoped context for cheaper agents. Return concise findings and file references; write large reports to a file.
- Wait for completion notifications instead of repeatedly polling or importing full transcripts. Keep at most three subagents active.
- Before completing a substantial security or core logic change, request an independent correctness review; the primary agent resolves findings and verifies the final result.
- Keep Git mutations and destructive operations in the primary thread. Subagents must not stash, switch branches, reset, clean, commit, or push.
- Project concurrency settings and focused Luna researcher/tester roles live in `.codex/config.toml` and `.codex/agents/`. Unspecified subagent models inherit the primary model.

### OpenSpec Workflow
- Every feature, fix, or other implementation change must go through the OpenSpec workflow before code changes begin. Documentation-only edits do not need an OpenSpec change.
- Name each OpenSpec change with its GitHub issue prefix: `gh-<issue-number>-<short-kebab-case-description>` (for example, `gh-123-example-change`).
- Explore and clarify requirements first, create the OpenSpec proposal and required artifacts, apply the change, validate it, then archive it when complete.
- Keep command examples and common CLI/WebApp/Pipes patterns in `docs/usage.md`; keep README as an overview linking there. Add separate docs only for substantial reference material such as coverage, limits, or performance, rather than one page per command.

### Adding a New Tool
1. Implement in `crates/core/src/<category>/`
2. Add WASM bindings in `crates/wasm/src/<category>_ops.rs`
3. Rebuild WASM: `just wasm-build`
4. Add to webapp WASM wrapper
5. Create tool definition and component
6. Test in browser and CLI

### Debugging WASM Issues
- Check browser console for errors
- Verify WASM module is rebuilt: `just wasm-build`
- Check `webapp/wasm/` directory for generated files
- Ensure `WasmModule` interface matches Rust exports

### Code Style
- **Rust**: Follow `rustfmt` defaults (`.rustfmt.toml`)
- **Webapp**: Follow Biome configuration
- Run `just rust-fmt` and `just webapp-check` before committing

## Repository Information

- **GitHub**: https://github.com/dhwaneetbhatt/strapd
- **License**: Apache License 2.0
- **Main Branch**: `main`
- **Status**: Active development
- **Webapp**: https://dhwaneetbhatt.com/strapd/

## Notes for AI Agents

1. **Consistency is key**: Both CLI and webapp should behave identically
2. **WASM rebuild required**: After changing Rust code, always run `just wasm-build`
3. **Follow patterns**: Look at existing tools (e.g., Base64, UUID) as templates
4. **Test both interfaces**: Verify changes work in both CLI and webapp
5. **Update documentation**: Keep README.md and this file in sync with new features
6. **Error messages**: Make them helpful and user-friendly
7. **Performance**: Keep operations fast and lightweight
8. **Offline-first**: All core functionality should work without internet
