# VibeX Sprint72 产品需求文档

## 执行摘要

| Epic | 功能 | 优先级 | 状态 |
|------|------|--------|------|
| E1 | 画布历史管理面板 — 快照浏览与恢复 | P0 | 待开发 |
| E2 | BatchOps 批量操作面板 — 一站式多模板管理 | P0 | 待开发 |
| E3 | 协作 Presence 统一 Store — 用户状态与游标同步 | P1 | 待开发 |
| E4 | Analytics 趋势可视化 — 时间序列图表与分享 | P1 | 待开发 |
| E5 | 模板预览模式 — 画布内容级预览 | P2 | 待开发 |

---

## E1: 画布历史管理面板

### 功能描述
为 `canvasHistoryStore.ts` (35648字节，命令模式 undo/redo) 添加 `HistoryPanel` UI 层，支持快照浏览、命名、恢复。

### DoD (Definition of Done)

**E1.1** `HistoryPanel.tsx` 快照列表组件
- `HistoryPanel.tsx` 位于 `src/components/dds/canvas-history/`
- 调用 `canvasHistoryStore.getState().snapshots` 渲染列表
- 每个快照行显示：时间戳 + 操作按钮（恢复/删除）
- 空状态显示"暂无快照"文案

**E1.2** 快照恢复集成
- "恢复"按钮调用 `canvasHistoryStore.restoreSnapshot(snapshot.id)`
- 恢复后 HistoryPanel 列表自动刷新

**E1.3** 快照命名
- 支持点击编辑快照名称（inline edit）
- 调用 `canvasHistoryStore.renameSnapshot(id, name)`

**E1.4** `canvasHistoryStore.snapshots.test.ts` 单元测试
- `saveSnapshot` 保存后 `snapshots.length` 增加
- `restoreSnapshot` 恢复后 `currentSnapshotId` 正确
- `renameSnapshot` 更新后 `snapshots` 中名称匹配

**E1.5** `HistoryPanel.test.tsx` 组件测试
- 快照列表渲染正确数量
- 点击"恢复"触发 `restoreSnapshot`
- 空状态显示正确

### 页面集成
- `HistoryPanel.tsx` 作为 HistoryPanel 的 Tab6（或独立面板），由 DDSDrawflow 容器引用

### expect() 验收断言
```typescript
// store 测试
const state = canvasHistoryStore.getState();
expect(state.snapshots.length).toBeGreaterThan(0);
state.saveSnapshot();
expect(state.snapshots.length).toBe(initial + 1);
state.restoreSnapshot(snapshots[0].id);
expect(state.currentSnapshotId).toBe(snapshots[0].id);

// 组件测试
render(<HistoryPanel />);
expect(screen.getByText('暂无快照').exists).toBeFalsy();
expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
```

---

## E2: BatchOps 批量操作面板

### 功能描述
为 `batchOpsStore.ts` 添 BatchOps 确认面板，支持批量删除、移动到文件夹、批量导出操作。

### DoD (Definition of Done)

**E2.1** `BatchOpsPanel.tsx` 主组件
- 位于 `src/components/dds/batch-ops/BatchOpsPanel.tsx`
- 以 Drawer/Modal 形式显示已选模板列表（id/名称/缩略图）
- 包含"批量删除"/"移动到文件夹"/"批量导出"操作按钮

**E2.2** 批量删除
- "删除"按钮 → 确认弹窗 → 调用 `batchOpsStore.deleteSelected()`
- 删除后清空选择并关闭面板

**E2.3** 批量移动
- "移动到文件夹"按钮 → 文件夹选择器 → 调用 `batchOpsStore.moveSelectedTo(folderId)`
- 移动后刷新列表

**E2.4** 批量导出
- "导出"按钮 → 调用 `batchOpsStore.exportSelected(format)`
- 支持 CSV/JSON 格式

**E2.5** `batchOpsStore.test.ts` 扩展
- `selectAll()` → `selectedIds.length` 等于总模板数
- `clearSelection()` → `selectedIds.length === 0`
- `deleteSelected()` → 验证删除数量与 selectedIds 一致

**E2.6** `BatchOpsPanel.test.tsx` 组件测试
- 面板打开时显示已选数量
- 批量删除确认流程
- 批量移动到文件夹流程

### 页面集成
- `BatchOpsPanel` 由 `DDSToolbar` 的批量操作按钮触发
- 也可由 `TemplateGallery` 的多选模式触发

### expect() 验收断言
```typescript
batchOpsStore.getState().selectAll();
expect(batchOpsStore.getState().selectedIds.length).toBeGreaterThan(0);
batchOpsStore.deleteSelected();
expect(batchOpsStore.getState().selectedIds.length).toBe(0);

render(<BatchOpsPanel />);
expect(screen.getByText(/已选择 \d+ 项/)).toBeInTheDocument();
```

---

## E3: 协作 Presence 统一 Store

### 功能描述
整合 `RemoteCursorsLayer.tsx`、`PresenceIndicator.tsx`、`PresenceOverlay.tsx` 为统一 `presenceStore.ts` Zustand store。

### DoD (Definition of Done)

**E3.1** `presenceStore.ts` 新建
- 位于 `src/stores/dds/presenceStore.ts`
- Zustand + localStorage persist
- 数据结构：`remoteCursors: Map<odID, CursorData>` + `remoteUsers: Map<odID, RemoteUser>`
- Actions: `updateCursor(odID, cursor)` / `updateUser(odID, user)` / `removeUser(odID)` / `clearAll()`

**E3.2** WS 集成
- `onCursorMove` WS 事件 → `presenceStore.updateCursor(odID, cursor)`
- `onUserJoin` WS 事件 → `presenceStore.updateUser(odID, user)`
- `onUserLeave` WS 事件 → `presenceStore.removeUser(odID)`

**E3.3** `RemoteCursorsLayer` 重构
- 从 `presenceStore.remoteCursors` 读取游标数据
- 移除直接 WS 数据订阅，改用 `usePresenceStore(selector)`

**E3.4** `presenceStore.test.ts` 单元测试
- `updateCursor` 后 `remoteCursors.has(odID)`
- `removeUser` 后 `remoteUsers.has(odID)` 为 false
- `clearAll` 后两个 Map 均为空

### expect() 验收断言
```typescript
presenceStore.getState().updateCursor('od123', { x: 100, y: 200 });
expect(presenceStore.getState().remoteCursors.has('od123')).toBe(true);
presenceStore.getState().removeUser('od123');
expect(presenceStore.getState().remoteCursors.has('od123')).toBe(false);
```

---

## E4: Analytics 趋势可视化

### 功能描述
扩展 S71-E4 `canvasAnalyticsStore`，增加时间序列趋势图、数据分享、多格式导出。

### DoD (Definition of Done)

**E4.1** `canvasAnalyticsStore` 历史归档
- 扩展 `history: AnalyticsEntry[]` 数组（date + stats snapshot）
- 每日 0 点自动归档当日统计到 `history`
- `getHistory(range: '7d'|'30d')` 返回指定范围的 entries

**E4.2** `AnalyticsTrendChart.tsx` 趋势图表
- 位于 `src/components/dds/analytics/AnalyticsTrendChart.tsx`
- CSS bar chart 渲染7日/30日编辑次数
- 无外部图表库依赖

**E4.3** 趋势分享
- `shareAnalytics()` 生成 shareId 存入 localStorage
- 分享 URL 格式：`/analytics?share={shareId}`

**E4.4** 多格式导出
- `exportAnalytics()` 支持 `csv` 和 `json` 格式
- JSON 格式包含 `history` 时间序列数据

**E4.5** `canvasAnalyticsStore.test.ts` 扩展
- `history` 归档后 entries.length 增加
- `getHistory('7d')` 返回最近7天数据

### expect() 验收断言
```typescript
analyticsStore.getState().recordEdit();
analyticsStore.getState().archiveHistory();
expect(analyticsStore.getState().history.length).toBeGreaterThan(0);
const history = analyticsStore.getState().getHistory('7d');
expect(history.length).toBeLessThanOrEqual(7);
```

---

## E5: 模板预览模式

### 功能描述
为 `TemplateGallery.tsx` 添加画布内容级预览面板，支持查看模板节点结构后导入。

### DoD (Definition of Done)

**E5.1** `TemplatePreviewPanel.tsx` 主组件
- 位于 `src/components/dds/templates/TemplatePreviewPanel.tsx`
- Drawer 形式，显示模板节点树（名称/类型/连接关系）
- 复用 `DDSDrawflow` 或轻量 `TemplateNodeTree` 展示

**E5.2** 节点详情
- 点击节点显示详情（类型/内容摘要/入边/出边数量）

**E5.3** 导入集成
- "导入"按钮 → 调用 `templateStore.importTemplate(templateId)`
- 导入后关闭面板并刷新当前画布

**E5.4** `templateStore.preview.test.ts` 扩展
- `getTemplateNodes(templateId)` 返回节点数组

**E5.5** `TemplatePreviewPanel.test.tsx` 组件测试
- 面板打开显示节点列表
- 点击节点显示详情
- "导入"按钮触发 `importTemplate`

### 页面集成
- `TemplateGallery.tsx` 的"预览"按钮触发 `TemplatePreviewPanel`
- `TemplatePreviewPanel` 渲染于 `DDSPanel` 右侧抽屉

### expect() 验收断言
```typescript
const nodes = templateStore.getState().getTemplateNodes('tpl-001');
expect(nodes.length).toBeGreaterThan(0);

render(<TemplatePreviewPanel templateId="tpl-001" open={true} onClose={fn} />);
expect(screen.getByText(/节点 \d+/)).toBeInTheDocument();
```

---

## 跨 Epic 集成点

| 集成点 | 涉及 Epic | 说明 |
|--------|-----------|------|
| DDSToolbar | E2 | BatchOpsToolbar 触发 BatchOpsPanel |
| HistoryPanel | E1 | HistoryPanel Tab6 集成 |
| RemoteCursorsLayer | E3 | presenceStore 数据驱动 |
| TemplateGallery | E5 | 预览按钮触发 TemplatePreviewPanel |
| AnalyticsPanel Tab5 | E4 | 趋势子 Tab 集成 |

## 技术风险

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| canvasHistoryStore API 不稳定 | 高 | 先写 mock 测试验证接口契约 |
| presenceStore 与 WS 时序竞争 | 高 | zustand/immer 不可变更新 |
| BatchOpsPanel 与 toolbar 状态同步 | 中 | batchOpsStore 作为单一数据源 |
| Analytics trend chart 无图表库 | 低 | CSS bar chart 实现 |

## 验收标准总结

| Epic | 核心测试文件 | 最低通过数 |
|------|------------|-----------|
| E1 | `canvasHistoryStore.snapshots.test.ts` + `HistoryPanel.test.tsx` | 10 |
| E2 | `batchOpsStore.test.ts` + `BatchOpsPanel.test.tsx` | 10 |
| E3 | `presenceStore.test.ts` | 8 |
| E4 | `canvasAnalyticsStore.test.ts` (扩展) | 6 |
| E5 | `templateStore.preview.test.ts` + `TemplatePreviewPanel.test.tsx` | 8 |
