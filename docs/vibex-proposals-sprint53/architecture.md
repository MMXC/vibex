# VibeX Sprint 53 — 架构设计文档

**Sprint**: Sprint 53  
**日期**: 2026-06-02  
**状态**: Approved

---

## 架构概述

Sprint 53 聚焦**协作体验完善**，在 Sprint 49-52 的底层能力基础上完成上层 UI 集成。核心技术挑战：

| Epic | 依赖 | 架构决策 |
|------|------|---------|
| E1 Presence UI | S51-E1 presenceStore | WebSocket 消息订阅 → Zustand store → UI 渲染 |
| E2 Revision 冲突 | S52-E3 wsRevisionHandler | WebSocket switch-case 接入 → store 状态同步 → Dialog UI |
| E3 @提及通知 | S51-E5 mentionsStore | Zustand store → 铃铛图标 + Dropdown UI |
| E4 快捷键集成 | S52-E5 ShortcutSettingsPanel | props-driven modal 集成到 DDSToolbar |
| E5 SVG 导出 | S52-E2 exportMultipleAsSVG | BatchExportFormat union → ExportProgress UI |

---

## E1 — 协作实时 Presence UI

### 现有状态
- `src/stores/dds/presenceStore.ts` — 存在，本地状态管理（vitest 通过）
- S51-E1 WebSocket 持久化底层能力已完成
- **`PresenceIndicator.tsx` 不存在**，需新建

### 需新增文件
| 文件 | 说明 |
|------|------|
| `src/components/dds/presence/PresenceIndicator.tsx` | 侧边栏在线用户列表组件 |
| `src/hooks/canvas/usePresence.ts` | WebSocket presence:join/leave/ping 消息 hook |

### 架构决策
1. **WebSocket 消息订阅**：通过 `usePresence.ts` 订阅 `presence:join` / `presence:leave` / `presence:ping`，调用 `presenceStore.getState().addUser()` / `removeUser()` / `updateLastSeen()`
2. **30s 无 ping 移除**：使用 `setInterval` 定期检查 `lastSeen` 时间戳，超时则从 store 中移除
3. **头像 fallback**：使用 `user.name` 首字母生成 colored avatar，无真实头像时显示 initials
4. **DDSCanvasPage 集成**：侧边栏 `<PresenceIndicator />` 挂载，`usePresence()` 在组件 mount 时启动 WebSocket 订阅

### 测试策略
- vitest: `presenceIndicator.test.tsx` — 覆盖 0用户/单用户/多用户/头像 fallback
- `usePresence.test.ts`（可选）：mock WebSocket 实例，验证消息分发到 store

---

## E2 — 协作 Undo/Redo 冲突处理

### 现有状态
- `src/services/collaboration/wsRevisionHandler.ts` — 骨架存在，`handleRevisionBump()` / `handleRevisionConflict()` 函数体待实现
- `wsCommentHandler.ts` — 缺少 `revision:bump` / `revision:conflict` case
- **`ConflictDialog.tsx` 不存在**，需新建

### 需新增/修改文件
| 文件 | 说明 |
|------|------|
| `src/components/dds/conflict/ConflictDialog.tsx` | 冲突处理 Dialog（新增） |
| `src/services/collaboration/wsCommentHandler.ts` | 新增 revision case（修改） |
| `src/services/collaboration/wsRevisionHandler.ts` | 实现 bump/conflict 逻辑（修改） |

### 架构决策
1. **WebSocket 动态导入**：`wsCommentHandler.ts` 中使用 `.then()` 动态导入 `useConflictStore`（避免顶层 await 在 switch case 中的语法错误）
2. **ConflictDialog 三选项**：
   - `Discard Local`：清空本地 oplog，强制同步远程
   - `Merge`：保留本地 + 远程，以远程 baseRevision 为准
   - `Discard Remote`：忽略远程更新，保留本地
3. **baseRevision 同步**：收到 `revision:bump` 时调用 `store.getState().setBaseRevision(rev)`

### 测试策略
- vitest: `wsRevisionHandler.test.ts` — mock `wsHandler` 方法，验证 bump 更新 store + conflict 触发 Dialog
- 集成测试（reviewer 阶段手动验证）

---

## E3 — @提及通知面板

### 现有状态
- `src/stores/dds/mentionsStore.ts` — 存在，`unreadCount` / `mentions[]` / `addMention` / `clearUnread()` 均已实现
- `useMentionCompletion.ts` — S51-E5 已实现 @ 补全
- **`NotificationBell.tsx` / `NotificationPanel.tsx` 不存在**，需新建

### 需新增文件
| 文件 | 说明 |
|------|------|
| `src/components/dds/notifications/NotificationBell.tsx` | 铃铛图标 + unreadCount 红点 |
| `src/components/dds/notifications/NotificationPanel.tsx` | Dropdown 面板 |
| `src/stores/dds/mentionsStore.ts` | 新增 `markAsRead(mentionId)` action |

### 架构决策
1. **红点驱动**：`NotificationBell` 读取 `mentionsStore.unreadCount`，>0 时显示红色角标
2. **Dropdown 行为**：点击铃铛 toggle `isOpen` state，点击外部（`useOnClickOutside`）关闭
3. **Panel 内容**：`mentions[]` 按时间倒序，每项显示 mentioned by + content preview + timestamp
4. **markAsRead**：调用 `mentionsStore.getState().markAsRead(mentionId)`，更新 `unreadCount` 和 `mentions[].isRead`

### 测试策略
- vitest: `mentionsStore.test.ts` — 新增 `markAsRead` cases（递减 unreadCount、设置 isRead）
- vitest: `NotificationBell.test.tsx`（可选）：红点显示逻辑

---

## E4 — 键盘快捷键设置面板 DDSToolbar 集成

### 现有状态
- `src/components/dds/shortcuts/ShortcutSettingsPanel.tsx` — S52-E5 已实现
- `src/components/dds/shortcuts/ShortcutKeyInput.tsx` — S52-E5 已实现
- **`DDSToolbar.tsx` 无触发按钮**，需修改

### 需修改文件
| 文件 | 说明 |
|------|------|
| `src/components/dds/toolbar/DDSToolbar.tsx` | 添加 KeyboardIcon 按钮 + panel 挂载（修改） |

### 架构决策
1. **按钮位置**：DDSToolbar 右侧区域，KeyboardIcon（lucide-react）按钮，aria-label="键盘快捷键设置"
2. **Panel 开关**：`isShortcutSettingsOpen: boolean` state，`setIsShortcutSettingsOpen(true/false)`
3. **Panel 挂载**：`ShortcutSettingsPanel isOpen={isShortcutSettingsOpen} onClose={() => setIsShortcutSettingsOpen(false)}`
4. **冲突 warning**：`ShortcutKeyInput` 读取 `shortcutStore.conflicts`，高亮冲突项

### 测试策略
- vitest: `ShortcutSettingsPanel.test.tsx` — open/close/rebind cases（S52-E5 已覆盖部分）

---

## E5 — 批量导出 SVG 格式 UI

### 现有状态
- `src/services/export/exportMultipleAsSVG.ts` — S52-E2 已实现
- `ZipExporter.exportAsSvgZip()` — S52-E2 已实现
- **`BatchExportFormat` union 可能缺少 `'svg'`**，需确认
- **`ExportProgress.tsx` format 下拉框 SVG 选项缺失**，需修改

### 需修改文件
| 文件 | 说明 |
|------|------|
| `src/services/export/exportMultipleAsSVG.ts` | 确认 `BatchExportFormat` 含 `'svg'`（修改） |
| `src/components/dds/export/ExportProgress.tsx` | format 下拉框添加 SVG 选项（修改） |

### 架构决策
1. **Format union 确认**：检查 `BatchExportFormat = 'png' | 'svg' | 'pdf' | 'zip'`，添加缺失的 `'svg'`
2. **ExportProgress UI**：`format` 下拉框使用 `<select>`，`onChange` 触发对应导出函数
3. **SVG 分支**：`selectedFormat === 'svg'` 时调用 `exportAsSvgZip()`

### 测试策略
- vitest: `exportMultipleAsSVG.test.ts` — 新增 0节点/1节点/100+节点边界 cases

---

*架构设计完成时间: 2026-06-02*
