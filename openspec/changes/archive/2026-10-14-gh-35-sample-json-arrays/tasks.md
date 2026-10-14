## 1. Core sampling

- [x] 1.1 Replace prune core module with recursive seeded sample and typed filtering/omission statistics.
- [x] 1.2 Add focused core tests for uniform selection, seed repeatability, nested array filtering, object-key preservation, paths, and invalid size.

## 2. Interface integration

- [x] 2.1 Replace CLI prune subcommand with sample, size and seed options, and raw/JSON output; add CLI tests.
- [x] 2.2 Replace WASM prune export and WebApp wrapper with sample result and statistics.
- [x] 2.3 Replace WebApp tool and Pipes step with sample controls and raw-output behavior; update focused tests and parity checks.

## 3. Validation and documentation

- [x] 3.1 Update README, detailed docs, and AGENTS feature description and migration notes.
- [x] 3.2 Run formatting, linting, Rust and WebApp tests, WASM build, browser/Pipes parity, and CLI end-to-end performance measurement.
- [x] 3.3 Obtain an independent correctness review of the sampling core and resolve any findings.
- [x] 3.4 Validate OpenSpec change, sync updated specs, and archive the completed change.
