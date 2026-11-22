## 1. Expanded pane fits the viewport

- [ ] 1.1 Remove the `size="full"` min-height override on the expanded runtime pane `ModalContent` in `pipe-runner.tsx` (e.g. `minH={0}`) so its declared height/max-height apply
- [ ] 1.2 Verify the dialog bottom edge stays inside the viewport at 375×667, 320×568, 768×1024 and 844×390, light and dark

## 2. Reduced motion

- [ ] 2.1 Make every Pipes modal (expand pane, rename, delete, import conflict) use no scale/slide transition when `usePrefersReducedMotion` is true (Chakra `motionPreset="none"` or equivalent)
- [ ] 2.2 Component test asserting the reduced-motion preset is applied

## 3. Delete dialog timeouts

- [ ] 3.1 Reproduce the delete-dialog assertion timeouts under the mobile stress run and identify the root cause
- [ ] 3.2 Fix at the root cause (product or test-stability wait on a product-defined state); no timeout increases or sleeps

## 4. Verification

- [ ] 4.1 `make webapp-lint`, `make webapp-fmt-check`, `make webapp-test` pass
- [ ] 4.2 Full `make webapp-e2e` passes three consecutive times
- [ ] 4.3 `make webapp-e2e TEST_ARGS='e2e/mobile.spec.ts --repeat-each=20 --workers=5'` passes 80/80
- [ ] 4.4 `openspec validate gh-46-fix-pipes-mobile-dialog --strict`
