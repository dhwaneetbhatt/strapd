---
version: 1
slug: "webapp-src-pages-pipes-tsx"
primary_target: "webapp/src/pages/pipes.tsx"
related_targets: []
---

Scope: `/pipes` webapp route. Visitor mode: Operate.

Audience and job: Developers reopening repeatable local transformations need to select a saved pipe, paste input when required, and get the final output immediately; creating or editing a pipe is a deliberate secondary mode.

Direction: Runner-first workspace within the established Dependable Codebench world. A saved-pipes rail leads to a dominant input/output workbench, with a compact frozen-step ribbon proving the linear sequence and a focused right inspector appearing for configuration edits.

Memorable moment: One clear Run action bridges source and result while the ordered step ribbon below makes the Unix-pipe mental model visible without becoming a node graph.

Constraints: Use existing semantic theme tokens, Inter UI text, monospace data fields, one blue interaction signal, responsive stacking on narrow screens, keyboard-accessible reorder and actions, explicit failures, no branches or decorative imagery.

Approved comp: `.impeccable/mocks/gh-21-pipes-runner-first.png`.

Implementation inventory: Header/navigation, saved-pipe list, toolbar, input/output panes, central Run control, status feedback, frozen-step ribbon, step configuration inspector, empty/loading/error states, import conflict prompt, and mobile stacked adaptations are semantic React/Chakra UI; existing react-icons supply icons; no raster imagery ships in the product UI.
