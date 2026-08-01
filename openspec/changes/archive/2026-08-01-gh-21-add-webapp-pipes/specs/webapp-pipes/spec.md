## Purpose

Provide an extensible, offline webapp framework for composing compatible strapd tools into reusable, portable, strictly sequential pipes.

## ADDED Requirements

### Requirement: Tools declare pipe compatibility
The system SHALL expose a tool in the pipe builder only when its registry definition declares a versioned pipe contract containing its runtime input behavior, configurable fields and defaults, and canonical string output.

#### Scenario: Newly registered compatible tool appears automatically
- **WHEN** a tool is added to the central registry with a valid pipe contract
- **THEN** the pipe builder lists the tool without requiring tool-specific builder code

#### Scenario: Tool without a pipe contract is excluded
- **WHEN** a registered standalone tool has no valid pipe contract
- **THEN** the pipe builder does not offer that tool as a pipe step

### Requirement: Users can build valid sequential pipes
The system SHALL let users name a pipe and arrange one or more compatible tools in a single ordered sequence, and SHALL reject an invalid step order before saving.

#### Scenario: Search compatible tools while adding a step
- **WHEN** a user enters a partial, misspelled, aliased, or category-related query in the add-tool control
- **THEN** the system fuzzy-matches the same searchable tool metadata and ranking behavior used by home-page tool discovery and presents only compatible tools

#### Scenario: Build an input-driven pipe
- **WHEN** a user names a pipe and adds compatible input-consuming tools in sequence
- **THEN** the system allows the pipe to be saved with those steps in the selected order

#### Scenario: Build a generator-led pipe
- **WHEN** a user places a source tool that does not consume runtime input as the first step and follows it with compatible input-consuming tools
- **THEN** the system allows the pipe to be saved and identifies that the pipe does not require user input

#### Scenario: Source tool is placed after the first step
- **WHEN** a user places a tool that does not consume upstream input anywhere except the first position
- **THEN** the system prevents saving and explains which step has an invalid position

### Requirement: Step configuration is captured and frozen
The system SHALL render each step's declared configuration controls during creation or editing, SHALL save the selected values with the step, and SHALL use those frozen values for every execution until the pipe is edited and saved again.

#### Scenario: Execute with saved configuration
- **WHEN** a user runs a pipe containing a Base64 step saved in decode mode
- **THEN** the step executes in decode mode without requesting or inheriting a different mode at runtime

#### Scenario: Change frozen configuration
- **WHEN** a user wants to change a saved step's configuration
- **THEN** the user must edit and save the pipe before subsequent runs use the new value

#### Scenario: Runtime input is separate from configuration
- **WHEN** a pipe executes an input-consuming step
- **THEN** the upstream runtime value is assigned only to the contract's runtime input field and the remaining saved configuration is unchanged

### Requirement: Saved pipes have stable identities
The system SHALL assign UUIDs to new pipes and steps, SHALL retain those identities across renames, edits, reordering, execution, export, and ordinary import, and SHALL assign fresh pipe and step UUIDs when duplicating a pipe or importing it as a copy.

#### Scenario: Rename and edit a pipe
- **WHEN** a user renames, reconfigures, or reorders an existing pipe and saves it
- **THEN** the pipe UUID remains unchanged and unaffected step UUIDs remain unchanged

#### Scenario: Duplicate a pipe
- **WHEN** a user duplicates an existing pipe
- **THEN** the duplicate receives a new pipe UUID and new UUIDs for all of its steps

### Requirement: Users can manage locally saved pipes
The system SHALL persist saved pipes in browser local storage and provide controls to open, rename, edit, duplicate, and delete them without requiring an account, server, network access, or telemetry.

#### Scenario: Reload the webapp
- **WHEN** a user reloads the webapp after saving or editing a pipe
- **THEN** the latest successfully saved pipe definitions remain available

#### Scenario: Local storage write fails
- **WHEN** a create or edit operation cannot be written to local storage
- **THEN** the system reports that the changes were not saved and does not present the failed state as persisted

#### Scenario: Delete a pipe
- **WHEN** a user confirms deletion of a saved pipe
- **THEN** the pipe is removed from local storage and no longer appears in the saved pipe list

### Requirement: Pipes execute steps in order
The system SHALL execute saved steps one at a time in their stored order, passing each successful canonical string output to the next input-consuming step and exposing only the final successful output as the pipe result.

#### Scenario: Successful execution
- **WHEN** a user supplies input to an input-driven pipe and every step succeeds
- **THEN** each step receives the preceding value in order and the runner displays the last step's canonical output

#### Scenario: Generator-led execution
- **WHEN** a user runs a valid generator-led pipe
- **THEN** the first step generates the initial value without user input and the remaining steps consume outputs sequentially

#### Scenario: A step fails
- **WHEN** a step returns an error, throws, produces no declared canonical string output, or is incompatible with its saved contract version
- **THEN** execution stops immediately, no later step runs, and the runner identifies the failed step and its error without presenting a final success output

### Requirement: Existing pipes can be edited safely
The system SHALL edit a working copy of a saved pipe and SHALL replace the stored definition only after the edited pipe passes validation and is explicitly saved.

#### Scenario: Preview an unsaved structural edit
- **WHEN** a user adds, removes, reorders, or reconfigures a step while editing a pipe
- **THEN** the visible sequence preview updates immediately from the working copy while the persisted pipe remains unchanged until save

#### Scenario: Cancel editing
- **WHEN** a user changes a pipe and then cancels editing
- **THEN** the previously saved pipe remains unchanged

#### Scenario: Save an invalid edit
- **WHEN** an edited pipe has an empty name, no steps, invalid configuration, an invalid source position, or an unavailable required contract
- **THEN** the system prevents saving and identifies the validation problem

### Requirement: Pipes use a versioned portable JSON format
The system SHALL export a saved pipe as a downloadable JSON document containing a document schema version and all portable identity, ordering, tool-contract version, and frozen configuration data required to reconstruct it.

#### Scenario: Export a pipe
- **WHEN** a user exports a saved pipe
- **THEN** the browser downloads a versioned JSON document that can be imported by a compatible strapd webapp

#### Scenario: Import a supported document
- **WHEN** a user imports a valid current or migratable older pipe document
- **THEN** the system validates and migrates it before making the reconstructed pipe available locally

#### Scenario: Import an unsupported or malformed document
- **WHEN** an imported file is malformed, has an unsupported schema version, contains invalid configuration, or cannot be safely migrated
- **THEN** the system rejects the import without changing saved pipes and reports the reason

### Requirement: Import handles identity conflicts explicitly
The system SHALL preserve an imported pipe's UUID by default and SHALL require the user to choose whether to replace the local pipe or import a copy when that UUID already exists.

#### Scenario: Import a pipe with a new UUID
- **WHEN** a valid imported pipe UUID does not exist locally
- **THEN** the system stores the pipe with its exported pipe and step UUIDs

#### Scenario: Replace an existing UUID conflict
- **WHEN** the user chooses to replace a local pipe during an import identity conflict
- **THEN** the imported definition replaces the local definition while retaining the shared pipe UUID

#### Scenario: Import a conflicting pipe as a copy
- **WHEN** the user chooses to import a copy during an identity conflict
- **THEN** the imported pipe and all imported steps receive new UUIDs before being saved

### Requirement: Unavailable tools remain diagnosable
The system SHALL retain imported or previously saved steps that reference unavailable tools or unsupported tool-contract versions, SHALL visibly mark those steps as unavailable, and SHALL prevent editing from silently discarding them or execution from skipping them.

#### Scenario: Open a pipe containing an unavailable step
- **WHEN** a saved or imported pipe references a tool that is not present in the current registry
- **THEN** the pipe remains visible with the affected step marked unavailable and cannot execute until the incompatibility is resolved

### Requirement: Pipe interaction remains focused and accessible
The system SHALL provide a dedicated pipe workspace with saved-pipe discovery, builder/editor, and runner views that remain operable by keyboard, adapt to supported mobile and desktop layouts, and use brief purposeful feedback for state and sequence changes.

#### Scenario: Use the add-tool search without a pointer
- **WHEN** a keyboard user opens the add-tool control, searches, moves through results, and chooses a tool
- **THEN** focus, active-result semantics, result count, empty state, and selection remain understandable without scrolling the full registry or using a pointer

#### Scenario: User prefers reduced motion
- **WHEN** the operating system requests reduced motion
- **THEN** pipe interactions remain understandable while nonessential transitions are removed or reduced

#### Scenario: Inspect pipe runtime data
- **WHEN** a user enters pipe input or inspects final output in normal or expanded panes
- **THEN** the runtime data is rendered with the webapp's established monospace data typography

#### Scenario: Open and run a saved pipe
- **WHEN** a keyboard user navigates to the pipe workspace, selects a saved pipe, enters input when required, and runs it
- **THEN** focus order, labels, validation feedback, execution status, and output access support completing the workflow without pointer-only actions

#### Scenario: Empty pipe collection
- **WHEN** no pipes have been saved
- **THEN** the workspace explains what sequential pipes do and provides a direct action to create or import one

### Requirement: Pipe topology is strictly linear
The system SHALL support only a single ordered path from the initial value to one final output.

#### Scenario: User builds a pipe
- **WHEN** a user adds and reorders steps
- **THEN** the interface represents one linear sequence and offers no branches, joins, conditions, loops, or arbitrary node transitions
