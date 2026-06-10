# S69 架构设计文档

**项目**: vibex-proposals-sprint69
**日期**: 2026-06-06
**依据**: docs/vibex-proposals-sprint69/prd.md

---

## 架构决策摘要

| Epic | 核心架构决策 | 新增/扩展 |
|------|------------|-----------|
| E1 | Snapshot 存储在 canvasHistoryStore + IndexedDB，恢复通过 replaceState | 扩展已有 |
| E2 | searchWithContext 返回匹配片段上下文，高亮在 UI 层实现 | 扩展已有 |
| E3 | 分享 URL = Base64(JSON(templateData))，无需后端 | 新增组件 |
| E4 | commentStore 独立于 notificationStore，复用 MentionInput | 新增 Store |
| E5 | canvasPresets 扩展 settingsStore，settingsStore.persist 同用 | 扩展已有 |

---

## E1: 画布版本快照历史 — 架构决策

### 决策 1：快照恢复机制
**方案**：恢复快照时调用 `canvasStore.replaceCanvasState(snapshot)`，完全替换当前画布状态（节点+边）。

**备选**：merge（合并）方案 → 复杂度高，暂不支持。

### 决策 2：快照与分支关联
**方案**：每个 Snapshot 记录 `branchId` 字段，过滤时按当前 `activeBranchId` 筛选。

### 决策 3：HistoryPanel 位置
**方案**：`HistoryPanel.tsx` 作为右侧抽屉（Drawer）嵌入 DDSCanvasPage。

### 现有资产映射表

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| canvasHistoryStore | `src/stores/dds/canvasHistoryStore.ts` | ✅ 已有 | S67-E1，含快照存储 |
| BranchDiffPanel | `src/components/dds/canvas-history/BranchDiffPanel.tsx` | ✅ 已有 | S67-E1，diff 逻辑复用 |
| DDSToolbar | `src/components/dds/toolbar/DDSToolbar.tsx` | ✅ 已有 | 添加历史按钮 |

### 新增文件
- `src/components/dds/canvas-history/HistoryPanel.tsx` — 快照历史面板
- `src/components/dds/canvas-history/SnapshotDiffDialog.tsx` — 快照对比浮层
- `src/components/dds/canvas-history/BranchManager.tsx` — 分支管理面板

---

## E2: 全局搜索增强 — 架构决策

### 决策 1：高亮实现位置
**方案**：在 `GlobalSearchPanel.tsx` UI 层实现高亮（`<mark>` 标签），不修改 Store 数据结构。

### 决策 2：上下文片段
**方案**：`canvasFulltextIndex.ts` 新增 `searchWithContext(query)` 方法，搜索时记录匹配位置，返回周围文本。

### 决策 3：键盘导航
**方案**：纯 React state 管理（`selectedIndex`）+ `useEffect` 监听 `keydown`，无需新 Store。

### 现有资产映射表

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| canvasFulltextIndex | `src/services/canvasFulltextIndex.ts` | ✅ 已有 | S68-E3 |
| GlobalSearchPanel | `src/components/dds/search/GlobalSearchPanel.tsx` | ✅ 已有 | S65-E4/S68-E3 |
| canvasSearchStore | `src/stores/canvasSearchStore.ts` | ✅ 已有 | S65-E4/S68-E3 |

### 新增/扩展文件
- `src/services/canvasFulltextIndex.ts` — 新增 `searchWithContext()` 方法

---

## E3: 模板市场 — 架构决策

### 决策 1：分享 URL 格式
**方案**：`URL?template=<base64(JSON.stringify({templateData}))>`

**优点**：纯前端，无需后端 API，链接可复制传播。

**限制**：URL 长度（建议模板 < 100KB）。

### 决策 2：导入去重
**方案**：`templateStore.importFromShareUrl()` 检查 `template.name + template.category`，冲突时弹确认对话框。

### 现有资产映射表

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| templateStore | `src/stores/templateStore.ts` | ✅ 已有 | S64-E5/S68-E1 |
| TemplateGallery | `src/components/dds/templates/TemplateGallery.tsx` | ✅ 已有 | S64-E5 |
| TemplateExportDialog | `src/components/dds/templates/TemplateExportDialog.tsx` | ✅ 已有 | S68-E1 |

### 新增文件
- `src/stores/templateShareStore.ts` — 分享状态管理
- `src/components/dds/templates/TemplateShareDialog.tsx` — 生成/复制分享链接
- `src/components/dds/templates/ImportFromUrlDialog.tsx` — URL 导入对话框

---

## E4: 节点评论系统 — 架构决策

### 决策 1：commentStore 与 notificationStore 分离
**方案**：`commentStore` 管理评论 CRUD，`notificationStore` 管理通知。评论触发通知时调用 `notificationStore.addNotification()`。

**原因**：S68-E2 notificationStore 架构决策明确分离通知持久化和 @提及 UI 状态。评论通知是通知的一种类型，两者独立但通过事件协作。

### 决策 2：评论存储
**方案**：IndexedDB via `commentDB.ts`，`commentStore` 使用 persist 中间件同步到 IndexedDB。

### 决策 3：评论 Badge 位置
**方案**：`NodeCommentBadge` 作为 `NodeEditorWrapper` 子组件，通过 `DDSCanvasPage` 注入。

### 现有资产映射表

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| notificationStore | `src/stores/notificationStore.ts` | ✅ 已有 | S68-E2 |
| MentionInput | `src/components/dds/collaboration/MentionInput.tsx` | ✅ 已有 | S68-E2 |
| wsNotificationHandler | 预期在 `src/services/wsNotificationHandler.ts` | 待验证 | S68-E2 |

### 新增文件
- `src/stores/commentStore.ts` — 评论 CRUD + IndexedDB 持久化
- `src/services/commentDB.ts` — IndexedDB 操作层
- `src/components/dds/comments/CommentThread.tsx` — 评论浮层
- `src/components/dds/comments/NodeCommentBadge.tsx` — 未读徽章

---

## E5: 画布视图预设 — 架构决策

### 决策 1：预设与 settingsStore 集成
**方案**：`canvasPresets[]` 和 `activePresetId` 直接扩展 `settingsStore` 状态，无需新 Store。

### 决策 2：预设字段结构
```typescript
interface CanvasPreset {
  id: string;
  name: string;
  icon: string; // emoji
  config: {
    backgroundColor?: string;
    gridSize?: number;
    gridVariant?: 'dots' | 'lines' | 'cross';
    defaultZoom?: number;
    snapToGrid?: boolean;
  };
}
```

### 现有资产映射表

| 资产 | 路径 | 状态 | 说明 |
|------|------|------|------|
| settingsStore | `src/stores/dds/settingsStore.ts` | ✅ 已有 | S65-E3，含视图设置 |
| DDSToolbar | `src/components/dds/toolbar/DDSToolbar.tsx` | ✅ 已有 | 添加预设下拉 |

### 新增文件
- `src/components/dds/settings/ViewPresetsPanel.tsx` — 预设管理面板

---

## 跨 Epic 集成点

| 集成点 | Epic A | Epic B | 接口 |
|--------|--------|--------|------|
| DDSToolbar 历史按钮 | E1 | — | onClick → open HistoryPanel |
| DDSToolbar 搜索 | E2 | — | 已有 GlobalSearchPanel |
| DDSToolbar 通知 | E4 | E2 | notificationStore.getUnreadCount() |
| DDSToolbar 预设下拉 | E5 | — | 已有 settingsStore |
| BranchDiffPanel 复用 | E1 | E3 | HistoryPanel → SnapshotDiffDialog |
| MentionInput 复用 | E4 | E2 | CommentThread → MentionInput |
| notificationStore 复用 | E4 | E2 | addNotification() |
| settingsStore persist | E5 | — | localStorage 持久化 |
