## Why

The Pipes "Expand input pane" dialog violates existing `webapp-pipes` requirements on short mobile viewports, which made `webapp/e2e/mobile.spec.ts` fail intermittently (found while verifying gh-46). At 375×667, Chakra's `size="full"` applies `min-height: 100%` to `ModalContent`, overriding its `calc(100dvh - 2rem)` maximum; with the 8px margin the dialog ends at y=675 and clips its footer. Its scale and fade transitions also run when the user prefers reduced motion. Early transition frames fit the viewport, which is why the test passed sometimes.

## What Changes

- The expanded runtime pane dialog fits within the viewport at every supported mobile size: the min-height override is removed so the declared height and max-height apply.
- Pipes modals honour reduced motion: no scale/slide transition when reduced motion is requested.
- Diagnose and fix the intermittent delete-confirmation dialog assertion timeouts seen under the mobile e2e stress run (2 of 80 runs), at the root cause.
- The mobile e2e spec stays strict; any test change only waits for a stable, product-defined state.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
<!-- None: restores compliance with existing `webapp-pipes` scenarios "Use critical flows at supported mobile widths" (no content beyond the viewport, no clipped controls) and "User prefers reduced motion". `skip_specs: true`. -->

## Impact

- `webapp/src/components/pipes/` (runner expand dialog, other Pipes modals for reduced motion, delete dialog if implicated).
- `webapp/e2e/mobile.spec.ts` and Pipes component tests.
