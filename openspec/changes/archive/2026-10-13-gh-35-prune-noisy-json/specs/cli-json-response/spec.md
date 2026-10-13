## Purpose

Define an opt-in, machine-readable CLI response convention that separates command data from operation metadata without changing default pipeline output.

## ADDED Requirements

### Requirement: JSON prune supports raw and structured CLI output
`strapd json prune` SHALL accept `--output raw|json`, default to `raw`, and reject unsupported values. Raw mode SHALL print only the transformed JSON. JSON mode SHALL print a valid JSON object with exactly `data` and `metadata` top-level keys. `data` SHALL contain the transformed JSON value, not a string encoding of that value. `metadata.pruned` SHALL contain numeric `nulls`, `emptyStrings`, `emptyObjects`, `emptyArrays`, and `droppedKeys` fields. `metadata.sampling` SHALL contain numeric `omittedTotal` and an `arrays` list of objects with `path` and numeric `omitted` fields; zero counts and an empty list SHALL be present when nothing is removed.

#### Scenario: Raw output remains composable
- **WHEN** `strapd json prune` runs without an output option
- **THEN** stdout contains only the transformed JSON value

#### Scenario: JSON response contains typed data and metadata
- **WHEN** `strapd json prune --output json` samples `[1,2,3,4,5,6,7]` with N=3
- **THEN** stdout is a JSON object whose `data` value is `[1,2,3,7]` and whose `metadata` reports three sampled omissions at the root path

#### Scenario: Failed input does not produce a success response
- **WHEN** JSON input or an option is invalid
- **THEN** the CLI exits unsuccessfully, reports the error on stderr, and does not emit a successful response on stdout

### Requirement: CLI JSON response is an edge format
The JSON response shape SHALL be constructed only by the CLI. The shared operation SHALL expose typed results and statistics without imposing the CLI response shape on the core, WebApp output, or Pipes data flow. The `--output json` convention SHALL initially be supported by `json prune`; other commands SHALL not silently accept it without a defined response contract.

#### Scenario: WebApp and Pipes consume the same operation
- **WHEN** the WebApp or Pipes runs JSON pruning
- **THEN** their transformed data is raw JSON and does not contain the CLI `data` and `metadata` wrapper

#### Scenario: Another command requests JSON output before support exists
- **WHEN** a command without a defined JSON response is invoked with `--output json`
- **THEN** the CLI rejects the option rather than ignoring it or changing that command's existing output
