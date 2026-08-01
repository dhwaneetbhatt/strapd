## 1. Pipe Domain Foundation

- [x] 1.1 Add JSON-safe pipe document, pipe, step, compatibility, validation, execution-result, and import-conflict types with schema and tool-contract version constants.
- [x] 1.2 Add UUID, deep-copy, structural validation, and semantic pipe validation utilities covering names, step counts, source positions, unique identities, JSON-safe configuration, and registry compatibility.
- [x] 1.3 Add fixture-based unit tests for valid pipes, invalid topology/configuration, duplicate identities, unavailable tools, and unsupported document or tool versions.

## 2. Extensible Tool Contracts

- [x] 2.1 Extend the central tool definition with an optional versioned pipe contract and add registry selectors for compatible source and transform tools.
- [x] 2.2 Build a generic configuration-field renderer and validation path from declared `ToolOption` metadata, including accessible boolean, string, number, and select controls.
- [x] 2.3 Add pipe contracts, canonical outputs, defaults, and configuration validation to compatible string, encoding, data-format, security, calculator, and datetime tools without changing standalone behavior.
- [x] 2.4 Add source contracts to compatible identifier and random generators and enforce their first-step-only topology.
- [x] 2.5 Add contract tests proving compatible tools are discovered automatically, defaults validate, runtime input keys are excluded from frozen configuration, and declared outputs are strings on success.

## 3. Persistence, Migration, and Portability

- [x] 3.1 Add a namespaced pipe storage key and repository that loads, creates, updates, renames, duplicates, and deletes a versioned local collection with typed read/write failures.
- [x] 3.2 Implement atomic working-copy save/cancel behavior that preserves pipe and existing step UUIDs while regenerating every identity for duplication.
- [x] 3.3 Add ordered, pure document and tool-configuration migration pipelines shared by local loading and file import, including unsupported-version and unavailable-tool diagnostics.
- [x] 3.4 Implement single-pipe JSON serialization and browser download export with stable identity and frozen configuration.
- [x] 3.5 Implement bounded file import, parse/validate/migrate behavior, and replace-versus-copy conflict resolution without mutating storage before validation and user choice complete.
- [x] 3.6 Add repository and portability tests for reload persistence, write failure atomicity, corrupt storage, round-trip export/import, older-version migration, malformed files, UUID conflicts, and unavailable tools.

## 4. Sequential Execution Engine

- [x] 4.1 Implement a UI-independent asynchronous executor that resolves contracts, injects upstream input without mutating frozen configuration, awaits steps in order, and returns only the final canonical string output.
- [x] 4.2 Add structured first-failure handling for unsuccessful results, thrown errors, missing tools, incompatible versions, and missing or non-string canonical outputs.
- [x] 4.3 Add executor tests for input-driven and generator-led pipes, non-`text` runtime keys, mixed sync/async operations, frozen configuration, strict ordering, early termination, and stale-success clearing inputs.

## 5. Pipe Builder and Editor

- [x] 5.1 Build reusable pipe state management that exposes repository operations, selection, working-copy editing, validation, import conflicts, and errors without direct component-level local-storage access.
- [x] 5.2 Build the create/edit surface with pipe naming, registry-driven tool selection, a clearly linear ordered step list, add/remove/reorder controls, and the generic frozen-configuration editor.
- [x] 5.3 Add explicit save and cancel flows, validation summaries tied to affected fields/steps, unavailable-step preservation, and stable identity behavior across edits.
- [x] 5.4 Add builder/editor component tests for empty and populated states, source placement, configuration freezing, keyboard reordering, cancel, valid save, invalid save, and unavailable steps.
- [x] 5.5 Replace full-registry add-tool selection with a reusable home-consistent fuzzy search over pipe-compatible tools, including keyboard navigation, result/empty states, and focused tests.
- [x] 5.6 Render the editor sequence and configuration summary directly from the working copy so add/remove/reorder/config changes are visible before save, without changing saved execution semantics.

## 6. Pipe Workspace and Runner

- [x] 6.1 Add a `/pipes` route and discoverable application navigation entry while preserving existing home, tool, and CLI routes.
- [x] 6.2 Build the saved-pipe workspace with empty-state guidance plus create, import, open, rename, edit, duplicate, export, and confirmed-delete actions.
- [x] 6.3 Build the runner with a frozen sequence summary, conditional input field, explicit run/reset actions, processing feedback, step-attributed errors, final output, and copy support.
- [x] 6.4 Implement responsive desktop/mobile workspace layouts and verify logical focus order, visible focus, labels, live status/error announcements, and pointer-independent operation.
- [x] 6.5 Add route/workspace/runner component tests for list management, import conflicts, input-driven execution, generator-led execution, failures, successful output, and keyboard-only core flows.
- [x] 6.6 Polish pipe workspace state transitions and interaction feedback with restrained motion, stable focus, responsive behavior, and reduced-motion support.
- [x] 6.7 Apply the established monospace data typography to pipe input and output panes in every rendering state and add focused coverage.

## 7. Verification and Documentation

- [x] 7.1 Run targeted webapp tests, the complete webapp test suite, formatting checks, linting, and the production webapp build; resolve all failures.
- [x] 7.2 Manually verify create, edit, rename, reorder, duplicate, delete, reload, export, import-new, import-replace, import-copy, unavailable-tool, failure, desktop, mobile, light-theme, dark-theme, and keyboard flows.
- [x] 7.3 Update README and agent-facing documentation with the pipe capability, versioned export format, framework registration pattern, and verification commands.
- [x] 7.4 Run focused pipe UX tests plus the complete webapp format, lint, test, type/build, and strict OpenSpec validation checks for the refinement.
