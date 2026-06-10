# S68 PRD：VibeX Sprint68 产品需求文档

**项目**: vibex-proposals-sprint68
**日期**: 2026-06-06
**版本**: 1.0

---

## 执行摘要

S68 聚焦 5 个 Epic，覆盖模板生态闭环（导出/评分）、协作感知基础设施（@提及+通知）、搜索深化（全文节点搜索）、批量操作（跨画布复制）、实时协作体验（光标同步）。总工期预计与 S67 持平（5 Epic × 3 周并行开发）。

| Epic | 功能 | 优先级 | 依赖 |
|------|------|--------|------|
| E1 | 模板画廊增强（导出/评分） | P0 | 无 |
| E2 | @提及通知系统 | P0 | 无 |
| E3 | 全局画布全文搜索 | P1 | E1（共享模板存储） |
| E4 | 画布批量操作增强 | P1 | 无 |
| E5 | 协作感知增强（光标同步） | P1 | E2（通知系统） |

---

## E1：模板画廊增强（导出/评分）

### 概述
为模板画廊添加导出/导入 JSON 格式能力和用户评分/收藏体系，使模板系统从"只进不出"变为可分享的开放生态。

### DoD Checklist
- [ ] `templateExporter.ts` 导出函数完成，生成标准 JSON
- [ ] `templateImporter.ts` 导入函数完成，含去重逻辑
- [ ] `templateStore.ts` 新增 `favoriteTemplates`、`templateRatings`、`exportTemplate`、`importTemplate`
- [ ] `TemplateGallery.tsx` 新增收藏星标 UI（★图标）
- [ ] `TemplateExportDialog.tsx` 导出预览 + 下载按钮
- [ ] `TemplateImportDialog.tsx` 导入选择 + 冲突处理 UI
- [ ] vitest: templateStore E1 测试 ≥ 5 个，全部通过
- [ ] CHANGELOG 双写完成

### expect() 断言模式
```typescript
expect(store.templates).toHaveLength(n + 1)
expect(store.exportTemplate(templateId)).toMatchObject({ id: expect.any(String), nodes: expect.any(Array) })
const imported = store.importTemplate(exportedJson)
expect(imported.id).not.toBe(originalId) // 去重后新ID
```

### 新增/扩展文件
- `src/services/templateExporter.ts` (new)
- `src/services/templateImporter.ts` (new)
- `src/stores/templateStore.ts` (extend — exportTemplate/importTemplate/favorites)
- `src/components/dds/templates/TemplateExportDialog.tsx` (new)
- `src/components/dds/templates/TemplateImportDialog.tsx` (new)
- `src/components/dds/templates/__tests__/TemplateExportDialog.test.tsx` (new)

---

## E2：@提及通知系统

### 概述
在协作者活动流基础上添加 @提及能力 + 通知中心，使协作者之间可以主动沟通且不依赖页面在线状态。

### DoD Checklist
- [ ] `notificationStore.ts` 完成：通知列表 CRUD、isRead 状态
- [ ] `wsNotificationHandler.ts` 处理 `notification:*` 消息
- [ ] `MentionInput.tsx` 完成 @ 自动补全（输入 @ 后显示用户列表）
- [ ] `NotificationPanel.tsx` 通知中心面板（未读红点、分页）
- [ ] `DDSToolbar.tsx` 通知铃铛按钮集成
- [ ] 活动流评论输入框替换为 MentionInput
- [ ] vitest: notificationStore 测试 ≥ 6 个，全部通过
- [ ] CHANGELOG 双写完成

### expect() 断言模式
```typescript
expect(store.notifications).toHaveLength(1)
expect(store.notifications[0].isRead).toBe(false)
expect(store.notifications[0].type).toBe('mention')
store.markAsRead(notificationId)
expect(store.getUnreadCount()).toBe(0)
```

### 新增/扩展文件
- `src/stores/notificationStore.ts` (new)
- `src/services/wsNotificationHandler.ts` (new)
- `src/components/dds/collaboration/MentionInput.tsx` (new)
- `src/components/dds/notifications/NotificationPanel.tsx` (new)
- `src/components/dds/notifications/__tests__/NotificationPanel.test.tsx` (new)
- `src/stores/notificationStore.test.ts` (new)

---

## E3：全局画布全文搜索

### 概述
将画布搜索从"名称模糊匹配"扩展到"节点内容全文搜索"，支持跨画布内容检索和跳转高亮。

### DoD Checklist
- [ ] `canvasFulltextIndex.ts` 节点内容索引服务完成
- [ ] `canvasDb.ts` 新增 `saveNodeContentIndex` / `searchNodeContent` 方法
- [ ] `canvasFulltextStore.ts` 搜索状态管理
- [ ] `GlobalSearchPanel.tsx` 新增"节点内容"搜索 Tab
- [ ] 搜索结果点击 → 跳转画布 + 高亮匹配节点
- [ ] 搜索历史记录（MAX 10）
- [ ] vitest: fulltext search 测试 ≥ 5 个，全部通过
- [ ] CHANGELOG 双写完成

### expect() 断言模式
```typescript
await indexer.saveNodeContentIndex(canvasId, nodes)
const results = await db.searchNodeContent('关键词')
expect(results).toContainEqual(expect.objectContaining({ canvasId, nodeId: expect.any(String) }))
expect(results[0].score).toBeGreaterThan(0)
```

### 新增/扩展文件
- `src/services/canvasFulltextIndex.ts` (new)
- `src/services/canvasDb.ts` (extend — searchNodeContent)
- `src/stores/canvasFulltextStore.ts` (new)
- `src/stores/canvasFulltextStore.test.ts` (new)

---

## E4：画布批量操作增强

### 概述
在 S64-E4 批量重命名/归档基础上，添加跨画布节点复制/移动和批量模板化能力，完善多画布工作流。

### DoD Checklist
- [ ] `canvasListStore.ts` 新增 `copyNodesBetweenCanvases` 方法（含边复制）
- [ ] `canvasListStore.ts` 新增 `batchTemplateExport` 方法
- [ ] `CrossCanvasCopyDialog.tsx` 跨画布复制目标选择 UI
- [ ] `BatchDeleteConfirmDialog.tsx` 批量删除二次确认（含预览）
- [ ] `BatchOpsToolbar.tsx` 新增"复制到画布"/"模板化"按钮
- [ ] vitest: canvasListStore 跨画布测试 ≥ 4 个，全部通过
- [ ] CHANGELOG 双写完成

### expect() 断言模式
```typescript
const result = store.copyNodesBetweenCanvases(srcId, [nodeId1, nodeId2], destId)
expect(result.copiedNodes).toHaveLength(2)
expect(result.copiedEdges).toBeGreaterThanOrEqual(1) // 含关系边
```

### 新增/扩展文件
- `src/stores/canvasListStore.ts` (extend — copyNodesBetweenCanvases/batchTemplateExport)
- `src/components/dds/canvas-dashboard/CrossCanvasCopyDialog.tsx` (new)
- `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.tsx` (new)
- `src/stores/canvasListStore.e4.test.ts` (new)

---

## E5：协作感知增强（光标同步）

### 概述
在 S64-E1 在线状态 + S65-E2 节点聚焦基础上，实现协作者光标实时位置同步，打造真正的多人实时协作体验。

### DoD Checklist
- [ ] `presenceStore.ts` 新增 `cursors` Record + `broadcastCursor` / `clearCursor` actions
- [ ] `wsCursorHandler.ts` 处理 `cursor:move` 消息
- [ ] `CursorOverlay.tsx` 协作者光标渲染（含用户名标签、彩色箭头）
- [ ] `DDSCanvasPage.tsx` 集成 CursorOverlay + `onMouseMove` 节流广播（≤ 50ms/次）
- [ ] 协作者离开/断线时光标自动消失（≤ 3s）
- [ ] 同时 ≥ 3 个协作者光标共存互不干扰
- [ ] vitest: cursor sync 测试 ≥ 5 个，全部通过
- [ ] CHANGELOG 双写完成

### expect() 断言模式
```typescript
store.broadcastCursor({ userId: 'u1', x: 100, y: 200, nodeId: 'node1' })
expect(store.cursors['u1']).toMatchObject({ x: 100, y: 200 })
store.clearCursor('u1')
expect(store.cursors['u1']).toBeUndefined()
```

### 新增/扩展文件
- `src/stores/presenceStore.ts` (extend — cursors/broadcastCursor/clearCursor)
- `src/services/wsCursorHandler.ts` (new)
- `src/components/dds/canvas/CursorOverlay.tsx` (new)
- `src/components/dds/canvas/__tests__/CursorOverlay.test.tsx` (new)
- `src/stores/presenceStore.cursor.test.ts` (new)

---

## 跨 Epic 集成表

| 集成点 | E1 → E2 | E1 → E3 | E2 → E5 |
|--------|----------|----------|---------|
| 模板可被通知分享 | ✅ MentionInput 提及模板 | ✅ 模板全文索引 | — |
| 通知中心 UI | — | — | ✅ NotificationPanel 复用 |
| WebSocket 复用 | — | — | cursor 用同一 ws 连接 |

---

## 技术风险表

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| 全文搜索索引性能（大画布 1000+ 节点） | 高 | 增量索引 + Web Worker 后台处理 |
| WebSocket 光标广播频率过高 | 中 | 节流 ≤ 50ms + 仅可视区域节点广播 |
| 跨画布节点复制 ID 冲突 | 中 | 导入时生成新 UUID，保持边关系映射 |
| @提及用户不在线 | 低 | 通知持久化至 IndexedDB，重连后拉取 |

---

## 质量阈值

- 所有 Epic vitest 通过率 ≥ 95%
- E2/E5 WebSocket 测试 mock 覆盖完整
- E3 全文搜索在 500 节点画布上 < 500ms
- E4 跨画布复制 ≤ 50 节点/次
