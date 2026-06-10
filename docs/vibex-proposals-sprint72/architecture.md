# VibeX Sprint72 架构设计文档

## 概述
Sprint72 在 S71 基础上推进 5 个 Epic：画布历史管理面板、BatchOps 批量操作面板、协作 Presence 统一 Store、Analytics 趋势可视化、模板预览模式。

## 现有资产映射

| 组件/Store | 路径 | S72 用途 | 状态 |
|-----------|------|----------|------|
| `canvasHistoryStore.ts` | `src/stores/dds/canvasHistoryStore.ts` | E1 — 快照核心（35648字节，undo/redo） | ✅ 存在 |
| `canvasHistoryStore.test.ts` | `src/stores/dds/__tests__/canvasHistoryStore.test.ts` | E1 — 扩展快照列表测试 | ✅ 存在（需扩展） |
| `HistoryPanel.tsx` | `src/components/dds/canvas/HistoryPanel.tsx` | E1 — 新建 Tab6 快照面板 | ❌ 缺失（目标文件） |
| `batchOpsStore.ts` | `src/stores/dds/batchOpsStore.ts` | E2 — 批量操作数据源 | ✅ 存在 |
| `batchOpsStore.test.ts` | `src/stores/dds/__tests__/batchOpsStore.test.ts` | E2 — 批量操作测试 | ✅ 存在（需扩展） |
| `BatchOpsPanel.tsx` | `src/components/dds/batch-ops/BatchOpsPanel.tsx` | E2 — 新建批量操作面板 | ❌ 缺失（目标文件） |
| `presenceStore.ts` | `src/stores/dds/presenceStore.ts` | E3 — 新建统一 presence store | ❌ 缺失（目标文件） |
| `RemoteCursorsLayer.tsx` | `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` | E3 — 重构为 presenceStore 驱动 | ✅ 存在（需重构） |
| `PresenceIndicator.tsx` | `src/components/dds/presence/PresenceIndicator.tsx` | E3 — 重构为 presenceStore 驱动 | ✅ 存在（需重构） |
| `canvasAnalyticsStore.ts` | `src/stores/dds/canvasAnalyticsStore.ts` | E4 — 扩展 history 归档 | ✅ 存在（S71-E4） |
| `canvasAnalyticsStore.test.ts` | `src/stores/dds/__tests__/canvasAnalyticsStore.test.ts` | E4 — 扩展趋势测试 | ✅ 存在（需扩展） |
| `AnalyticsTrendChart.tsx` | `src/components/dds/analytics/AnalyticsTrendChart.tsx` | E4 — 新建趋势图表 | ❌ 缺失（目标文件） |
| `TemplateGallery.tsx` | `src/components/dds/templates/TemplateGallery.tsx` | E5 — 预览按钮触发 | ✅ 存在 |
| `TemplatePreviewPanel.tsx` | `src/components/dds/templates/TemplatePreviewPanel.tsx` | E5 — 新建预览面板 | ❌ 缺失（目标文件） |
| `templateStore.ts` | `src/stores/dds/templateStore.ts` | E5 — importTemplate 集成 | ✅ 存在（需扩展 getTemplateNodes） |

## Epic E1: 画布历史管理面板

### 架构决策
1. **HistoryPanel 作为 HistoryPanel Tab6**：复用现有 HistoryPanel 组件框架，添加 Tab6 专门展示快照列表。
2. **Store 驱动 UI**：HistoryPanel 直接订阅 `canvasHistoryStore.snapshots`，无需中间 state。
3. **快照命名 inline edit**：使用 `<input>` 可编辑文本框，点击触发编辑状态。

### 跨 Epic 集成点
- E1 快照恢复 → 影响当前画布状态 → 需通知 `canvasStore` 刷新
- E1 历史状态与 E3 RemoteCursors 无冲突（独立子系统）

---

## Epic E2: BatchOps 批量操作面板

### 架构决策
1. **BatchOpsPanel 是最终确认 UI**：BatchOpsToolbar 提供快捷操作，BatchOpsPanel 提供完整确认流程。
2. **Store 作为单一数据源**：`batchOpsStore.selectedIds` 是唯一数据源，toolbar 和 panel 都订阅同一 store。
3. **Drawer 模式**：BatchOpsPanel 使用 Drawer 形式，不阻塞主界面。

### 跨 Epic 集成点
- E2 批量导出 → 复用 E4 analytics export 基础设施（如 CSV generator）
- E2 批量移动 → 调用 `canvasListStore.moveCanvases(ids, folderId)`

---

## Epic E3: 协作 Presence 统一 Store

### 架构决策
1. **Zustand + localStorage persist**：与 `canvasAnalyticsStore` 保持一致的技术选型。
2. **Map 结构存储 remote users**：`remoteCursors: Map<odID, CursorData>` 支持 O(1) 更新。
3. **WS 事件 → store actions**：WS handler 调用 store actions，而非组件直接订阅 WS。
4. **RemoteCursorsLayer 重构**：移除直接 WS 订阅，改为 `usePresenceStore(s => s.remoteCursors)`。

### 数据结构
```typescript
interface CursorData {
  x: number;
  y: number;
  color: string;
  timestamp: number;
}
interface RemoteUser {
  odID: string;
  name: string;
  avatar: string;
  color: string;
  activeNodes: string[];
  cursor?: CursorData;
}
```

### 跨 Epic 集成点
- E3 RemoteCursors → E2 无冲突（独立层）
- E3 presence 数据 → E4 analytics 无直接依赖

---

## Epic E4: Analytics 趋势可视化

### 架构决策
1. **CSS Bar Chart**：避免引入外部图表库，使用纯 CSS + div 渲染。
2. **每日自动归档**：通过 `setInterval` 或 `useEffect` 在每日 0 点触发 `archiveHistory()`。
3. **localStorage 分享**：分享数据通过 `shareId` 映射存储，不上传服务器。

### 扩展 `canvasAnalyticsStore`
```typescript
interface AnalyticsEntry {
  date: string; // YYYY-MM-DD
  totalEdits: number;
  nodeEdits: number;
  topNodes: { id: string; edits: number }[];
}
// 扩展 state
history: AnalyticsEntry[];
archiveHistory(): void;
getHistory(range: '7d' | '30d'): AnalyticsEntry[];
shareAnalytics(): string; // returns shareId
```

### 跨 Epic 集成点
- E4 导出 CSV → E2 批量导出共享 CSV generator 逻辑

---

## Epic E5: 模板预览模式

### 架构决策
1. **Drawer 形式预览**：`TemplatePreviewPanel` 以 Drawer 展示，不切换页面。
2. **轻量节点树**：不使用完整的 `DDSDrawflow` 渲染器，而是 `TemplateNodeTree` 组件展示节点层级结构。
3. **模板节点数据**：`templateStore.getTemplateNodes(templateId)` 返回节点元数据列表。

### 节点数据结构
```typescript
interface TemplateNode {
  id: string;
  type: 'chapter' | 'section' | 'flow' | 'node';
  name: string;
  inEdges: number;
  outEdges: number;
}
```

### 跨 Epic 集成点
- E5 导入 → 调用 `templateStore.importTemplate(templateId)`（已有）
- E5 预览数据 → 可复用 `templateStore.templateCache`（如有）

---

## 技术风险与缓解

| 风险 | 缓解 |
|------|------|
| canvasHistoryStore API 复杂度高 | 先写测试验证 snapshot 相关 API |
| presenceStore WS 时序竞争 | zustand/immer 保证不可变更新 |
| BatchOpsPanel 与 toolbar 状态同步 | batchOpsStore 单一数据源 |
| Analytics history 归档时机 | 每日0点 + app 启动时双重检查 |
