# S68 IMPLEMENTATION_PARTITION.md

**项目**: vibex-proposals-sprint68
**日期**: 2026-06-06

---

## E1：模板画廊增强（导出/评分）

### DoD Checklist
- [ ] `src/services/templateExporter.ts` 导出函数完成，生成标准 JSON（含元信息）
- [ ] `src/services/templateImporter.ts` 导入函数完成，含 Schema 验证 + 去重逻辑
- [ ] `src/stores/templateStore.ts` 新增 `favoriteTemplates`、`templateRatings`、`exportTemplate`、`importTemplate`、`toggleFavorite`、`rateTemplate`
- [ ] `src/components/dds/templates/TemplateGallery.tsx` 新增收藏星标 UI（★图标，点击切换）+ 导出/导入按钮
- [ ] `src/components/dds/templates/TemplateExportDialog.tsx` 导出预览 + JSON 下载按钮（复用 ExportDialog 样式）
- [ ] `src/components/dds/templates/TemplateImportDialog.tsx` 文件选择 + 冲突处理 UI
- [ ] vitest: `src/stores/templateStore.test.ts` E1 测试 ≥ 5 个，全部通过

### 新增/扩展文件
- `src/services/templateExporter.ts` **(new)** — 复用 ZipExporter，导出模板 JSON
- `src/services/templateImporter.ts` **(new)** — 解析 + 验证 + 去重导入
- `src/stores/templateStore.ts` **(extend)** — + exportTemplate/importTemplate/favorites/ratings
- `src/components/dds/templates/TemplateExportDialog.tsx` **(new)**
- `src/components/dds/templates/TemplateImportDialog.tsx` **(new)**

---

## E2：@提及通知系统

### DoD Checklist
- [ ] `src/stores/notificationStore.ts` 完成：通知列表 CRUD、isRead 状态、unreadCount
- [ ] `src/services/wsNotificationHandler.ts` 处理 `notification:*` 消息（new/update/read）
- [ ] `src/components/dds/collaboration/MentionInput.tsx` @ 自动补全（@ 后显示用户列表，点击补全）
- [ ] `src/components/dds/notifications/NotificationPanel.tsx` 通知中心面板（未读红点、分页、标记已读）
- [ ] `src/components/dds/toolbar/DDSToolbar.tsx` 添加通知铃铛按钮
- [ ] `src/components/dds/collab/CollabActivityPanel.tsx` 输入框替换为 MentionInput
- [ ] vitest: `src/stores/notificationStore.test.ts` ≥ 6 个，全部通过

### 新增/扩展文件
- `src/stores/notificationStore.ts` **(new)** — Zustand store
- `src/services/wsNotificationHandler.ts` **(new)** — WebSocket 消息处理
- `src/components/dds/collaboration/MentionInput.tsx` **(new)** — @ 自动完成
- `src/components/dds/notifications/NotificationPanel.tsx` **(new)**
- `src/components/dds/toolbar/DDSToolbar.tsx` **(extend)** — + 铃铛按钮

---

## E3：全局画布全文搜索

### DoD Checklist
- [ ] `src/services/canvasFulltextIndex.ts` 节点内容索引（Web Worker + Fuse.js）
- [ ] `src/stores/dds/canvasSearchStore.ts` 新增 `fulltextQuery`、`fulltextResults`、`searchNodeContent()`
- [ ] `src/components/dds/search/GlobalSearchPanel.tsx` 新增"节点内容"搜索 Tab（与画布名称 Tab 并列）
- [ ] 搜索结果点击 → 跳转画布 + 高亮匹配节点（`highlightNode(nodeId)`）
- [ ] 搜索历史记录（MAX 10，存 localStorage）
- [ ] vitest: `src/stores/dds/__tests__/canvasSearchStore.test.ts` ≥ 5 个，全部通过

### 新增/扩展文件
- `src/services/canvasFulltextIndex.ts` **(new)** — Web Worker 索引服务
- `src/stores/dds/canvasSearchStore.ts` **(extend)** — + fulltext search state + searchNodeContent
- `src/components/dds/search/GlobalSearchPanel.tsx` **(extend)** — + 节点内容 Tab

---

## E4：画布批量操作增强

### DoD Checklist
- [ ] `src/stores/canvasListStore.ts` 新增 `copyNodesBetweenCanvases(srcId, nodeIds, destId)` 方法（含 ID 映射 + 边重建）
- [ ] `src/stores/canvasListStore.ts` 新增 `batchTemplateExport(nodeIds)` 方法
- [ ] `src/components/dds/canvas-dashboard/CrossCanvasCopyDialog.tsx` 目标画布选择 UI（含预览）
- [ ] `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.tsx` 批量删除二次确认（节点数量预览）
- [ ] `src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` 新增"复制到画布"/"批量模板化"按钮
- [ ] vitest: `src/stores/dds/__tests__/canvasListStore.batchOps.test.ts` ≥ 4 个，全部通过

### 新增/扩展文件
- `src/stores/canvasListStore.ts` **(extend)** — + copyNodesBetweenCanvases / batchTemplateExport
- `src/components/dds/canvas-dashboard/CrossCanvasCopyDialog.tsx` **(new)**
- `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.tsx` **(new)**
- `src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` **(extend)** — + 按钮

---

## E5：协作感知增强（光标同步）

### DoD Checklist
- [ ] `src/stores/dds/presenceStore.ts` 新增 `cursors` (Record<userId, CursorState>) + `broadcastCursor()` + `clearCursor()`
- [ ] `src/services/wsCursorHandler.ts` 处理 `cursor:move` WebSocket 消息
- [ ] `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` 订阅 `presenceStore.cursors` 实现实时光标更新
- [ ] `src/components/dds/DDSCanvasPage.tsx` `onMouseMove` 节流广播（≤ 50ms/次）
- [ ] 协作者离开/断线时光标自动消失（`wsCursorHandler` 监听 close 事件 → `clearCursor`）
- [ ] 同时 ≥ 3 个协作者光标共存（多用户 Record 互不覆盖）
- [ ] vitest: `src/stores/dds/__tests__/presenceStore.test.ts` ≥ 5 个，全部通过

### 新增/扩展文件
- `src/stores/dds/presenceStore.ts` **(extend)** — + cursors/broadcastCursor/clearCursor
- `src/services/wsCursorHandler.ts` **(new)** — WebSocket 消息处理
- `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` **(extend)** — + 实时同步
- `src/components/dds/DDSCanvasPage.tsx` **(extend)** — + onMouseMove 广播

---

## 验收测试汇总

| Epic | 测试文件 | 最小通过数 |
|------|---------|-----------|
| E1 | `templateStore.test.ts` | ≥ 5 |
| E2 | `notificationStore.test.ts` | ≥ 6 |
| E3 | `canvasSearchStore.test.ts` | ≥ 5 |
| E4 | `canvasListStore.batchOps.test.ts` | ≥ 4 |
| E5 | `presenceStore.test.ts` | ≥ 5 |
