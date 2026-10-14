## ADDED Requirements

### Requirement: JSON sample supports raw and structured CLI output
`strapd json sample` SHALL accept `--output raw|json`, default to `raw`, and reject unsupported values. Raw mode SHALL print only the transformed JSON. JSON mode SHALL print a valid JSON object with exactly `data` and `metadata` top-level keys. `data` SHALL contain the transformed JSON value. `metadata.filtered` SHALL report numeric `nulls` and `emptyArrays`; `metadata.sampling` SHALL report numeric `omittedTotal` and an `arrays` list of objects with `path` and numeric `omitted` fields. Zero counts and an empty list SHALL be present when no entries are removed.

#### Scenario: Raw output remains composable
- **WHEN** `strapd json sample` runs without an output option
- **THEN** stdout contains only the sampled JSON value

#### Scenario: JSON response contains typed data and metadata
- **WHEN** `strapd json sample --output json` runs on an array longer than N
- **THEN** stdout contains typed sampled data and separate filtering and omission counts

#### Scenario: Failed input does not produce a success response
- **WHEN** JSON input or an option is invalid
- **THEN** the CLI exits unsuccessfully, reports the error on stderr, and does not emit a successful response on stdout

### Requirement: JSON sample response is an edge format
The JSON response shape SHALL be constructed only by the CLI. The shared operation SHALL expose typed results and statistics without imposing the CLI response shape on the core, WebApp output, or Pipes data flow. The `--output json` convention SHALL initially be supported by `json sample`; other commands SHALL not silently accept it without a defined response contract.

#### Scenario: WebApp and Pipes consume the same operation
- **WHEN** the WebApp or Pipes runs JSON sampling
- **THEN** their transformed data is raw JSON and does not contain the CLI `data` and `metadata` wrapper

#### Scenario: Another command requests JSON output before support exists
- **WHEN** a command without a defined JSON response is invoked with `--output json`
- **THEN** the CLI rejects the option rather than ignoring it

## REMOVED Requirements

### Requirement: JSON prune supports raw and structured CLI output
**Reason**: The prune command is replaced by sample.
**Migration**: Use `json sample --output raw|json`.

### Requirement: CLI JSON response is an edge format
**Reason**: This contract is now stated for JSON sample, with different metadata.
**Migration**: Use `json sample --output json`; the response remains CLI-only.
