# S68 架构设计文档

**项目**: vibex-proposals-sprint68
**日期**: 2026-06-06
**架构师**: coord (self-impl)

---

## 1. 概述

S68 包含 5 个 Epic，分两个层级：
- **协作基础设施层**（E1 模板增强、E2 @通知、E5 光标同步）：强化协作生态
- **搜索与操作层**（E3 全文搜索、E4 批量操作）：提升效率工具

## 2. 现有资产映射

| Epic | 文件 | 状态 |
|------|------|------|
| E1 | `src/stores/templateStore.ts` | ✅ 已存在（需扩展 exportTemplate/importTemplate/favorites） |
| E1 | `src/components/dds/templates/TemplateGallery.tsx` | ✅ 已存在（需扩展导出/导入 UI） |
| E1 | `src/services/export/ZipExporter.ts` | ✅ 已存在（可复用为模板导出基础） |
| E2 | `src/stores/dds/mentionsStore.ts` | ⚠️ 部分存在（@提及存储已有，通知中心缺失） |
| E2 | `src/components/dds/collab/CollabActivityPanel.tsx` | ✅ 已存在（S67-E2） |
| E3 | `src/components/dds/search/GlobalSearchPanel.tsx` | ✅ 已存在（画布名称搜索，需扩展节点内容搜索） |
| E3 | `src/stores/dds/canvasSearchStore.ts` | ⚠️ 部分存在（canvas 名称搜索已有，全文索引缺失） |
| E4 | `src/stores/canvasListStore.ts` | ✅ 已存在（批量重命名/归档已有，跨画布复制缺失） |
| E4 | `src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` | ✅ 已存在（扩展按钮） |
| E5 | `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` | ✅ 已存在（仅渲染层，需广播层） |
| E5 | `src/stores/dds/settingsStore.ts` | ⚠️ presenceStore 不存在，presence 逻辑缺失 |

## 3. E1：模板画廊增强 — 架构决策

### 决策 1：复用 ZipExporter 而非新建
复用 `src/services/export/ZipExporter.ts` 作为模板 ZIP 导出基础，避免重复实现。
- `templateExporter.ts` → 调用 `ZipExporter` 压缩单个模板 JSON
- `templateImporter.ts` → 解压 ZIP + JSON.parse + validate

### 决策 2：模板存储复用 IndexedDB
复用现有的 `canvasDb` IndexedDB 存储模板数据，新增字段：
```typescript
// templateStore 中新增
interface StoredTemplate {
  id: string
  name: string
  nodes: SerializedNode[]
  edges: SerializedEdge[]
  tags: TemplateTag[]
  createdAt: number
  useCount: number
  favorites: string[] // userId[]
  ratings: Record<string, number> // userId → rating
}
```

### 决策 3：JSON Schema 验证
导入时使用 `zod` 做 Schema 验证，防止损坏模板破坏画布状态。

## 4. E2：@提及通知系统 — 架构决策

### 决策 1：通知存储独立化
`notificationStore.ts` 独立于 `mentionsStore.ts`：
- `mentionsStore` → 管理 @输入时用户列表（前端 UI 状态）
- `notificationStore` → 管理通知持久化（后端数据）

### 决策 2：WebSocket 消息协议
```typescript
// 新增协议
interface WsNotificationMessage {
  type: 'notification:new' | 'notification:read' | 'notification:clear'
  payload: {
    id: string
    senderId: string
    senderName: string
    message: string
    nodeId?: string
    canvasId?: string
    timestamp: number
  }
}
```

### 决策 3：NotificationPanel 独立入口
通知中心作为独立 Panel（抽屉式），与 CollabActivityPanel 并列。DDSToolbar 添加铃铛按钮。

### 决策 4：未读数广播
`unreadCount` 通过 `customEvent` 广播，DDSToolbar 铃铛按钮订阅更新角标。

## 5. E3：全局画布全文搜索 — 架构决策

### 决策 1：双层搜索架构
```
GlobalSearchPanel Tab1: 画布名称搜索 (已有 canvasDb.searchCanvases)
GlobalSearchPanel Tab2: 节点内容搜索 (新增 canvasFulltextIndex)
```

### 决策 2：全文索引服务
`canvasFulltextIndex.ts` 使用 Web Worker 避免阻塞主线程：
- 索引：遍历 canvasData.nodes → 提取所有 textContent → 存入 IndexedDB
- 搜索：Fuse.js 模糊搜索索引内容

### 决策 3：增量索引
仅在画布打开时索引当前画布，不做全局预索引。索引结果缓存（TTL = 1h）。

## 6. E4：画布批量操作增强 — 架构决策

### 决策 1：跨画布节点复制通过 API
调用 `api.canvas.copyNodesBetweenCanvases()`（后端批量操作），而非前端直接操作 IndexedDB。

### 决策 2：ID 映射策略
源节点 ID → 新节点 ID 映射表，保证边关系正确重建。

### 决策 3：批量模板化复用 E1 导出
选中节点 → 序列化为 JSON → 复用 `templateExporter.exportTemplate()` 路径。

## 7. E5：协作感知增强 — 架构决策

### 决策 1：复用 RemoteCursorsLayer 渲染
`RemoteCursorsLayer.tsx` 已有光标渲染逻辑，扩展其数据源：
- 现有：仅显示静态光标位置（快照）
- E5：订阅 `presenceStore.cursors` 实现实时更新

### 决策 2：WebSocket 光标消息协议
```typescript
interface WsCursorMessage {
  type: 'cursor:move'
  payload: { userId: string; x: number; y: number; nodeId?: string }
}
```

### 决策 3：节流策略
客户端 `throttle(broadcastCursor, 50ms)`，服务端转发给同画布其他用户。

### 决策 4：复用 PresenceIndicator
`PresenceIndicator.tsx` 已显示在线用户头像，E5 扩展为点击可查看协作者光标。

## 8. 跨 Epic 集成点

| 集成点 | 实现方式 |
|--------|---------|
| E1 模板导出 → E2 通知 | 模板分享时发送 @mention 通知 |
| E2 通知中心 → E5 光标 | 通知来自协作者时，该协作者光标高亮 |
| E3 全文搜索 → E4 批量操作 | 搜索结果可直接批量选中 → 跨画布复制 |

## 9. 技术风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 全文索引性能（大画布 1000+ 节点） | 中 | 高 | Web Worker + 增量索引 + TTL 缓存 |
| WebSocket 光标广播频率过高 | 高 | 中 | 50ms 节流 + 仅视口内节点广播 |
| 跨画布节点复制 ID 冲突 | 低 | 中 | UUID 生成 + ID 映射表 |
| E2 通知消息丢失（断线） | 低 | 低 | IndexedDB 持久化 + 重连拉取 |

## 10. 文件变更汇总

### 新增文件
- `src/stores/notificationStore.ts`
- `src/services/wsNotificationHandler.ts`
- `src/services/templateExporter.ts`
- `src/services/templateImporter.ts`
- `src/services/canvasFulltextIndex.ts`
- `src/components/dds/collaboration/MentionInput.tsx`
- `src/components/dds/notifications/NotificationPanel.tsx`
- `src/components/dds/canvas-dashboard/CrossCanvasCopyDialog.tsx`
- `src/components/dds/canvas-dashboard/BatchDeleteConfirmDialog.tsx`
- `src/services/wsCursorHandler.ts`

### 扩展文件
- `src/stores/templateStore.ts` (+ exportTemplate/importTemplate/favorites)
- `src/components/dds/templates/TemplateGallery.tsx` (+ 导出/导入按钮)
- `src/components/dds/search/GlobalSearchPanel.tsx` (+ 节点内容 Tab)
- `src/components/dds/canvas-dashboard/BatchOpsToolbar.tsx` (+ 复制到画布/模板化)
- `src/components/dds/canvas-dashboard/RemoteCursorsLayer.tsx` (+ 实时同步)
- `src/components/dds/toolbar/DDSToolbar.tsx` (+ 铃铛通知按钮)
