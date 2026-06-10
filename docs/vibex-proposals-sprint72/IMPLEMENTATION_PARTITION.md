# VibeX Sprint72 实现分区文档

## 新增/扩展文件总览

| 文件 | 操作 | 所属 Epic | 说明 |
|------|------|-----------|------|
| `src/components/dds/canvas/HistoryPanel.tsx` | **新增** | E1 | Tab6 快照列表面板 |
| `src/components/dds/canvas/__tests__/HistoryPanel.test.tsx` | **新增** | E1 | HistoryPanel 组件测试 |
| `src/stores/dds/__tests__/canvasHistoryStore.snapshots.test.ts` | **新增** | E1 | 快照相关 store 测试 |
| `src/components/dds/batch-ops/BatchOpsPanel.tsx` | **新增** | E2 | 批量操作确认面板 |
| `src/components/dds/batch-ops/__tests__/BatchOpsPanel.test.tsx` | **新增** | E2 | BatchOpsPanel 组件测试 |
| `src/stores/dds/__tests__/batchOpsStore.extended.test.ts` | **新增** | E2 | 扩展 batchOpsStore 测试 |
| `src/stores/dds/presenceStore.ts` | **新增** | E3 | 统一 presence store |
| `src/stores/dds/__tests__/presenceStore.test.ts` | **新增** | E3 | presenceStore 单元测试 |
| `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` | **扩展** | E3 | 重构为 presenceStore 驱动 |
| `src/components/dds/canvas-dashboard/__tests__/RemoteCursorsLayer.test.tsx` | **新增** | E3 | RemoteCursorsLayer 重构测试 |
| `src/stores/dds/canvasAnalyticsStore.ts` | **扩展** | E4 | 增加 history + getHistory + shareAnalytics |
| `src/components/dds/analytics/AnalyticsTrendChart.tsx` | **新增** | E4 | CSS bar chart 趋势图 |
| `src/components/dds/analytics/__tests__/AnalyticsTrendChart.test.tsx` | **新增** | E4 | 趋势图组件测试 |
| `src/components/dds/templates/TemplatePreviewPanel.tsx` | **新增** | E5 | 模板预览抽屉 |
| `src/stores/dds/templateStore.ts` | **扩展** | E5 | 增加 getTemplateNodes() |
| `src/components/dds/templates/__tests__/TemplatePreviewPanel.test.tsx` | **新增** | E5 | 模板预览组件测试 |

---

## E1 DoD 清单

### E1.1 HistoryPanel.tsx 快照列表组件
- [ ] `src/components/dds/canvas/HistoryPanel.tsx` 新建
- [ ] 调用 `canvasHistoryStore(s => s.snapshots)` 渲染列表
- [ ] 每个快照行显示时间戳 + 恢复/删除按钮
- [ ] 空状态显示"暂无快照"文案
- [ ] 快照数量 ≥ 0 时正确渲染

### E1.2 快照恢复集成
- [ ] "恢复"按钮 → `canvasHistoryStore.restoreSnapshot(id)`
- [ ] 恢复后 UI 自动刷新（store subscription）

### E1.3 快照命名
- [ ] 支持点击编辑快照名称（inline input）
- [ ] 调用 `canvasHistoryStore.renameSnapshot(id, name)`

### E1.4 canvasHistoryStore 快照测试
- [ ] `canvasHistoryStore.snapshots.test.ts` 新建
- [ ] `saveSnapshot` 后 snapshots.length 增加
- [ ] `restoreSnapshot` 后 currentSnapshotId 正确
- [ ] `renameSnapshot` 更新后名称匹配

### E1.5 HistoryPanel 组件测试
- [ ] `HistoryPanel.test.tsx` 新建
- [ ] 快照列表渲染正确数量
- [ ] 点击"恢复"触发 `restoreSnapshot`
- [ ] 空状态显示正确

**vitest 目标**: `canvasHistoryStore.snapshots.test.ts` + `HistoryPanel.test.tsx` ≥ 10 通过

---

## E2 DoD 清单

### E2.1 BatchOpsPanel.tsx 主组件
- [ ] `src/components/dds/batch-ops/BatchOpsPanel.tsx` 新建
- [ ] Drawer/Modal 形式显示已选模板列表
- [ ] 显示 id/名称/缩略图
- [ ] 包含"批量删除"/"移动到文件夹"/"批量导出"按钮

### E2.2 批量删除
- [ ] "删除"按钮 → 确认弹窗 → `batchOpsStore.deleteSelected()`
- [ ] 删除后清空选择并关闭面板

### E2.3 批量移动
- [ ] "移动到文件夹" → 文件夹选择器 → `batchOpsStore.moveSelectedTo(folderId)`
- [ ] 移动后刷新列表

### E2.4 批量导出
- [ ] "导出"按钮 → `batchOpsStore.exportSelected(format)`
- [ ] 支持 CSV 和 JSON 格式

### E2.5 batchOpsStore 测试扩展
- [ ] `batchOpsStore.extended.test.ts` 新建
- [ ] `selectAll()` 后 selectedIds.length 正确
- [ ] `clearSelection()` 后 selectedIds.length === 0
- [ ] `deleteSelected()` 验证删除数量
- [ ] `moveSelectedTo(folderId)` 验证移动正确

### E2.6 BatchOpsPanel 组件测试
- [ ] `BatchOpsPanel.test.tsx` 新建
- [ ] 面板打开显示已选数量
- [ ] 批量删除确认流程
- [ ] 批量移动到文件夹流程

**vitest 目标**: `batchOpsStore.extended.test.ts` + `BatchOpsPanel.test.tsx` ≥ 10 通过

---

## E3 DoD 清单

### E3.1 presenceStore.ts 新建
- [ ] `src/stores/dds/presenceStore.ts` 新建
- [ ] Zustand + localStorage persist
- [ ] `remoteCursors: Map<odID, CursorData>`
- [ ] `remoteUsers: Map<odID, RemoteUser>`
- [ ] Actions: `updateCursor / updateUser / removeUser / clearAll`

### E3.2 WS 集成
- [ ] `onCursorMove` → `presenceStore.updateCursor(odID, cursor)`
- [ ] `onUserJoin` → `presenceStore.updateUser(odID, user)`
- [ ] `onUserLeave` → `presenceStore.removeUser(odID)`

### E3.3 RemoteCursorsLayer 重构
- [ ] 从 `presenceStore.remoteCursors` 读取游标数据
- [ ] 移除直接 WS 数据订阅
- [ ] 使用 `usePresenceStore(s => s.remoteCursors)` selector

### E3.4 presenceStore 测试
- [ ] `src/stores/dds/__tests__/presenceStore.test.ts` 新建
- [ ] `updateCursor` 后 `remoteCursors.has(odID)` === true
- [ ] `removeUser` 后 `remoteCursors.has(odID)` === false
- [ ] `clearAll` 后两个 Map 均为空

### E3.5 RemoteCursorsLayer 重构测试
- [ ] `RemoteCursorsLayer.test.tsx` 新建
- [ ] 验证从 presenceStore 读取数据

**vitest 目标**: `presenceStore.test.ts` + `RemoteCursorsLayer.test.tsx` ≥ 8 通过

---

## E4 DoD 清单

### E4.1 canvasAnalyticsStore 历史归档扩展
- [ ] `history: AnalyticsEntry[]` 数组支持
- [ ] `archiveHistory()` 每日归档当前统计
- [ ] `getHistory('7d'|'30d')` 返回指定范围 entries

### E4.2 AnalyticsTrendChart.tsx 趋势图表
- [ ] `src/components/dds/analytics/AnalyticsTrendChart.tsx` 新建
- [ ] CSS bar chart 渲染7日/30日数据
- [ ] 无外部图表库依赖
- [ ] 支持 "7天" / "30天" 切换

### E4.3 趋势分享
- [ ] `shareAnalytics()` 生成 shareId
- [ ] localStorage 存储分享数据
- [ ] 分享 URL 可访问（路由支持）

### E4.4 多格式导出扩展
- [ ] `exportAnalytics()` 支持 CSV 和 JSON 格式
- [ ] JSON 包含 `history` 时间序列数据

### E4.5 canvasAnalyticsStore 测试扩展
- [ ] `canvasAnalyticsStore.test.ts` 扩展 history 相关测试
- [ ] `archiveHistory()` 后 history.length 增加
- [ ] `getHistory('7d')` 返回 ≤7 天数据

### E4.6 AnalyticsTrendChart 组件测试
- [ ] `AnalyticsTrendChart.test.tsx` 新建
- [ ] 7天数据正确渲染 7 个 bar
- [ ] 30天数据正确渲染 30 个 bar

**vitest 目标**: `canvasAnalyticsStore.test.ts` (扩展) + `AnalyticsTrendChart.test.tsx` ≥ 8 通过

---

## E5 DoD 清单

### E5.1 TemplatePreviewPanel.tsx 主组件
- [ ] `src/components/dds/templates/TemplatePreviewPanel.tsx` 新建
- [ ] Drawer 形式显示模板节点树
- [ ] 显示节点名称/类型/连接关系

### E5.2 节点详情
- [ ] 点击节点显示详情（类型/内容/入边/出边数量）

### E5.3 导入集成
- [ ] "导入"按钮 → `templateStore.importTemplate(templateId)`
- [ ] 导入后关闭面板并刷新

### E5.4 templateStore 扩展
- [ ] `templateStore.ts` 增加 `getTemplateNodes(templateId)` 方法
- [ ] 返回 `TemplateNode[]` 数组

### E5.5 TemplatePreviewPanel 组件测试
- [ ] `TemplatePreviewPanel.test.tsx` 新建
- [ ] 面板打开显示节点列表
- [ ] 点击节点显示详情
- [ ] "导入"按钮触发 `importTemplate`

**vitest 目标**: `TemplatePreviewPanel.test.tsx` ≥ 8 通过

---

## 测试执行命令

```bash
# E1: HistoryPanel + canvasHistoryStore snapshots
npx vitest run canvasHistoryStore.snapshots HistoryPanel   --reporter=verbose

# E2: BatchOpsPanel + batchOpsStore extended
npx vitest run batchOpsStore.extended BatchOpsPanel   --reporter=verbose

# E3: presenceStore + RemoteCursorsLayer
npx vitest run presenceStore RemoteCursorsLayer   --reporter=verbose

# E4: canvasAnalyticsStore history + AnalyticsTrendChart
npx vitest run canvasAnalyticsStore AnalyticsTrendChart   --reporter=verbose

# E5: TemplatePreviewPanel
npx vitest run TemplatePreviewPanel   --reporter=verbose

# 全量 sprint72 测试
npx vitest run   --reporter=verbose
```

---

## 开发顺序建议

1. **E3 (presenceStore)** → E3 是基础设施，E1/E2 面板可复用其他 store
2. **E1 (HistoryPanel)** → 独立面板，依赖 canvasHistoryStore
3. **E2 (BatchOpsPanel)** → 独立面板，依赖 batchOpsStore
4. **E4 (AnalyticsTrendChart)** → 依赖 canvasAnalyticsStore 扩展
5. **E5 (TemplatePreviewPanel)** → 依赖 templateStore 扩展

---

## 验收门槛

| Epic | 最低测试数 | 核心测试文件 |
|------|----------|------------|
| E1 | 10 | `canvasHistoryStore.snapshots.test.ts` + `HistoryPanel.test.tsx` |
| E2 | 10 | `batchOpsStore.extended.test.ts` + `BatchOpsPanel.test.tsx` |
| E3 | 8 | `presenceStore.test.ts` + `RemoteCursorsLayer.test.tsx` |
| E4 | 8 | `canvasAnalyticsStore.test.ts` (扩展) + `AnalyticsTrendChart.test.tsx` |
| E5 | 8 | `TemplatePreviewPanel.test.tsx` |
