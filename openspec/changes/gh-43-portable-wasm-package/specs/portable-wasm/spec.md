## Purpose

Expose strapd's reusable developer tools to non-browser WebAssembly hosts through a typed, versioned contract without JavaScript or client-specific integrations.

## ADDED Requirements

### Requirement: Portable tool catalog
The package SHALL expose the existing browser tool catalog through one versioned WIT world backed by the same core operations. Binary decoders SHALL return bytes, PII detections SHALL contain category and UTF-8 byte ranges, and JSON sampling SHALL preserve metadata and 64-bit seeds. Fallible operations SHALL return typed results without presentation prefixes.

#### Scenario: Binary and Unicode data
- **WHEN** a host decodes arbitrary bytes or detects PII after Unicode text
- **THEN** bytes are preserved and detection offsets refer to UTF-8 bytes

#### Scenario: Invalid input and recovery
- **WHEN** malformed input, an invalid generation count or an inverted random range is passed
- **THEN** the call returns an error without exposing secrets and subsequent valid calls succeed

### Requirement: Portable artifacts and host contract
The build SHALL produce a WASI Preview 1 core module, a component and their WIT contract from the same implementation. Artifacts SHALL have no JavaScript imports. Hosts SHALL provide clocks and secure randomness, serialize calls per instance and follow Canonical ABI allocation/post-return rules. WASI timestamps SHALL use UTC.

#### Scenario: Both artifact forms
- **WHEN** artifacts are built and loaded by a core runtime and a component runtime
- **THEN** equivalent operations return equivalent results, including errors, 64-bit values and host-backed UUIDs

#### Scenario: Future release packaging
- **WHEN** the existing release workflow is explicitly invoked
- **THEN** portable artifacts, WIT and checksums are included in the draft release alongside CLI binaries

### Requirement: Existing interface compatibility
The CLI and browser bindings SHALL retain their existing interfaces, feature behavior and WebApp integration. Portable support SHALL NOT require a language SDK or a client-specific module.

#### Scenario: Existing browser consumer
- **WHEN** the existing browser WASM and WebApp are rebuilt and tested
- **THEN** existing exports, behavior and application tests remain valid without an application migration
