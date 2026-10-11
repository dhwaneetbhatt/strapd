## MODIFIED Requirements

### Requirement: Pipe interaction remains focused and accessible
The system SHALL provide a dedicated pipe workspace with saved-pipe discovery, builder/editor, and runner views that remain operable by keyboard, adapt without page-level horizontal overflow to supported mobile and desktop layouts, expose touch-friendly controls, and use brief purposeful feedback for state and sequence changes.

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

#### Scenario: Use critical flows at supported mobile widths
- **WHEN** a user runs, creates, edits, renames, resolves an import conflict, or confirms deletion at 375px, 768px, or a mobile landscape viewport
- **THEN** the flow remains usable without page-level horizontal scrolling, clipped controls, or content extending beyond the viewport, including when pipe or tool names are long

#### Scenario: Rename a pipe on a narrow viewport
- **WHEN** a user opens rename controls at a supported mobile width or with increased text size
- **THEN** the name input and save and cancel actions reflow without clipping, overlap, or horizontal overflow

#### Scenario: Use primary and repeated mobile actions
- **WHEN** a user operates the Pipes workspace at a mobile viewport
- **THEN** primary actions and repeated icon actions such as edit, reorder, remove, copy, expand, and dismiss provide touch targets of at least 44 by 44 CSS pixels

#### Scenario: Expand a runtime pane
- **WHEN** a user expands an input or output pane
- **THEN** the pane opens in an accessible overlay with a backdrop, locked background scrolling, contained focus, Escape dismissal, and focus restoration to the invoking control

#### Scenario: Use a short mobile viewport
- **WHEN** a user opens the Pipes workspace on a short mobile viewport
- **THEN** saved-pipe discovery uses a compact or collapsible presentation that preserves sufficient visible space for the active runner

#### Scenario: Use a confirmation dialog on a narrow viewport
- **WHEN** a confirmation or import-conflict dialog is shown at 320px to 375px width or with increased text size
- **THEN** its content and action controls reflow within the viewport and remain fully operable

#### Scenario: Verify responsive behavior in a layout-capable browser
- **WHEN** responsive browser verification is explicitly triggered locally or through the manual pre-release workflow
- **THEN** it exercises critical Pipes flows at supported mobile viewports and checks horizontal overflow, overlay keyboard behavior, mobile action usability, light and dark themes, and reduced-motion behavior using a real layout engine
