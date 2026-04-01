# Changelog
### E3: Responsive Layout (proposals-20260401-9)
- **E3** — useResponsiveMode.ts: new hook (isMobile/isTablet/isDesktop/isTabMode/isOverlayDrawer)
- **E3** — canvas.module.css: @media breakpoints for tablet (768-1023px, 2 cols) + mobile (<768px, 1 col + tabs)
- **E3** — responsive-layout.spec.ts: Playwright tests (F3.1-F3.4 viewport-based)
- Commit: `81febd8c`

### E2: Message Drawer (proposals-20260401-9)
- **E2** — canvasEvents.ts: CanvasEventType and CanvasEvent interfaces
- **E2** — openRightDrawer() + submitCanvas() in canvasStore.ts
- **E2** — CommandInput: auto-open drawer on command execute; /submit logs event
- **E2** — message-drawer.spec.ts: Playwright E2E tests (F2.1-F2.4)
- Commit: `c20c50da`

### E1: Checkbox Confirm 语义修复 (proposals-20260401-9)
- **E1-F1.1** — canvasStore.ts: add confirmContextNode, confirmFlowNode, confirmStep actions
- **E1-F1.2** — BoundedContextTree.tsx: checkbox onChange calls confirmContextNode
- **E1-F1.3** — BusinessFlowTree.tsx: FlowCard checkbox + SortableStepRow confirm checkbox
- **E1-F1.4** — canvas.module.css: add .stepConfirmCheckbox styles
- **E1** — Vitest: tests/canvas/checkbox-confirm.test.ts (环境问题，JSON import)
- Commit: `69f75437`
