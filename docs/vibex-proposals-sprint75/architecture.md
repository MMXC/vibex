# VibeX Sprint75 Architecture — design-architecture

## Sprint74 基线

所有 Epic 基于以下已完成基础设施（S73-S74）：
- `canvasSearchStore.ts` (S74-E1): `recentSearches` 字段 + `addRecentSearch`/`clearRecentSearches`
- `NotificationPanel.tsx` (S68-E2 + S73-E3): Tab 架构已存在（可复用）
- `notificationStore.ts` (S68-E2 + S74-E4): `type` 字段支持 `'mention'/'comment'/'system'`
- `BranchDiffDialog.tsx` (S74-E3): 位于 `src/components/dds/history/`
- `CollabActivityPanel.tsx` (S68-E2): 位于 `src/components/dds/collab/`
- `MentionInput.tsx` (S51): 位于 `src/components/dds/collaboration/`
- `activityStore.ts` (S68-E2): `addEntry`/`extractMentions`/`processMentionNotifications`
- `CanvasSettingsDrawer.tsx` (existing): `src/components/dds/settings/`
- `canvasHistoryStore.ts` (S73-E4): `compareBranches` action + IndexedDB historyDB
- `DDSToolbar.tsx` (existing): 位于 `src/components/dds/toolbar/`

## E1 — 搜索历史工具栏快捷入口

**现有资产映射**：
| 文件 | 状态 | 说明 |
|------|------|------|
| `canvasSearchStore.ts` | ✅ S74-E1 | `recentSearches` 已有 |
| `CanvasSearchPanel.tsx` | ✅ S73-E1 | 搜索面板已有 chips |
| `DDSToolbar.tsx` | ✅ existing | 需新增 dropdown |

**架构决策**：
- RecentSearchesDropdown 作为独立组件挂载在 DDSToolbar 搜索按钮旁
- 数据直接消费 `canvasSearchStore.recentSearches`（零拷贝共享）
- Dropdown 点击 → 调用 canvasSearchStore 的搜索方法 + 触发搜索事件
- 搜索词超过 5 条时，dropdown 底部显示「查看更多」链接 → 呼起完整搜索面板

**集成点**：
- `DDSToolbar.tsx` L~200-300 区域（搜索按钮后）：新增 dropdown 状态 + 渲染
- `canvasSearchStore`: 直接调用无需修改

---

## E2 — @mention 通知专用 Tab

**现有资产映射**：
| 文件 | 状态 | 说明 |
|------|------|------|
| `NotificationPanel.tsx` | ✅ S73-E3 | 已有 header + notification list |
| `notificationStore.ts` | ✅ S74-E4 | `type` 字段已实现 |

**架构决策**：
- 在 NotificationPanel header 新增 TabBar 组件（4 个 Tab：全部/提及/评论/系统）
- `activeTab` 状态管理当前 Tab，切换时对 `notificationStore.notifications` 做 filter
- 各 Tab 独立滚动容器（React state: `scrollTopMap: Record<Tab, number>`）
- Badge 计数从 `notificationStore.notifications` 按 type 统计

**集成点**：
- `NotificationPanel.tsx`: header 区域新增 `<TabBar>` 组件
- `notificationStore.ts`: 无需修改，`type` 字段已存在

---

## E3 — 分支对比历史记录

**现有资产映射**：
| 文件 | 状态 | 说明 |
|------|------|------|
| `BranchDiffDialog.tsx` | ✅ S74-E3 | 位于 `src/components/dds/history/` |
| `canvasHistoryStore.ts` | ✅ S74-E3 | `compareBranches` 已有 |
| `historyDB.ts` | ✅ S73-E4 | IndexedDB 已支持 CRUD |

**架构决策**：
- `canvasHistoryStore` 新增 `branchDiffHistory` 字段（内存缓存）+ IndexedDB 持久化
- `historyDB` 新增 `branchDiffHistory` objectStore（compound key: `canvasId + comparedAt`）
- BranchDiffDialog 新增「历史」Tab（与「对比」Tab 并列），点击历史记录自动重现对比
- MAX=20 条，超出时删除最旧记录

**集成点**：
- `canvasHistoryStore.ts`: 新增 `addBranchDiffHistory`/`getBranchDiffHistory`/`clearBranchDiffHistory`
- `BranchDiffDialog.tsx`: 新增 Tab + 历史列表
- `historyDB.ts`: 新增 `branchDiffHistory` objectStore

---

## E4 — 协作活动流消息发送

**现有资产映射**：
| 文件 | 状态 | 说明 |
|------|------|------|
| `CollabActivityPanel.tsx` | ✅ S68-E2 | 只读活动流已有 |
| `MentionInput.tsx` | ✅ S51 | 位于 `src/components/dds/collaboration/` |
| `activityStore.ts` | ✅ S74-E4 | `extractMentions`/`processMentionNotifications` 已有 |

**架构决策**：
- 在 CollabActivityPanel footer 上方新增 MessageInput 区域（不替换 footer）
- 复用 `MentionInput` 组件（from `src/components/dds/collaboration/MentionInput`）
- 发送 → `activityStore.addEntry({ message, type: 'comment', canvasId, userId })`
- `addEntry` 内触发 `extractMentions` → `processMentionNotifications` → `notificationStore.addNotification`
- 新消息通过 WebSocket 广播（复用现有 WS 通道）

**集成点**：
- `CollabActivityPanel.tsx`: footer 上方新增 MessageInput
- `activityStore.ts`: 无需修改（`addEntry` 已支持 `message` 字段）

---

## E5 — 画布设置专用面板 Tab（修正）

**背景**: `CanvasSettingsDrawer.tsx` + `BackgroundSettings.tsx` + `GridSettings.tsx` + `ZoomSettings.tsx` 已存在于 `src/components/dds/settings/`。

**修正**: E5 聚焦于画布快照管理（BackupPanel 扩展）和 ViewPresetsTab 未完成功能。

**现有资产映射**：
| 文件 | 状态 | 说明 |
|------|------|------|
| `CanvasSettingsDrawer.tsx` | ✅ existing | Tab 架构已有 |
| `BackupPanel.tsx` | ✅ existing | 备份功能已有 |
| `ViewPresetsTab.tsx` | ✅ existing | 视图预设已有 |
| `canvasHistoryStore.ts` | ✅ S73-E4 | 分支管理已有 |

**架构决策**：
- E5 聚焦: CanvasSettingsDrawer 新增「快照管理」Tab（S73-E4 分支保护 + S74-E3 分支对比后，新增批量快照管理能力）
- 快照管理 Tab: 列出画布所有快照，支持选中多个 → 批量删除
- Tab 集成到 CanvasSettingsDrawer（Tab 索引 3）
- 设置随画布持久化到 IndexedDB（canvasStoreRegistry.settings）

**DoD 重述**:
- [ ] CanvasSettingsDrawer 新增「快照管理」Tab（第 4 个 Tab）
- [ ] Tab 内显示画布所有快照列表（canvasHistoryStore.listSnapshots）
- [ ] 多选快照 → 批量删除功能
- [ ] 「恢复默认」按钮
- [ ] CanvasSettingsDrawer test.tsx 扩展快照管理测试

**集成点**:
- `CanvasSettingsDrawer.tsx`: 新增 Tab + 渲染 SnapshotManagerPanel
- 新建 `src/components/dds/settings/SnapshotManagerPanel.tsx`
- `canvasHistoryStore.ts`: 新增 `deleteSnapshots(ids[])` action

---

## 跨 Epic 集成矩阵

| 集成点 | 源 | 目标 | 方案 |
|--------|----|----|------|
| RecentSearchesDropdown → canvasSearchStore | E1 | S74-E1 | 直接 import |
| BranchDiffDialog → historyDB | E3 | S73-E4 | 新增 objectStore |
| CollabActivityPanel → MentionInput | E4 | S51 | 直接复用组件 |
| CollabActivityPanel → activityStore | E4 | S74-E4 | `addEntry` 已支持 message |
| SnapshotManagerPanel → canvasHistoryStore | E5 | S73-E4 | 新增 `deleteSnapshots` |
| CanvasSettingsDrawer → SnapshotManagerPanel | E5 | E5 | 新组件集成 |
