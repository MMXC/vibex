# VibeX Sprint 53 — 提案分析文档

**Sprint**: Sprint 53  
**日期**: 2026-06-02  
**依据**: Sprint 52 (E1-E5) + Sprint 51 + Sprint 50 交付物 CHANGELOG 回顾

---

## P001 — 协作实时 Presence UI（在线用户指示器）

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **问题描述** | S52-E1 仅完成 vitest，无实际 PresenceIndicator UI 组件。协作者在线状态无法感知。 |
| **根因分析** | S52-E1 CHANGELOG 仅有 `presenceStore.test.ts` 测试用例，源码层面无 PresenceIndicator 组件。S51-E1 WebSocket 持久化完成底层能力，上层 UI 缺失。 |
| **影响范围** | 高 — 协作者无法感知彼此在线，无法实现"跟随光标"等高级协作功能 |
| **技术方案** | 1. `PresenceIndicator.tsx` — 侧边栏在线用户头像列表  2. `usePresence.ts` hook — 订阅 presence:join/leave/ping  3. `DDSCanvasPage.tsx` 集成  4. WebSocket 消息处理 |
| **技术风险** | 中 — WebSocket `presence:join` / `presence:leave` / `presence:ping` 消息类型需后端确认是否已实现 |
| **缓解方案** | 与后端确认 presence 消息类型；若后端未实现，先用 presenceStore 本地状态模拟 |
| **验收标准** | PresenceIndicator 渲染列表；用户加入/离开实时更新；30s 无 ping 移除；vitest 覆盖 0/1/多用户场景 |

---

## P002 — 协作 Undo/Redo 冲突处理（WebSocket 集成 + Toast UI）

| 字段 | 内容 |
|------|------|
| **优先级** | P0 |
| **问题描述** | S52-E3 实现 `wsRevisionHandler` 骨架但未接入 `wsCommentHandler`；Toast UI 仅有函数声明无调用。 |
| **根因分析** | `wsCommentHandler` switch 缺少 `revision:bump` / `revision:conflict` case；`triggerConflictToast()` 未被调用；Conflict Dialog 未实现。 |
| **影响范围** | 高 — 协作 Undo 可能撤销他人操作，冲突时无 UI 反馈 |
| **技术方案** | 1. `wsCommentHandler.ts` 新增 revision case（`.then()` 动态导入）  2. `wsRevisionHandler` 实际逻辑接入  3. `ConflictDialog` 实现 Discard Local / Merge / Discard Remote 三选项 |
| **技术风险** | 中 — WebSocket revision 消息时序不确定；双客户端冲突复现困难 |
| **缓解方案** | 单元测试覆盖 bump + conflict cases；集成测试在 reviewer 阶段手动验证 |
| **验收标准** | `wsCommentHandler` 处理 `revision:bump` 更新 baseRevision；处理 `revision:conflict` 触发 ConflictDialog；三选项均可执行；vitest 覆盖 bump + conflict cases |

---

## P003 — @提及通知面板（通知 Dropdown UI）

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **问题描述** | S51-E5 实现了 `@` 补全下拉，但无通知面板展示被 @ 提及的历史记录。 |
| **根因分析** | `mentionsStore` 已有 `unreadCount` + `mentions[]` + `addMention` / `clearUnread`；UI 层缺失 `NotificationBell` + `NotificationPanel`。 |
| **影响范围** | 中 — 用户无法感知被 @ 提及，协作通知体验不完整 |
| **技术方案** | 1. `NotificationBell.tsx` — 铃铛图标 + unreadCount 红点  2. `NotificationPanel.tsx` — Dropdown 展示 mentions 列表  3. `mentionsStore.markAsRead(mentionId)`  4. 点击跳转画布 + 高亮节点 |
| **技术风险** | 低 — 已有 mentionsStore 前端实现，仅 UI 组件缺失 |
| **验收标准** | 导航栏通知铃铛 + unreadCount 红点；点击展开通知面板；列表显示提及内容预览；点击通知跳转画布；vitest 新增 markAsRead cases |

---

## P004 — 键盘快捷键设置面板（DDSToolbar 集成）

| 字段 | 内容 |
|------|------|
| **优先级** | P1 |
| **问题描述** | S52-E5 实现了 `ShortcutSettingsPanel` + `ShortcutKeyInput`，但 DDSToolbar 中无触发按钮。 |
| **根因分析** | `ShortcutSettingsPanel` 作为独立组件存在但未被 DDSToolbar 引用；IMP 中可能遗漏了集成步骤。 |
| **影响范围** | 中 — 快捷键设置功能用户无法触达 |
| **技术方案** | 1. DDSToolbar 添加 KeyboardIcon 按钮（lucide-react）  2. 添加 `isShortcutSettingsOpen` state + ShortcutSettingsPanel 挂载  3. conflict warning 在快捷键冲突时显示  4. i18n 新增 `shortcut.settings` 命名空间 |
| **技术风险** | 低 — ShortcutSettingsPanel 已实现，仅需集成 |
| **验收标准** | DDSToolbar 有键盘图标按钮；点击打开面板；面板内可重新绑定快捷键；冲突显示 warning；vitest 覆盖 open/close/rebind cases |

---

## P005 — 批量导出 SVG 格式（与 PNG/PDF UI 并列）

| 字段 | 内容 |
|------|------|
| **优先级** | P2 |
| **问题描述** | S52-E2 实现了 `exportMultipleAsSVG.ts`，但 ExportProgress format 下拉菜单中 SVG 选项缺失。 |
| **根因分析** | SVG 代码已实现但 UI 集成遗漏；`BatchExportFormat` union 可能缺少 `'svg'`；`ZipExporter.exportAsSvgZip()` 存在但未被 UI 调用。 |
| **影响范围** | 低 — SVG 导出代码存在但不可用 |
| **技术方案** | 1. 确认 `BatchExportFormat` 含 `'svg'`  2. `ExportProgress.tsx` format 下拉框添加 SVG 选项  3. 确认 `exportAsSvgZip()` 分支  4. 文件名自动添加 `.svg` 后缀 |
| **技术风险** | 低 — 核心代码已实现，UI 集成量小 |
| **验收标准** | format 下拉框显示 PNG/SVG/PDF/ZIP 四个选项；选择 SVG 触发 `exportAsSvgZip()`；导出文件名含 `.svg` 后缀；vitest 新增 0/1/100+ 节点边界 cases |

---

*分析完成时间: 2026-06-02*  
*分析依据: proposals/20260602/analyst.md + CHANGELOG.md (S49-S52)*
