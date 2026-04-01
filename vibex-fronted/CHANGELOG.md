# Changelog
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

### E1: RelationshipConnector 注释移除 (canvas-bc-card-line-removal)
- **E1** — RelationshipConnector 注释: import + JSX，BoundedContextTree.tsx
- **E1** — Vitest: tests/canvas/bc-card-line-removal.spec.ts 3/3 通过
- **E1** — gstack 验证: canvas 无 RelationshipConnector SVG 连线 ✅
- Commit: `5150964e`

### E1: E2E Stability (proposals-20260401-8)
- **E1-F1.1** — waitForTimeout replacement: e2e/*.spec.ts 全部替换为 waitForLoadState/waitForFunction
- **E1-F1.2** — force:true for canvas buttons: canvas-phase2.spec.ts expand/maximize/exit buttons
- **E1-F1.3** — playwright.config.ts expect.timeout: 10000 → 30000ms
- **E1-F1.4** — stability.spec.ts: 验收测试覆盖所有3个F1标准
- Commit: `feae8a08`

### E3: Undo/Redo History Stack (proposals-20260401-3)
- **E3-T1** — canvasHistoryStore bridge: stores/canvasHistoryStore.ts，暴露 historySlice 到全局 store
- **E3-T2** — Keyboard shortcuts: useKeyboardShortcuts.ts (Ctrl+Z/Y) 已实现
- **E3-T3** — UndoBar: undo-bar/UndoBar.tsx，floating toolbar 显示撤销历史
- **E3-T4** — E2E tests: tests/e2e/undo-redo.spec.ts
- Commit: `de776230`

### E2: Heartbeat Scanner + Changelog Gen (proposals-20260401-3)
- **E2-T1** — Ghost task detection: 60min 无进展任务识别
- **E2-T2** — Fake done detection: 缺少 output 的 done 任务检测
- **E2-T3** — changelog-gen CLI: scripts/changelog-gen.ts，自动生成 CHANGELOG
- **E2-T4** — commit-msg hook: .githooks/commit-msg conventional commit 验证
- Commit: `bbb361aa`

### E1: Proposal Dedup + ErrorBoundary (proposals-20260401-3)
- **E1-T1** — NotificationDedup: scripts/notification-dedup.ts，30min TTL hash 去重
