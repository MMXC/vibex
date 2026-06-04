# VibeX Sprint60 架构设计文档

**Sprint**: Sprint60
**日期**: 2026-06-03
**版本**: 1.0

---

## 1. 执行摘要

Sprint60 实现 5 个 Epic 的 UI 层最后一公里交付。核心架构决策：

- **E1**: 在现有 `canvasHistoryStore.ts` 数据层（S58 已完成）上新增时间线 UI + diff 对比逻辑
- **E2**: 新建 `batchOpsStore.ts` + `BatchOpsToolbar.tsx`，批量操作与单操作解耦
- **E3**: 新建 `activityStore.ts` 独立管理协作者活动状态，复用现有 `presenceStore.ts` WebSocket 连接
- **E4**: `ZipExporter.ts`（S52 已完成 PNG/PDF）扩展方法，DDSToolbar 新增导出按钮
- **E5**: 新建 `canvasSearchStore.ts` 管理搜索历史，复用 `DDSSearchPanel.tsx` UI

---

## 2. 跨 Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|-----------|------|
| DDSToolbar | E2, E4 | 批量操作和导出按钮挂载点 |
| DDSSearchPanel | E5 | 搜索历史 Tab 扩展 |
| canvasHistoryStore | E1 | compareSnapshots 方法扩展 |
| presenceStore | E3 | 复用 WebSocket 连接，activityStore 独立广播 |
| ZipExporter | E4 | 扩展 exportMultipleAsPNG/PDF 方法 |

---

## 3. Epic E1: 画布版本历史 UI 增强

### 3.1 现有资产

| 文件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | ✅ 存在 (16KB) | S58 完成 saveSnapshot/loadSnapshot，无 compareSnapshots |
| `vibex-fronted/src/components/dds/history/` | ❌ 不存在 | 目录需创建 |

### 3.2 架构决策

**A. HistoryPanel 双 Tab 模式**
- 扩展现有 `HistoryPanel.tsx`（不存在，需新建），新增"列表视图"和"时间线视图"两个 Tab
- 时间线视图使用垂直时间轴组件，每个节点展示快照缩略图 + 时间戳
- Tab 状态存储在组件内部 `useState`，不新增 store

**B. compareSnapshots 方法**
- 扩展 `canvasHistoryStore.ts`，新增 `compareSnapshots(snapshotIdA: string, snapshotIdB: string)` 方法
- 比较逻辑：按节点 ID 对比，节点 ID 在 A 不在 B = added，在 B 不在 A = removed，在 A 和 B 但数据不同 = modified
- 返回 `{ added: CanvasNode[], removed: CanvasNode[], modified: CanvasNode[] }`

**C. SnapshotDiffDialog**
- 新建 `SnapshotDiffDialog.tsx`，三栏布局：Added / Removed / Modified
- 每个节点卡片显示类型标签（绿色 Added / 红色 Removed / 黄色 Modified）
- 点击节点卡片可预览其在画布中的位置

**D. 快照元数据扩展**
- `Snapshot` 类型扩展 `branchName?: string` 和 `isStarred?: boolean`
- IndexedDB schema 新增 branchName 列（通过 version 迁移）

### 3.3 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | 扩展 | add compareSnapshots, branchName, isStarred |
| `vibex-fronted/src/components/dds/history/HistoryPanel.tsx` | 新建 | 双 Tab 时间线视图 |
| `vibex-fronted/src/components/dds/history/SnapshotDiffDialog.tsx` | 新建 | 三栏 diff 对比 |
| `vibex-fronted/src/components/dds/history/TimelineView.tsx` | 新建 | 垂直时间轴组件 |
| `vibex-fronted/src/components/dds/history/SnapshotCard.tsx` | 新建 | 时间线节点卡片 |
| `vibex-fronted/src/components/dds/history/__tests__/HistoryPanel.test.tsx` | 新建 | HistoryPanel vitest |
| `vibex-fronted/src/components/dds/history/__tests__/SnapshotDiffDialog.test.tsx` | 新建 | SnapshotDiffDialog vitest |
| `vibex-fronted/src/stores/dds/__tests__/canvasHistoryStore.e1-snapshot.test.ts` | 扩展 | compareSnapshots 测试 |

---

## 4. Epic E2: 批量操作增强

### 4.1 现有资产

| 文件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/dds/DDSCanvasStore.ts` | ✅ 存在 | 画布 CRUD，无 batchDelete/batchRename |
| `vibex-fronted/src/components/dds/canvas-dashboard/CanvasListPanel.tsx` | ❌ 不存在 | 需确认正确路径 |
| `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` | ✅ 存在 | 可挂载批量操作按钮 |

### 4.2 架构决策

**A. batchOpsStore 独立设计**
- 新建 `batchOpsStore.ts`，独立管理批量选择状态（与 canvasStore 解耦）
- 状态：`selectedIds: Set<string>`, `mode: 'idle' | 'selecting' | 'renaming' | 'exporting'`
- actions: `toggleSelect(id)`, `selectAll()`, `clearSelection()`, `setMode(mode)`

**B. CanvasListPanel 批量选择模式**
- 扩展 `CanvasListPanel.tsx`（需确认路径），在工具栏增加"批量选择"按钮
- 激活后每个画布卡片前显示 Checkbox
- 选中 N 个后，底部弹出 `BatchOpsToolbar` 浮层

**C. 批量操作具体实现**
- `DDSCanvasStore.ts` 扩展 `batchDeleteCanvas(ids: string[])` 和 `renameCanvas(id: string, newName: string)`
- 批量删除显示确认对话框（`ConfirmDialog`），确认后调用 `batchDeleteCanvas()`
- 批量重命名支持前缀/后缀替换模式

**D. DDSToolbar 集成**
- DDSToolbar 新增"批量选择"切换按钮，状态由 `batchOpsStore` 管理

### 4.3 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/dds/batchOpsStore.ts` | 新建 | 批量选择状态管理 |
| `vibex-fronted/src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` | 新建 | 批量操作浮层 |
| `vibex-fronted/src/components/dds/canvas-dashboard/CanvasListPanel.tsx` | 扩展 | 批量选择模式 + Checkbox |
| `vibex-fronted/src/stores/dds/DDSCanvasStore.ts` | 扩展 | batchDeleteCanvas, renameCanvas |
| `vibex-fronted/src/stores/dds/batchOpsStore.test.ts` | 新建 | batchOpsStore vitest |
| `vibex-fronted/src/components/dds/canvas-dashboard/__tests__/BatchOpsToolbar.test.tsx` | 新建 | BatchOpsToolbar vitest |

---

## 5. Epic E3: 协作活动流 + 在线状态指示

### 5.1 现有资产

| 文件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/lib/collaboration/presenceStore.ts` | ✅ 存在 | 在线状态 + cursor |
| `vibex-fronted/src/lib/collaboration/websocket.ts` | ✅ 存在 | 基础 WS 连接，消息类型：auth/action/remote_action/presence/conflict |
| `vibex-fronted/src/components/dds/presence/PresenceIndicator.tsx` | ✅ 存在 | 在线用户指示器 |
| `vibex-fronted/src/lib/collaboration/useCollaboration.ts` | ✅ 存在 | 协作者 hook |

### 5.2 架构决策

**A. activityStore 独立设计**
- 新建 `activityStore.ts`，独立管理协作者活动历史
- 状态：`activities: ActivityRecord[]`（最近 50 条），每条记录 `{ userId, userName, action, target, timestamp, type }`
- actions: `addActivity(record)`, `clearOldActivities(maxAge: number)`
- 活动类型：'join' | 'leave' | 'edit' | 'comment' | 'export'

**B. WS activity 消息**
- 扩展 `websocket.ts` 支持 `activity:update` 消息类型
- 客户端每 5s 广播一次自身活动（edit 操作时）
- 服务端转发给其他协作者

**C. ActivityFeed 面板**
- 新建 `ActivityFeed.tsx`，展示在 DDSSidePanel 内（复用现有 panel 结构）
- 显示最近 5 条活动，每条：`[avatar] username · action · time`
- 时间显示相对时间（"2 分钟前"）

**D. RemoteCursor 在线状态指示**
- 扩展 `RemoteCursor.tsx`（不存在，新建），显示脉冲动画
- 绿色脉冲 = 在线（最新活动 < 30s），灰色 = 空闲（> 5min），橙色 = 忙碌
- 空闲 30s 后自动降级为"空闲"状态

### 5.3 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/dds/activityStore.ts` | 新建 | 活动状态管理 |
| `vibex-fronted/src/lib/collaboration/activityStore.ts` | 新建 | lib 层活动状态（独立于 dds） |
| `vibex-fronted/src/lib/collaboration/activityHandler.ts` | 新建 | WS activity:update 消息处理 |
| `vibex-fronted/src/components/dds/collaboration/ActivityFeed.tsx` | 新建 | 活动流面板 |
| `vibex-fronted/src/components/dds/collaboration/RemoteCursor.tsx` | 新建 | 带状态指示的光标 |
| `vibex-fronted/src/components/dds/collaboration/__tests__/ActivityFeed.test.tsx` | 新建 | ActivityFeed vitest |
| `vibex-fronted/src/components/dds/collaboration/__tests__/RemoteCursor.test.tsx` | 新建 | RemoteCursor vitest |
| `vibex-fronted/src/stores/dds/__tests__/activityStore.test.ts` | 新建 | activityStore vitest |

---

## 6. Epic E4: 画布导出增强

### 6.1 现有资产

| 文件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/services/export/ZipExporter.ts` | ✅ 存在 (9KB) | S52 完成，支持 PNG + PDF |
| `vibex-fronted/src/components/dds/export/ExportProgress.tsx` | ✅ 存在 (5.5KB) | 导出进度条组件 |
| `vibex-fronted/src/components/dds/toolbar/ExportMenu.tsx` | ✅ 存在 | 导出菜单（现有 PNG/SVG/JSON） |
| `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` | ✅ 存在 | 工具栏，可扩展导出按钮 |

### 6.2 架构决策

**A. ZipExporter PNG/PDF 扩展**
- `ZipExporter.ts` 已支持 PNG/PDF，但需验证 `exportMultipleAsPNG(canvasIds: string[])` 和 `exportMultipleAsPDF(canvasIds: string[])` 方法存在
- 如果缺失，扩展 ZipExporter 添加这两个方法（调用 `captureNodeAsPng` + `html-to-image`）

**B. html-to-image 集成**
- 检查 `package.json`，如无 `html-to-image` 则安装
- PNG 截取使用 `html-to-image/toPng()`，对每个节点截图后打包

**C. DDSToolbar 导出按钮**
- DDSToolbar 新增"导出 PNG"和"导出 PDF"按钮（独立于 ExportMenu）
- 导出按钮触发 `ExportProgress` 组件显示进度

**D. 批量导出面板**
- 扩展 CanvasListPanel 批量操作，当选择 N 个画布后，BatchOpsToolbar 显示"导出"按钮
- 导出面板（`ExportBatchDialog.tsx`）支持选择格式（ZIP-PNG / ZIP-PDF / 混合格式）

### 6.3 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/services/export/ZipExporter.ts` | 扩展 | 确认/实现 exportMultipleAsPNG/PDF |
| `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx` | 扩展 | 新增 PNG/PDF 导出按钮 |
| `vibex-fronted/src/components/dds/export/ExportBatchDialog.tsx` | 新建 | 批量导出格式选择 |
| `vibex-fronted/src/components/dds/export/__tests__/ExportBatchDialog.test.tsx` | 新建 | ExportBatchDialog vitest |
| `vibex-fronted/src/services/export/__tests__/ZipExporter.test.ts` | 扩展 | PNG/PDF 导出测试 |

---

## 7. Epic E5: 搜索体验增强

### 7.1 现有资产

| 文件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/components/dds/DDSSearchPanel.tsx` | ✅ 存在 (8.9KB) | 搜索面板，有键盘导航 |
| `vibex-fronted/src/components/dds/SearchPanel.tsx` | ✅ 存在 | 另一搜索面板 |
| `vibex-fronted/src/hooks/useSearchIndex.ts` | ✅ 存在 (2.2KB) | 搜索索引 hook，无 Fuse.js |

### 7.2 架构决策

**A. canvasSearchStore 独立设计**
- 新建 `canvasSearchStore.ts`，管理搜索历史和搜索状态
- 状态：`searchHistory: string[]`（最多 10 条，localStorage 持久化）
- actions: `addToHistory(query)`, `clearHistory()`, `setCurrentResult(results)`

**B. 搜索历史 Tab**
- 扩展 `DDSSearchPanel.tsx`，新增"最近搜索"Tab（与"画布搜索"并列）
- 搜索历史从 `canvasSearchStore.searchHistory` 读取
- 点击历史条目直接执行搜索

**C. 搜索结果高亮**
- 扩展 `DDSSearchPanel.tsx` 结果渲染，使用 `<mark>` 标签包裹匹配关键词
- 高亮逻辑在结果渲染层实现，不修改 store

**D. Fuse.js 优化**
- 检查 `package.json` 是否有 `fuse.js`，如无则安装
- `useSearchIndex.ts` 集成 Fuse.js，`threshold: 0.2` 提高中文精确度
- 高亮匹配：`Fuse.match` 返回匹配位置数组

**E. 键盘导航**
- `DDSSearchPanel.tsx` 已有 `onKeyDown` 处理 `ArrowUp`/`ArrowDown`/`Enter`
- 扩展支持 `Home`/`End` 跳转首尾，搜索历史项也可键盘导航

### 7.3 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/stores/dds/canvasSearchStore.ts` | 新建 | 搜索历史状态管理 |
| `vibex-fronted/src/components/dds/DDSSearchPanel.tsx` | 扩展 | 搜索历史 Tab + 高亮 |
| `vibex-fronted/src/hooks/canvas/useCanvasSearch.ts` | 扩展 | Fuse.js 集成 |
| `vibex-fronted/src/stores/dds/__tests__/canvasSearchStore.test.ts` | 新建 | canvasSearchStore vitest |
| `vibex-fronted/src/components/dds/__tests__/DDSSearchPanel.test.tsx` | 扩展 | 搜索历史测试 |

---

## 8. 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| HistoryPanel 路径冲突 | E1 | 确认使用 `vibex-fronted/src/components/dds/history/` 路径 |
| ZipExporter PNG/PDF 方法缺失 | E4 | 扩展 ZipExporter 添加缺失方法 |
| html-to-image 未安装 | E4 | 检查 package.json，必要时安装 |
| 搜索历史 localStorage 跨 tab 同步 | E5 | 使用 `storage` 事件监听同步 |
| activityStore 与 presenceStore 状态冗余 | E3 | activityStore 独立管理，WS 消息与 presence 解耦 |

---

## 9. 依赖关系

```
E1: canvasHistoryStore.compareSnapshots (extend)
    └─ HistoryPanel.tsx → SnapshotDiffDialog.tsx

E2: DDSCanvasStore.batchDelete/rename (extend)
    └─ BatchOpsToolbar.tsx → CanvasListPanel 扩展

E3: activityStore (new) → ActivityFeed.tsx → RemoteCursor.tsx
    └─ activityHandler.ts (WS message handler)

E4: ZipExporter (extend) → DDSToolbar 导出按钮 → ExportBatchDialog.tsx

E5: canvasSearchStore (new) → DDSSearchPanel 扩展 + useCanvasSearch Fuse.js
```

---

## 10. 产出文件清单

| Epic | 新建文件 | 扩展文件 |
|------|---------|---------|
| E1 | HistoryPanel, SnapshotDiffDialog, TimelineView, SnapshotCard, 2 test files | canvasHistoryStore, canvasHistoryStore test |
| E2 | batchOpsStore, BatchOpsToolbar, 2 test files | DDSCanvasStore, CanvasListPanel |
| E3 | activityStore, ActivityFeed, RemoteCursor, activityHandler, 3 test files | websocket.ts |
| E4 | ExportBatchDialog, 1 test file | ZipExporter, DDSToolbar |
| E5 | canvasSearchStore, 2 test files | DDSSearchPanel, useCanvasSearch |
