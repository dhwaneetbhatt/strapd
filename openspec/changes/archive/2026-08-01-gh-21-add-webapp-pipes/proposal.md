## Why

The CLI can compose strapd tools with Unix pipes, but the webapp requires users to manually copy output between tools. A first-class, offline pipe capability will bring repeatable sequential workflows to the browser while preserving strapd's focused, local utility-belt model.

## What Changes

- Add a framework-level pipe contract to the webapp tool registry so tools can declare their runtime input, frozen configuration, canonical output, compatibility version, and builder controls.
- Add a pipe builder for fuzzy-searching compatible tools in a linear sequence, previewing working-copy changes immediately, and fixing each step's configuration when the pipe is saved.
- Add local creation, viewing, execution, renaming, editing, reordering, duplication, and deletion of saved pipes, with stable UUIDs for pipes and steps.
- Execute saved steps sequentially, passing each canonical string output into the next step and reporting the first failing or incompatible step.
- Add versioned JSON export and validated import, including explicit handling for identity conflicts, schema migrations, tool-contract migrations, and unavailable tools.
- Keep pipes offline-only and sequential; branching, graphs, remote synchronization, and generic workflow automation are out of scope.

## Capabilities

### New Capabilities

- `webapp-pipes`: Defines the extensible pipe-tool contract and user behavior for building, persisting, editing, executing, importing, exporting, and migrating sequential webapp pipes.

### Modified Capabilities

None.

## Impact

- Affects the webapp tool types and registry, routing/navigation, local-storage configuration, and new pipe model, persistence, execution, migration, validation, and UI modules.
- Existing standalone tool behavior and Rust/WASM operations remain unchanged; pipeline participation is declared by webapp tool metadata.
- Adds browser-local persisted data and downloadable/uploadable JSON documents but no server, account, telemetry, or network dependency.
- Reuses the webapp's tool-search behavior and adds restrained, accessible interaction feedback to keep pipe creation and editing fast and legible.
- Requires unit and component coverage for contracts, execution order, frozen configuration, persistence, migrations, import conflicts, errors, and core pipe UI flows.
