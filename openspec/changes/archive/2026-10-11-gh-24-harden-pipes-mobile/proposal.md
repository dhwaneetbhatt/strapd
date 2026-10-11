## Why

The Pipes workspace has responsive breakpoints, but narrow and short mobile viewports still expose layout, touch-target, and expanded-pane accessibility risks that static scans and JSDOM tests cannot verify. A focused hardening pass is needed before mobile support can be treated as reliable.

## What Changes

- Reflow rename and dialog actions so they remain usable with long names, narrow widths, and increased text size.
- Make primary mobile actions and repeated icon controls provide at least 44×44px touch targets.
- Replace the fixed-position expanded data pane with an accessible overlay that provides a backdrop, scroll locking, Escape dismissal, focus containment, and focus restoration.
- Give the saved-pipe collection a compact mobile presentation that preserves runner space on short viewports.
- Add the missing mobile access to tool search and fix the existing expanded-sidebar control overlap.
- Add layout-capable browser tests for critical Pipes flows and supported mobile viewport sizes, including light/dark themes, keyboard use, reduced motion, and horizontal-overflow assertions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `webapp-pipes`: Strengthen the existing mobile and accessible interaction requirement with explicit viewport, touch-target, overlay, overflow, and browser-verification behavior.

## Impact

- Affects the Pipes page and its runner, saved-pipe rail, editor, inspector, ribbon, and dialog layouts, plus the shared mobile header/sidebar shell.
- Adds a browser-level webapp test dependency and configuration alongside the existing Vitest/JSDOM suite.
- Does not change Rust core logic, WASM bindings, pipe persistence formats, or public APIs.
