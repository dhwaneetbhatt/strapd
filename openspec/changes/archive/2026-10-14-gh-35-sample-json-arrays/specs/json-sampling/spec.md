## Purpose

Provide a compact, repeatable sample of JSON arrays for understanding a payload's representative shape across CLI, WebApp, and Pipes.

## ADDED Requirements

### Requirement: Sampling filters null and empty array entries
The JSON sampling operation SHALL remove `null` entries and empty-array entries from arrays recursively before selecting samples. An array entry that becomes empty after this removal SHALL also be removed. It SHALL preserve all object members and their values, including `null`, empty strings, empty objects, and empty arrays. It SHALL preserve numbers, booleans, and strings in arrays. Any root JSON value SHALL remain representable.

#### Scenario: Array-only filtering cascades
- **WHEN** input is `{"keep":null,"rows":[null,[],[null,[]],0,false,"",{"field":null,"tags":[]}]}`
- **THEN** the result before sampling is `{"keep":null,"rows":[0,false,"",{"field":null,"tags":[]}]}`

#### Scenario: Empty root remains representable
- **WHEN** input is `{}`, `[]`, `null`, or `""`
- **THEN** the operation returns that root JSON value

### Requirement: Seeded sampling shortens each surviving array
Sampling SHALL always be enabled by `json sample`. N SHALL default to 3, accept a positive integer override, and be applied independently at every array depth. After filtering, each array with more than N entries SHALL retain N entries selected uniformly at random without replacement and emit them in their original relative order. An array with at most N entries SHALL retain all entries. The default seed SHALL be fixed and documented; a caller SHALL be able to override it with an unsigned integer seed. Identical input, N, and seed SHALL produce identical output on a given version. No omission marker SHALL be inserted into data.

#### Scenario: Recursive seeded sampling
- **WHEN** the same JSON containing nested arrays is sampled twice using the same size and seed
- **THEN** both results and omission statistics are identical, and each retained array contains at most N entries

#### Scenario: Sample size exceeds array length
- **WHEN** N=3 and an array has two entries after filtering
- **THEN** both entries remain in their original order and sampled omissions are zero

#### Scenario: Invalid sample size
- **WHEN** a user selects N=0 or a non-integer sample size
- **THEN** the operation rejects the option with a useful validation error

### Requirement: Sampling statistics identify loss without changing the JSON data
The operation SHALL separately report counts of `null` and empty-array entries removed from retained arrays, a total count of entries omitted by sampling, and each sampled array's omission count and JSON Pointer path in the final data. The root path SHALL be `""`; object names SHALL escape `~` as `~0` and `/` as `~1`. Statistics SHALL not report paths into entries omitted by a parent sample.

#### Scenario: Array losses are locatable
- **WHEN** retained `orders[0].items` omits entries
- **THEN** the array is reported at `/orders/0/items` with its omission count

#### Scenario: Omitted subtree is absent from details
- **WHEN** an outer array omits an object containing an inner array
- **THEN** no path into that omitted object is reported

### Requirement: All interfaces use the same local sampling transformation
The CLI SHALL expose `strapd json sample` with positional input or stdin, `--size N`, `--seed SEED`, and a useful error for invalid JSON. The WebApp SHALL expose a visible sampling tool with equivalent size and seed controls and raw JSON output. Pipes SHALL expose the same operation as a composable transform step and SHALL pass only raw JSON to the next step. Processing SHALL remain local.

#### Scenario: CLI and WebApp use equivalent options
- **WHEN** the same JSON, N, and seed are used in the CLI and WebApp
- **THEN** their transformed JSON values and loss statistics are equivalent

#### Scenario: Pipe follows sampling
- **WHEN** a pipe runs sampling before another JSON-consuming step
- **THEN** the next step receives raw sampled JSON without a wrapper or marker

#### Scenario: Invalid JSON input
- **WHEN** an interface receives malformed JSON
- **THEN** it fails with a useful invalid-JSON error and no successful transformed result
