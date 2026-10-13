# JSON Pruning Specification

## Purpose

Provide one local, predictable JSON cleanup operation across the CLI, WebApp, and Pipes, with optional array reduction and observable loss statistics.

## Requirements

### Requirement: Pruning removes unwanted values recursively
The system SHALL remove null values, empty strings, empty objects, and empty arrays from nested object members and array entries. It SHALL repeat removal when pruning descendants leaves a container empty. It SHALL preserve numbers, booleans, and nonempty strings, including strings containing only whitespace. A root JSON value SHALL remain a valid JSON value even when it is itself empty or removable in a child position.

#### Scenario: Descendant removal empties a parent
- **WHEN** input is `{"keep":0,"outer":{"inner":null},"items":["",{},false]}`
- **THEN** the pruned result is `{"keep":0,"items":[false]}`

#### Scenario: Empty root remains representable
- **WHEN** input is `{}`, `[]`, `null`, or `""`
- **THEN** the operation returns that valid root JSON value rather than no output

### Requirement: Named keys can be removed at every object depth
The system SHALL accept a comma-separated list of key names to drop, match each trimmed nonempty name exactly and case-sensitively, and remove matching members from every object, including objects in arrays. This option SHALL be disabled when no names are supplied.

#### Scenario: Same key appears at multiple depths
- **WHEN** the drop-key list is ` debug, trace ` and input is `{"debug":1,"nested":{"trace":2,"keep":3},"items":[{"debug":4,"keep":5}]}`
- **THEN** the result is `{"nested":{"keep":3},"items":[{"keep":5}]}`

### Requirement: Optional sampling shortens each surviving long array
Sampling SHALL be disabled unless selected. When enabled, N SHALL default to 3 and SHALL be a positive integer. After pruning, each surviving array with more than 2N entries SHALL retain its first N entries and final entry in order and omit the rest. Arrays with at most 2N entries SHALL remain intact. No omission marker SHALL be inserted into the data.

#### Scenario: Array crosses the sampling threshold
- **WHEN** sampling uses N=3 and a surviving array contains `[1,2,3,4,5,6,7]`
- **THEN** the array becomes `[1,2,3,7]` and its sampled omission count is 3

#### Scenario: Pruning changes whether sampling applies
- **WHEN** sampling uses N=3 and input is `[1,null,2,{},3,4,5,6]`
- **THEN** the result is `[1,2,3,4,5,6]` with no sampled omissions

#### Scenario: Invalid sample size
- **WHEN** a user selects N=0 or a non-integer sample size
- **THEN** the operation rejects the option with a useful validation error

### Requirement: Statistics identify loss without changing the JSON data
The operation SHALL make counts of pruned nulls, empty strings, empty objects, empty arrays, and explicitly dropped keys available separately from the transformed JSON. It SHALL count an explicitly dropped member as one dropped key without counting values inside its discarded subtree. Sampling statistics SHALL include a total omitted count and an entry for each sampled array that remains in the result, with its path in the final data and its omitted count. A path SHALL identify an object member or array index using slash-separated segments; the root path SHALL be the empty string, with `~` and `/` in member names escaped as `~0` and `~1`.

#### Scenario: Nested sampled arrays are locatable
- **WHEN** `orders[0].items` and `orders[1].items` each omit three entries
- **THEN** sampling statistics contain paths `/orders/0/items` and `/orders/1/items`, each with count 3, and a total of 6

#### Scenario: Parent sampling removes a branch
- **WHEN** sampling an outer array omits an entry containing an inner array
- **THEN** statistics report the outer array's omission and do not contain a path into the removed entry

#### Scenario: Explicitly dropped subtree
- **WHEN** a matching key contains an object with null and empty-string members
- **THEN** the statistics count one dropped key and do not count its unseen descendants as pruned values

### Requirement: All interfaces use the same local transformation
The CLI SHALL expose `strapd json prune` with positional input or stdin and a useful error for invalid JSON. The WebApp SHALL expose a visible pruning tool with equivalent controls and raw JSON output. Pipes SHALL expose the same operation as a composable transform step and SHALL pass only raw JSON to the next step. Processing SHALL remain local.

#### Scenario: CLI and WebApp use equivalent options
- **WHEN** the same JSON input, dropped keys, and sampling options are used in the CLI and WebApp
- **THEN** their transformed JSON values and operation statistics are equivalent

#### Scenario: Pipe follows a pruning step
- **WHEN** a pipe runs a pruning step before another JSON-consuming step
- **THEN** the next step receives the pruned JSON value without a response wrapper or omission marker

#### Scenario: Invalid JSON input
- **WHEN** the CLI, WebApp, or Pipe receives malformed JSON
- **THEN** the operation fails with a useful invalid-JSON error and does not present a successful transformed result
