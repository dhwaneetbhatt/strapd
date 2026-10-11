## 1. Responsive Interaction Hardening

- [x] 1.1 Reflow the rename controls and narrow dialog action rows for long content, 320–375px widths, and increased text size.
- [x] 1.2 Apply a 44×44px mobile touch-target floor to primary and repeated Pipes actions while preserving desktop density.
- [x] 1.3 Replace the fixed expanded data pane with an accessible modal overlay that locks background scroll, contains focus, closes on Escape, and restores focus.
- [x] 1.4 Add a compact collapsible mobile saved-pipes presentation that leaves usable runner space on short viewports.
- [x] 1.5 Add a mobile tool-search action that opens the existing command palette.
- [x] 1.6 Prevent the mobile sidebar opener/closer from overlaying expanded navigation content.

## 2. Focused Component Coverage

- [x] 2.1 Update Pipes component tests for the responsive rename/dialog behavior, modal semantics and focus restoration, touch-target props, and mobile rail disclosure.
- [x] 2.2 Run focused Pipes unit/component tests and resolve regressions.

## 3. Real-Browser Responsive Coverage

- [x] 3.1 Add Playwright Chromium configuration, scripts, and deterministic pipe fixtures for local browser tests.
- [x] 3.2 Add viewport tests for run, create, edit, rename, import-conflict, and delete-confirmation flows at 320px, 375px, 768px, and mobile landscape sizes.
- [x] 3.3 Assert page overflow, 44px targets, expanded-pane focus/scroll behavior, long names, increased text size, reduced motion, light/dark themes, mobile search, and expanded-sidebar geometry in the real browser.
- [x] 3.4 Manually exercise several created pipes in the browser and record any implementation corrections discovered.

## 4. Verification and Delivery

- [x] 4.1 Run the deterministic UI scan, strict OpenSpec validation, webapp formatting/linting/build/tests, browser suite, and repository-wide tests; resolve all failures.
- [x] 4.2 Sync the completed delta spec, archive the OpenSpec change, commit the final branch, push it, and open a pull request linked to GitHub issue #24.
