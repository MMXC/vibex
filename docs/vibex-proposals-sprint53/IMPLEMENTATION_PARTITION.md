# VibeX Sprint 53 — IMPLEMENTATION PARTITION

**Sprint**: Sprint 53  
**日期**: 2026-06-02  
**Epic 数**: 5 (E1-E5)  
**参考文档**: PRD (`prd.md`) + Architecture (`architecture.md`)

---

## DoD 检查清单

### E1 — 协作实时 Presence UI

| # | DoD | 验收标准 |
|---|-----|---------|
| D1.1 | `PresenceIndicator.tsx` 组件渲染在线用户列表 | `screen.getByText('Alice')` 显示；多用户 `getAllByRole('img')` 长度正确 |
| D1.2 | `usePresence.ts` hook 处理 presence:join/leave/ping 消息 | hook 订阅后 WebSocket 消息分发到 `presenceStore` |
| D1.3 | `DDSCanvasPage.tsx` 集成 PresenceIndicator | 组件挂载于侧边栏区域 |
| D1.4 | 30s 无 ping 自动从列表移除 | `lastSeen` 超时后 `removeUser()` 调用 |
| D1.5 | vitest `presenceIndicator.test.tsx` 覆盖 0/单/多用户场景 | 0用户显示空状态；单用户显示 name；多用户显示多个 avatar |

**新增文件**：`src/components/dds/presence/PresenceIndicator.tsx`、`src/hooks/canvas/usePresence.ts`  
**测试**：`npx vitest run presenceIndicator.test.tsx --reporter=verbose`

---

### E2 — 协作 Undo/Redo 冲突处理

| # | DoD | 验收标准 |
|---|-----|---------|
| D2.1 | `wsCommentHandler.ts` 新增 `revision:bump` case（使用 `.then()` 动态导入） | switch-case 中 `case 'revision:bump':` 分支存在，`import().then()` 方式导入 store |
| D2.2 | `wsCommentHandler.ts` 新增 `revision:conflict` case — 触发 ConflictDialog | case 分支调用 `useConflictStore.getState().triggerConflict(...)` |
| D2.3 | ConflictDialog 三个选项均可正常执行 | Discard Local / Merge / Discard Remote 三个 `onClick` handler 均实现 |
| D2.4 | vitest `wsRevisionHandler.test.ts` 覆盖 bump + conflict cases | `expect(handleRevisionBump).toHaveBeenCalledWith(5)`；`expect(triggerConflict).toHaveBeenCalled()` |
| D2.5 | 双客户端冲突场景手动验证（reviewer 阶段） | Reviewer 手动测试两个浏览器 tab 同时编辑同一画布 |

**新增文件**：`src/components/dds/conflict/ConflictDialog.tsx`  
**修改文件**：`src/services/collaboration/wsCommentHandler.ts`、`src/services/collaboration/wsRevisionHandler.ts`  
**测试**：`npx vitest run wsRevisionHandler.test.ts --reporter=verbose`

---

### E3 — @提及通知面板

| # | DoD | 验收标准 |
|---|-----|---------|
| D3.1 | `NotificationBell.tsx` 铃铛图标 + `unreadCount` 红点 | `screen.getByRole('button', { name: /notification/i })` 存在；红点在 `unreadCount > 0` 时显示 |
| D3.2 | `NotificationPanel.tsx` Dropdown 显示 mentions 列表（按时间倒序） | panel 展开后显示 mention 内容预览 + mentioned by + timestamp |
| D3.3 | 点击铃铛展开面板，点击外部关闭 | `userEvent.click(bell)` 展开；`userEvent.click(outside)` 关闭 |
| D3.4 | `mentionsStore.markAsRead(mentionId)` action 实现 | `unreadCount` 递减；`mentions[].isRead === true` |
| D3.5 | vitest `mentionsStore.test.ts` 新增 markAsRead cases | 2 个新 case：递减断言 + isRead 断言 |

**新增文件**：`src/components/dds/notifications/NotificationBell.tsx`、`src/components/dds/notifications/NotificationPanel.tsx`  
**修改文件**：`src/stores/dds/mentionsStore.ts`（新增 `markAsRead` action）  
**测试**：`npx vitest run mentionsStore.test.ts --reporter=verbose`

---

### E4 — 键盘快捷键设置面板 DDSToolbar 集成

| # | DoD | 验收标准 |
|---|-----|---------|
| D4.1 | DDSToolbar.tsx 添加 KeyboardIcon 按钮（aria-label="键盘快捷键设置"） | `screen.getByRole('button', { name: /键盘快捷键设置/i })` 存在 |
| D4.2 | DDSToolbar.tsx 添加 `isShortcutSettingsOpen` state + ShortcutSettingsPanel 挂载 | state 存在；panel 在 `isOpen=true` 时渲染 |
| D4.3 | `ShortcutSettingsPanel isOpen / onClose` props 正常工作 | open 时显示 panel；`onClose()` 调用后 panel 关闭 |
| D4.4 | 冲突快捷键在 ShortcutKeyInput 中显示 warning | 冲突项旁有 warning icon 或红色边框 |
| D4.5 | vitest `ShortcutSettingsPanel.test.tsx` 覆盖 open/close/rebind cases | 3 个新/更新 case |

**修改文件**：`src/components/dds/toolbar/DDSToolbar.tsx`  
**测试**：`npx vitest run ShortcutSettingsPanel.test.tsx --reporter=verbose`

---

### E5 — 批量导出 SVG 格式 UI

| # | DoD | 验收标准 |
|---|-----|---------|
| D5.1 | `BatchExportFormat` 确认包含 `'svg'` union 分支 | TypeScript 类型包含 `'svg'`，无类型错误 |
| D5.2 | `ExportProgress.tsx` format 下拉框渲染 PNG/SVG/PDF/ZIP 四个选项 | `<option>` 数量 === 4；`screen.getByRole('option', { name: /svg/i })` 存在 |
| D5.3 | 选择 SVG 触发 `exportAsSvgZip()` 调用 | `onChange` handler 中 SVG 分支调用 `exportAsSvgZip()` |
| D5.4 | vitest 新增边界 cases（0节点/1节点/100+节点） | 3 个新 case；边界场景均通过 |

**修改文件**：`src/components/dds/export/ExportProgress.tsx`、`src/services/export/exportMultipleAsSVG.ts`（确认类型）  
**测试**：`npx vitest run exportMultipleAsSVG.test.ts --reporter=verbose`

---

## Epic 进度汇总

| Epic | 状态 | 新增文件 | 修改文件 | vitest |
|------|------|---------|---------|--------|
| E1 | 待开发 | PresenceIndicator.tsx, usePresence.ts | DDSCanvasPage.tsx | presenceIndicator.test.tsx |
| E2 | 待开发 | ConflictDialog.tsx | wsCommentHandler.ts, wsRevisionHandler.ts | wsRevisionHandler.test.ts |
| E3 | 待开发 | NotificationBell.tsx, NotificationPanel.tsx | mentionsStore.ts | mentionsStore.test.ts (markAsRead) |
| E4 | 待开发 | — | DDSToolbar.tsx | ShortcutSettingsPanel.test.tsx |
| E5 | 待开发 | — | ExportProgress.tsx, exportMultipleAsSVG.ts | exportMultipleAsSVG.test.ts |

**Phase2 预估工作量**：E1 > E2 > E3 > E4 > E5

---

## 跨 Sprint 依赖检查

| 文件 | 来源 Sprint | Sprint 53 用途 |
|------|-----------|--------------|
| `src/stores/dds/presenceStore.ts` | S51-E1 | E1 依赖，store 已存在 |
| `src/services/collaboration/wsRevisionHandler.ts` | S52-E3 | E2 依赖，骨架已存在需实现逻辑 |
| `src/stores/dds/mentionsStore.ts` | S51-E5 | E3 依赖，需新增 markAsRead action |
| `src/components/dds/shortcuts/ShortcutSettingsPanel.tsx` | S52-E5 | E4 依赖，仅需集成 |
| `src/services/export/exportMultipleAsSVG.ts` | S52-E2 | E5 依赖，代码已存在仅需 UI 集成 |

*IMP 完成时间: 2026-06-02*
