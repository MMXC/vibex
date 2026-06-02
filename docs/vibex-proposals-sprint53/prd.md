# VibeX Sprint 53 — 产品需求文档（PRD）

**Sprint**: Sprint 53  
**日期**: 2026-06-02  
**状态**: Draft

---

## 执行摘要

Sprint 53 聚焦**协作体验完善**，基于 Sprint 49-52 的底层能力（P0: 实时 Presence UI + Undo/Redo 冲突处理）和功能补全（P1: @提及通知面板 + 快捷键 DDSToolbar 集成；P2: SVG 批量导出 UI）。

**Sprint 52 遗留问题**：
- S52-E1: `presenceStore` vitest 完成，但无 PresenceIndicator UI → P001
- S52-E3: `wsRevisionHandler` 骨架存在，但未接入 wsCommentHandler → P002
- S52-E5: `ShortcutSettingsPanel` 存在，但 DDSToolbar 集成缺失 → P004

**新增功能**：Sprint 53 新增 P003（@提及通知面板）+ P005（SVG 导出 UI）。

---

## Epic-Story 表格

| Epic ID | 优先级 | 标题 | 负责人 | DoD 数量 |
|---------|--------|------|--------|---------|
| E1 | P0 | 协作实时 Presence UI（在线用户指示器） | TBD | 5 |
| E2 | P0 | 协作 Undo/Redo 冲突处理（WebSocket + Toast） | TBD | 5 |
| E3 | P1 | @提及通知面板（通知 Dropdown UI） | TBD | 5 |
| E4 | P1 | 键盘快捷键设置面板 DDSToolbar 集成 | TBD | 5 |
| E5 | P2 | 批量导出 SVG 格式 UI | TBD | 4 |

---

## E1 — 协作实时 Presence UI（在线用户指示器）

**背景**：S52-E1 仅完成 `presenceStore` vitest，无实际 PresenceIndicator 组件。S51-E1 WebSocket 持久化完成底层能力，上层 UI 缺失。

**功能需求**：
- 侧边栏显示在线协作者头像列表（userId / name / avatar / lastSeen）
- 右上角红点指示器（有其他用户在线时显示）
- 用户加入画布时实时出现在列表
- 用户离开 30s 无 ping 后从列表移除

**DoD（Definition of Done）**：
1. `PresenceIndicator.tsx` 组件渲染在线用户列表（userId / name / avatar / lastSeen）
2. WebSocket `presence:join` / `presence:leave` / `presence:ping` 消息处理（`usePresence.ts` hook）
3. `DDSCanvasPage.tsx` 集成 PresenceIndicator
4. 30s 无 ping 自动从列表移除
5. vitest `presenceIndicator.test.tsx` 覆盖 0用户 / 单用户 / 多用户 / 头像 fallback

**expect() 断言示例**：
```typescript
// presenceIndicator.test.tsx
expect(screen.getByText('Alice')).toBeInTheDocument(); // 单用户显示
const avatars = screen.getAllByRole('img'); expect(avatars.length).toBe(2); // 多用户
expect(screen.queryByText('Bob')).not.toBeInTheDocument(); // 离线用户移除
```

---

## E2 — 协作 Undo/Redo 冲突处理（WebSocket + Toast UI）

**背景**：S52-E3 实现 `wsRevisionHandler` 骨架但未接入 `wsCommentHandler`；`triggerConflictToast()` 未被调用。

**功能需求**：
- WebSocket 处理 `revision:bump` 消息，更新本地 `baseRevision`
- WebSocket 处理 `revision:conflict` 消息，触发 ConflictDialog
- ConflictDialog 三个选项：Discard Local / Merge / Discard Remote

**DoD（Definition of Done）**：
1. `wsCommentHandler.ts` 新增 `revision:bump` case — 更新 baseRevision（使用 `.then()` 动态导入）
2. `wsCommentHandler.ts` 新增 `revision:conflict` case — 触发 ConflictDialog
3. ConflictDialog 三个选项均可正常执行（Discard Local / Merge / Discard Remote）
4. vitest `wsRevisionHandler.test.ts` 覆盖 bump + conflict cases
5. 双客户端冲突场景手动验证（reviewer 阶段）

**expect() 断言示例**：
```typescript
// wsRevisionHandler.test.ts
vi.spyOn(wsHandler, 'handleRevisionBump').mockImplementation((rev) => {
  store.getState().setBaseRevision(rev);
});
// assert store state updated
expect(store.getState().baseRevision).toBe(5);
```

---

## E3 — @提及通知面板（通知 Dropdown UI）

**背景**：S51-E5 实现 `@` 补全下拉，但无通知面板展示被 @ 提及的历史记录。`mentionsStore` 已有 `unreadCount` / `mentions[]` / `addMention` / `clearUnread`。

**功能需求**：
- 导航栏通知铃铛图标，`mentionsStore.unreadCount` 驱动红点角标
- NotificationPanel Dropdown 显示 mentions 列表（mentioned by / content preview / timestamp）
- `mentionsStore.markAsRead(mentionId)` action
- 点击通知跳转到对应画布 + 高亮节点

**DoD（Definition of Done）**：
1. 导航栏 NotificationBell 组件（铃铛图标 + unreadCount 红点）
2. NotificationPanel Dropdown 显示 mentions 列表（按时间倒序）
3. 点击铃铛展开面板，点击外部关闭
4. `mentionsStore.markAsRead(mentionId)` action 实现
5. vitest `mentionsStore.test.ts` 新增 markAsRead cases（`unreadCount` 递减、已读状态更新）

**expect() 断言示例**：
```typescript
// mentionsStore.test.ts
store.getState().markAsRead('mention-1');
expect(store.getState().unreadCount).toBe(2);
expect(store.getState().mentions[0].isRead).toBe(true);
```

---

## E4 — 键盘快捷键设置面板 DDSToolbar 集成

**背景**：S52-E5 实现 `ShortcutSettingsPanel.tsx` + `ShortcutKeyInput.tsx`，但 DDSToolbar 中无触发按钮，面板无法触达用户。

**功能需求**：
- DDSToolbar 添加 KeyboardIcon 按钮（lucide-react，aria-label "键盘快捷键设置"）
- `isShortcutSettingsOpen` state 管理面板开关
- ShortcutSettingsPanel 以 `isOpen / onClose` props 集成
- 冲突快捷键显示 conflict warning
- i18n 新增 `shortcut.settings` 命名空间

**DoD（Definition of Done）**：
1. DDSToolbar.tsx 添加 KeyboardIcon 按钮（aria-label "键盘快捷键设置"）
2. DDSToolbar.tsx 添加 `isShortcutSettingsOpen` state + ShortcutSettingsPanel 挂载
3. ShortcutSettingsPanel `isOpen / onClose` props 正常工作
4. 冲突快捷键在 ShortcutKeyInput 中显示 warning
5. vitest `ShortcutSettingsPanel.test.tsx` 覆盖 open / close / rebind cases

**expect() 断言示例**：
```typescript
// ShortcutSettingsPanel.test.tsx
render(<ShortcutSettingsPanel isOpen={true} onClose={onClose} />);
expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument();
```

---

## E5 — 批量导出 SVG 格式 UI

**背景**：S52-E2 实现 `exportMultipleAsSVG.ts` + `exportAsSvgZip()`，但 ExportProgress format 下拉菜单中 SVG 选项缺失。

**功能需求**：
- `BatchExportFormat` union type 包含 `'svg'`
- ExportProgress.tsx format 下拉框显示 PNG / SVG / PDF / ZIP 四个选项
- 选择 SVG 触发 `exportAsSvgZip()`
- 导出文件名自动添加 `.svg` 后缀

**DoD（Definition of Done）**：
1. `BatchExportFormat` 确认包含 `'svg'` union 分支
2. `ExportProgress.tsx` format 下拉框渲染 PNG / SVG / PDF / ZIP 四个选项
3. 选择 SVG 触发 `exportAsSvgZip()` 调用
4. vitest `exportMultipleAsSVG.test.ts` 新增边界 cases（0节点 / 1节点 / 100+节点）

**expect() 断言示例**：
```typescript
// exportMultipleAsSVG.test.ts
expect(screen.getByRole('option', { name: /svg/i })).toBeInTheDocument();
const selectedFormat = screen.getByRole('combobox');
expect(selectedFormat).toHaveValue('svg');
```

---

## DoD 汇总

| Epic | DoD 项 | 描述 |
|------|--------|------|
| E1 | D1.1 | PresenceIndicator.tsx 组件 |
| E1 | D1.2 | usePresence.ts hook + WebSocket 消息处理 |
| E1 | D1.3 | DDSCanvasPage.tsx 集成 |
| E1 | D1.4 | 30s 无 ping 自动移除 |
| E1 | D1.5 | vitest presenceIndicator.test.tsx |
| E2 | D2.1 | wsCommentHandler revision:bump case |
| E2 | D2.2 | wsCommentHandler revision:conflict case |
| E2 | D2.3 | ConflictDialog 三选项实现 |
| E2 | D2.4 | vitest wsRevisionHandler.test.ts |
| E2 | D2.5 | 双客户端手动验证 |
| E3 | D3.1 | NotificationBell.tsx 组件 |
| E3 | D3.2 | NotificationPanel.tsx Dropdown |
| E3 | D3.3 | 展开/关闭交互 |
| E3 | D3.4 | mentionsStore.markAsRead action |
| E3 | D3.5 | vitest markAsRead cases |
| E4 | D4.1 | DDSToolbar 键盘图标按钮 |
| E4 | D4.2 | isShortcutSettingsOpen state + Panel 挂载 |
| E4 | D4.3 | isOpen/onClose props 正常工作 |
| E4 | D4.4 | 冲突快捷键 warning 显示 |
| E4 | D4.5 | vitest ShortcutSettingsPanel.test.tsx |
| E5 | D5.1 | BatchExportFormat 含 'svg' |
| E5 | D5.2 | ExportProgress format 下拉框四选项 |
| E5 | D5.3 | SVG 触发 exportAsSvgZip() |
| E5 | D5.4 | vitest 边界 cases |

---

## 页面集成表

| 页面 | 涉及组件 | 改动类型 |
|------|---------|---------|
| DDSCanvasPage | PresenceIndicator | 新增集成 |
| DDSCanvasPage | ConflictDialog | 新增集成 |
| Navigation / TopBar | NotificationBell + NotificationPanel | 新增 |
| DDSToolbar | KeyboardIcon + ShortcutSettingsPanel | 新增按钮 + props |
| ExportModal | ExportProgress (SVG 选项) | UI 修改 |

---

*PRD 创建时间: 2026-06-02*  
*数据来源: proposals/20260602/analyst.md + docs/vibex-proposals-sprint53/analysis.md*
