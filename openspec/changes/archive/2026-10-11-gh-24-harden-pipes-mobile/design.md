## Context

See `proposal.md` for motivation and `specs/webapp-pipes/spec.md` for observable behavior. The Pipes workspace already stacks the runner below the `lg` breakpoint and uses Chakra UI for responsive props and accessible dialogs, but several controls retain desktop sizing and the expanded data pane bypasses Chakra's modal boundary. Existing Vitest tests run in JSDOM, which cannot validate geometry, viewport overflow, scroll locking, or actual focus containment.

The change must preserve the Dependable Codebench visual language, offline behavior, current pipe data model, keyboard-first operation, and light/dark theme tokens.

## Goals / Non-Goals

**Goals:**

- Make every critical Pipes workflow resilient at 320px, 375px, 768px, and mobile landscape dimensions.
- Centralize the expanded input/output experience on Chakra's accessible overlay primitives.
- Establish reproducible browser tests that seed local pipe data without network or backend dependencies.
- Preserve the current desktop information architecture and compact editor aesthetic.
- Keep tool search reachable on mobile and ensure sidebar controls never overlap navigation content.

**Non-Goals:**

- Redesigning Pipes, changing pipe execution/persistence semantics, or adding server-side state.
- Replacing Chakra UI or the existing Vitest component suite.
- Expanding browser coverage to unrelated webapp routes in this change.

## Decisions

### 1. Render expanded data panes inside a Chakra modal

Use `Modal`, `ModalOverlay`, `ModalContent`, and `ModalBody` for the expanded pane while keeping the same controlled input/output state and data-pane chrome. Chakra supplies the required portal boundary, backdrop, focus lock, Escape behavior, body-scroll lock, and trigger-focus restoration. The expanded content will use dynamic viewport height and mobile-safe insets.

Alternative considered: extend the current fixed-position pane with custom focus and scroll hooks. Rejected because it would recreate mature modal behavior across focus trapping, nested portals, cleanup, and restoration.

### 2. Use responsive layout changes rather than page-level overflow masking

Rename controls and dialog footers will stack or wrap at the base breakpoint, long labels will receive `minW={0}` and safe wrapping, and action groups will use full-width mobile buttons where useful. The page will not hide horizontal overflow globally because that would conceal regressions and make horizontally scrollable local regions harder to diagnose.

Alternative considered: set `overflow-x: hidden` on the route. Rejected because it masks clipped content instead of making each layout fit.

### 3. Treat 44px as the mobile interaction floor

Primary toolbar buttons and repeated icon actions will receive responsive minimum dimensions of 44px at the base breakpoint while retaining compact desktop sizing where density matters. Disabled controls retain the same geometry to prevent layout shift.

Alternative considered: enlarge only controls named in the issue. Rejected because adjacent repeated actions would remain inconsistent and still fail touch ergonomics.

### 4. Collapse saved-pipe discovery behind a mobile disclosure

On narrow screens, show a compact summary/control row and reveal the create, import, and saved-pipe list on demand in a height-bounded scroll region. Collapse the disclosure after a pipe is selected so the runner regains viewport space. Keep the persistent 260px rail on desktop.

Alternative considered: replace the list with horizontally scrolling chips. Rejected because long names, action buttons, and many saved pipes would become harder to scan and operate by keyboard.

### 5. Add Playwright as a separate browser verification layer

Keep Vitest for component and state-level tests and add Playwright for geometry and interaction assertions. Browser tests will seed the versioned `strapd-pipes` local-storage collection before loading `/pipes`, create additional pipes through the UI where the flow itself is under test, and run against Chromium at 320×568, 375×667, 768×1024, and 844×390 as applicable.

Critical assertions will compare document scroll width to viewport width, inspect bounding boxes for touch targets and viewport containment, verify body scroll locking and focus restoration for expanded panes, exercise dialogs and rename with long content, and cover dark mode and reduced motion. A dedicated script will keep browser coverage opt-in for development while joining the repository's aggregate test command.

Alternative considered: infer responsiveness from Chakra props in JSDOM. Rejected because JSDOM has no layout engine and cannot prove overflow or geometry.

### 6. Use explicit mobile shell controls

Expose tool search as a labeled icon action in the mobile header that opens the existing command palette. When the mobile tools sidebar is open, hide the page-level opener and expose a close control inside the sidebar with sufficient top padding so it cannot overlap the first navigation label.

Alternative considered: render the full desktop search input in the narrow header. Rejected because it competes with navigation actions and cannot fit reliably at 320px.

## Risks / Trade-offs

- [Modalizing a pane can remount its textarea or syntax highlighter] → Keep values controlled, focus the corresponding pane content, and cover input preservation and restoration in component and browser tests.
- [Larger touch targets reduce editor density] → Apply the 44px floor at mobile breakpoints and retain compact dimensions at desktop breakpoints.
- [A collapsible rail can hide discovery] → Keep the selected pipe and an explicit saved-pipes toggle visible in the collapsed summary.
- [Browser tests increase install and CI time] → Run one Chromium project, reuse deterministic local fixtures, and limit tests to critical responsive flows.
- [Viewport-height behavior differs on mobile browsers] → Use dynamic viewport units with safe fallbacks and assert both portrait and landscape layouts.
- [Another header action can crowd 320px layouts] → Use an icon-only mobile search affordance with an accessible label and cover the shared shell in the overflow smoke test.

## Migration Plan

1. Add the browser-test dependency, configuration, and scripts without changing runtime data.
2. Land responsive control, rail, dialog, and modal behavior with focused component updates.
3. Run existing unit/component coverage and the new browser matrix before release.

Rollback removes the UI refinements and browser-test configuration. No stored pipe data or schema migration is involved.
