## Context

See `proposal.md` for motivation and `specs/webapp-pipes/spec.md` for observable behavior. The webapp already centralizes executable `Tool.operation(inputs)` functions in a registry, but configuration controls and defaults currently live inside individual React tool components. `ToolOption` exists as a type but is not populated by current definitions. Results share `ToolResult`, although some tools expose multiple named outputs and not every tool currently sets `result`.

The design must preserve standalone tools, remain offline, avoid serializing executable behavior, and allow future tools to become pipe-compatible without adding bespoke builder or runner branches.

## Goals / Non-Goals

**Goals:**

- Make pipe compatibility an explicit, versioned extension of the central tool definition.
- Keep saved and exported data portable, validated, immutable during execution, and migratable.
- Give pipe creation, editing, execution, and persistence clear module boundaries with testable pure logic.
- Preserve stable identity across ordinary lifecycle operations and make conflicts explicit.

**Non-Goals:**

- Reusing complete standalone tool components inside the builder.
- Persisting functions, JSX, derived runtime state, intermediate results, or user-entered runner input.
- Adding Rust core or WASM orchestration APIs; the webapp composes existing operations.
- Supporting branches, conditions, loops, concurrency, remote storage, collaboration, or CLI pipe-file execution.

## Decisions

### 1. Extend tool definitions with an optional pipe contract

Add an optional pipe descriptor to the registry definition. A descriptor includes a contract version, source-or-transform input behavior, a canonical output key, declarative configuration fields, validation constraints and defaults, and runtime migration hooks held only in code. The framework compiles declared field and cross-field constraints into the runtime configuration validator; individual tool IDs are never hardcoded in the builder or validation engine.

Conceptually:

```ts
interface PipeToolContract {
  version: number;
  input: { kind: "source" } | { kind: "transform"; key: string };
  output: { key: string };
  config: ToolOption[];
  constraints: PipeConfigConstraint[];
  defaults: Record<string, unknown>;
  validateConfig(config: unknown): PipeConfigValidation;
  migrateConfig?(fromVersion: number, config: unknown): PipeConfigMigration;
}
```

The builder enumerates registry entries with this descriptor and renders the existing declarative option types. Field metadata declares reusable rules such as integer and string-length requirements, while contract metadata declares relationships such as numeric ordering, compatible option groups, and minimum enabled selections. The executor resolves the same descriptor to bind runtime input and select output. The serialized step stores only `toolId`, `toolVersion`, and configuration data.

Alternative considered: infer controls and defaults from each React component. Rejected because component state is not a stable schema and would couple persistence and execution to rendering details.

Alternative considered: maintain a separate pipe-tool registry. Rejected because duplicate registration would drift from the established source of truth.

### 2. Separate runtime input from frozen step configuration

The builder never stores the contract's runtime input key inside step configuration. At execution time a transform receives a fresh input object formed from the frozen configuration plus the upstream value at the declared input key. A source receives only its frozen configuration and is valid only at index zero. Configuration objects are cloned and treated as immutable.

This supports existing non-`text` inputs such as calculator `value` or datetime `timestamp` without executor knowledge of individual tools. Source-first pipes communicate that runner input is not required.

Alternative considered: standardize every operation on `text`. Rejected because it would force unrelated changes to existing operations and lose type-specific vocabulary.

### 3. Require one canonical string output per compatible tool contract

Each pipe contract declares the result property whose successful value becomes downstream input. Most tools use `result`; a multi-output tool can expose one deliberate canonical output or later add configuration that selects among declared outputs. A tool is not pipe-compatible until it can guarantee the declared value is a string on success.

The executor does not guess among result properties and does not stringify arbitrary objects. This keeps pipe behavior stable when standalone UI grows additional outputs.

Alternative considered: pass the entire `ToolResult` to the next step. Rejected because that creates implicit object-mapping semantics and turns the feature into a generic workflow engine.

### 4. Use a versioned document model with two compatibility layers

Use browser-generated UUIDs for pipe and step identities. Store a collection envelope in local storage and export one pipe per document:

```ts
interface PipeDocumentV1 {
  schemaVersion: 1;
  pipe: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    steps: Array<{
      id: string;
      toolId: string;
      toolVersion: number;
      config: Record<string, JsonValue>;
    }>;
  };
}
```

The local collection has its own `schemaVersion` and array of the same pipe records. Document migrations handle envelope/model evolution; each registry contract handles its own configuration revisions. Loading local data and importing files follow the same parse, structural validation, migration, and semantic validation pipeline.

Migrations are ordered, pure functions and never mutate the source document. Unknown future schema versions are rejected. Unavailable tools and unsupported tool versions remain represented as diagnosable steps rather than being dropped.

Alternative considered: version only the outer schema. Rejected because a tool can change configuration independently of the pipe document.

### 5. Put execution in a UI-independent engine

Implement an asynchronous executor that accepts a validated pipe, optional initial string, and registry lookup. It awaits each operation sequentially and returns either a final output or a structured failure containing step ID, position, tool ID, and message. It stops on the first unsuccessful result, thrown exception, missing tool, incompatible contract, or missing/non-string canonical output.

The runner owns debounce/manual-run behavior and presentation, not sequencing. It clears any stale success result when a new run fails. Intermediate values are kept in memory only and are neither displayed as final success nor persisted.

Alternative considered: chain operations in React effects. Rejected because lifecycle timing would obscure ordering, cancellation, error attribution, and unit testing.

### 6. Use a repository service with atomic editor semantics

A pipe repository module owns the storage key, collection parsing/migration, CRUD operations, duplication, and import conflict resolution. React consumes it through a focused state hook/context rather than accessing `localStorage` throughout components.

The editor always works on a deep working copy. Save validates the complete candidate before one collection write; cancel discards the copy. Rename and edits retain pipe identity, and existing step identities survive reorder or configuration changes. Adding a step generates a UUID; removing it does not renumber others. Duplication and “import as copy” regenerate the pipe and all step IDs.

Local-storage parse and write failures return typed errors. A failed write leaves the last successfully stored collection authoritative.

### 7. Add a dedicated pipe workspace

Add a `/pipes` route and an entry in the application navigation. The workspace has three clear states:

- Saved-pipe list with create/import actions and rename, duplicate, export, and delete affordances.
- Builder/editor showing an ordered linear step list, configuration panel, validation, reorder/remove actions, and explicit save/cancel.
- Runner showing the frozen sequence summary, input when the first step consumes input, final output, copy/reset actions, and step-attributed errors.

The builder's add-tool control reuses the home-page fuzzy-search engine and searchable registry metadata rather than maintaining a pipe-only filter. It limits results to tools with pipe contracts, supports keyboard result navigation and selection, and communicates result and empty states accessibly. This keeps discovery consistent while allowing the pipe framework to include newly compatible tools automatically.

While creating or editing, the sequence summary renders from the editor's working copy, not the last persisted definition. Structural and configuration changes therefore appear immediately without weakening atomic save/cancel behavior: execution and persistence continue to use the saved definition until validation and explicit save complete.

Interaction feedback uses short opacity/transform transitions for opening search, adding or reordering steps, and changing editor state. Motion communicates continuity rather than decoration, respects `prefers-reduced-motion`, preserves focus, and does not delay input or saving.

Pipe input and final output are developer data rather than interface copy. Their editable, read-only, expanded, syntax-highlighted, and large-output fallback presentations use the existing theme `mono` font role so data texture remains consistent with standalone tools.

On wide layouts the list and active workspace can coexist; on narrow layouts they become a navigable stack. Reordering must have keyboard-accessible controls in addition to any pointer interaction. The empty state teaches “output of one tool becomes input to the next” and offers create/import actions.

Alternative considered: model each pipe as a synthetic tool in the existing sidebar. Rejected because management, editing, conflicts, and import/export need a dedicated collection-level surface.

Alternative considered: keep a native select containing every compatible tool. Rejected because it scales poorly, hides searchable metadata, and diverges from the established home-page discovery model.

### 8. Validate imports before resolving identity conflicts

Import proceeds through file-size/type checks, JSON parsing, document migration, structural validation, tool/config validation, then UUID conflict detection. Invalid input cannot mutate local storage.

If the pipe UUID is new, preserve all identities. If it conflicts, require an explicit replace-or-copy decision. Replace preserves the shared pipe ID and imported step IDs; copy regenerates all identities. A valid pipe containing unavailable tools can be stored but is marked non-runnable until compatibility is restored.

## Risks / Trade-offs

- [Configuration metadata can drift from standalone component defaults] → Make the pipe contract the canonical source for pipe defaults, add contract tests for every compatible tool, and progressively let standalone components consume shared defaults where practical.
- [A tool changes semantics without incrementing its contract version] → Document version bumps as part of tool registration and test older configuration fixtures.
- [Local storage is corrupted or full] → Parse defensively, preserve the last valid in-memory/saved collection, and show actionable load/write errors without silent data loss.
- [Long pipes can trigger excessive automatic work] → Keep execution sequential, expose processing state, prevent overlapping stale results, and prefer explicit execution for the pipe runner unless later usability testing justifies debouncing.
- [Unavailable tools make imported pipes unusable] → Preserve and visibly diagnose steps so users can edit, replace, or wait for compatibility rather than losing definitions.
- [Browser UUID or download APIs vary] → Use supported web APIs behind small adapters that can be mocked and provide a UUID fallback only if the supported browser matrix requires it.

## Migration Plan

1. Introduce the storage key and version-1 empty collection loader without changing existing tool behavior.
2. Add pipe contracts and contract tests to eligible current tools.
3. Ship the builder, repository, executor, import/export, route, and navigation together so no incomplete saved format is exposed.
4. Future document or tool revisions add forward migrations and retained fixtures before their version number is increased.

Rollback removes the route and feature modules but leaves the namespaced local-storage data untouched so a later compatible release can recover saved pipes. No server or Rust data migration is required.
