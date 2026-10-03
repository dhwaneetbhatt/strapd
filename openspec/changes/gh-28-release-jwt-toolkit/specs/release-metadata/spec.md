## ADDED Requirements

### Requirement: Consistent release metadata

The project SHALL use version 1.4.0 for its CLI, core, WASM, and webapp packages and corresponding workspace lockfile entries.

#### Scenario: Build the release

- **WHEN** the CLI and webapp are built from the release commit
- **THEN** package-derived version metadata identifies 1.4.0

### Requirement: Document released features

The changelog SHALL record merged unreleased CLI and webapp features under v1.4.0 with the release date.

#### Scenario: Read the release changelog

- **WHEN** a user reads the v1.4.0 changelog
- **THEN** JWT support and accumulated webapp improvements are listed
