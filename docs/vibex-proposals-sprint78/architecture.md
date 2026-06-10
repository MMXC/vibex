# S78 架构设计 — Sprint78 架构文档

**项目**: vibex-proposals-sprint78
**日期**: 2026-06-08

---

## 设计原则

1. **最小侵入**: S78 每个 Epic 的新增代码应当最小化已有 store 的修改
2. **状态隔离**: 新增的 `comments` / `scheduledExports` / `relations` 独立管理，不污染已有状态
3. **持久化分层**: 已有 Zustand persist 的 store 扩展字段，new store 使用独立 persist key
4. **测试前置**: 每个 store 扩展先写测试（TDD）

---

## S78-E1: 分支自动合并架构

### 现有资产

| 文件 | 位置 | 状态 |
|------|------|------|
| `canvasHistoryStore.ts` | `src/stores/canvasHistoryStore.ts` | 已在 main (S70-E1/S77-E3) |
| `BranchManager.tsx` | `src/components/dds/canvas-history/` | 已在 main (S69-E1) |
| `SnapshotCompareDialog.tsx` | `src/components/dds/canvas-history/` | 已在 main (S70-E1) |
| `historyDB.ts` | `src/lib/canvas/historyDB.ts` | 已在 main |

### 架构变更

```
canvasHistoryStore.ts 扩展
  ├── autoMergeBranch(canvasId, source, target)
  │     ├── 获取 source snapshot（通过 getSnapshot）
  │     ├── 获取 target snapshot
  │     ├── 逐节点 diff（新增/修改/删除/未变）
  │     ├── 无冲突 → 直接写入 target snapshot
  │     └── 有冲突 → 写入 pendingConflicts + target snapshot
  └── 现有 mergeBranch() 保持不变（手动合并路径）
```

### 节点 diff 算法（MVP）

```typescript
type NodeDiff = 'added' | 'modified' | 'deleted' | 'unchanged';

function diffNodes(sourceNodes, targetNodes): Map<string, NodeDiff> {
  const result = new Map();
  // 新增：source 有，target 无 → added
  // 删除：target 有，source 无 → deleted
  // 修改：两边都有但内容不同 → modified
  // 未变：两边都有且相同 → unchanged
}
```

### 冲突检测

仅检测**同一 ID 节点在两个分支均有修改**的情况（`modified + modified`）。`added` 和 `deleted` 自动合并。

---

## S78-E2: 模板订阅架构

### 现有资产

| 文件 | 位置 | 状态 |
|------|------|------|
| `templateStore.ts` | `src/stores/templateStore.ts` | 已在 main (S70-E2) |
| `TemplateMarketplacePanel.tsx` | `src/components/dds/templates/` | 已在 main (S70-E2) |
| `notificationStore.ts` | `src/stores/notificationStore.ts` | 已在 main (S77-E1) |

### 架构变更

```
templateStore.ts 扩展（新增状态 + actions）
  ├── subscribedTemplates: string[]   ← localStorage vibex-template-subscriptions
  ├── subscribedAuthors: string[]     ← localStorage vibex-template-subscriptions
  ├── subscribeTemplate(id)
  ├── unsubscribeTemplate(id)
  ├── subscribeAuthor(authorId)
  ├── unsubscribeAuthor(authorId)
  └── getTemplateUpdates(): TemplateUpdate[]
        ← 遍历 subscribedTemplates，找 updatedAt > lastSeenAt

notificationStore.ts 扩展
  └── 'template_update' NotificationType
```

### 数据持久化

```typescript
// templateStore persist 配置扩展
{
  name: 'vibex-template-store',
  partialize: (state) => ({
    ...state,
    subscribedTemplates: state.subscribedTemplates,
    subscribedAuthors: state.subscribedAuthors,
    // 不持久化其他大字段
  })
}
```

---

## S78-E3: 内联评论架构

### 现有资产

| 文件 | 位置 | 状态 |
|------|------|------|
| `collabSessionStore.ts` | `src/stores/collabSessionStore.ts` | 已在 main (S75-E4) |
| `CollabActivityPanel.tsx` | `src/components/dds/collab/` | 已在 main (S75-E4) |
| `MentionInput.tsx` | `src/components/dds/collab/` | 已在 main (S75-E4) |

### 架构变更

```
collabSessionStore.ts 扩展
  ├── comments: Record<string, CommentEntry[]>
  │     // key = canvasNodeId
  │     // CommentEntry: { id, canvasId, nodeId, authorId, authorName,
  │     //                 content, createdAt, parentId?, resolved }
  ├── addComment(canvasId, nodeId, content, parentId?)
  ├── deleteComment(commentId)
  ├── editComment(commentId, content)
  └── resolveComment(commentId)

新增组件
  ├── NodeCommentBadge.tsx       ← 节点工具栏 badge
  └── NodeCommentPanel.tsx        ← 侧边评论面板
```

### 与 S75-E4 活动流的关系

`comments` 与 `activityEntries` 是**独立**的数据结构：
- `comments` = 节点级评论（关联到 canvasNodeId）
- `activityEntries` = 活动流（全局历史，`type: 'comment'` 来自 S75-E4 的 handleSend）

E3 不修改 S75-E4 的 `handleSend` 行为。

---

## S78-E4: 定时导出+Webhook 架构

### 现有资产

| 文件 | 位置 | 状态 |
|------|------|------|
| `canvasListStore.ts` | `src/stores/dds/canvasListStore.ts` | 已在 main (S76-E3) |
| `ZipExporter.ts` | `src/services/export/ZipExporter.ts` | 已在 main (S70-E3) |
| `BatchOpsToolbar.tsx` | `src/components/dds/canvas-dashboard/` | 已在 main (S76-E2) |

### 架构变更

```
canvasListStore.ts 扩展
  ├── scheduledExports: ScheduledExport[]  ← localStorage vibex-scheduled-exports
  ├── addScheduledExport(config): id
  ├── removeScheduledExport(id)
  ├── listScheduledExports(): ScheduledExport[]
  └── triggerExportNow(id)

ZipExporter.ts 扩展
  └── exportWithWebhook(canvasId, options, webhookUrl)
        ← 正常导出流程 → 成功后 POST webhookUrl + JSON payload

新增组件
  └── ScheduledExportPanel.tsx   ← 定时任务管理面板
```

### Cron 解析（MVP 简化版）

```typescript
type CronType = 'hourly' | 'daily' | 'weekly';
// hourly: 每 N 小时
// daily: 每天 00:00
// weekly: 每周一 00:00
```

### Webhook Payload 格式

```json
POST {webhookUrl}
{
  "event": "canvas-export-completed",
  "timestamp": "2026-06-08T12:00:00Z",
  "canvasId": "canvas-1",
  "format": "zip",
  "results": {
    "files": ["canvas-1.png", "canvas-1.svg"],
    "size": 1234567
  },
  "status": "success"
}
```

---

## S78-E5: 画布关系追踪架构

### 现有资产

| 文件 | 位置 | 状态 |
|------|------|------|
| `canvasListStore.ts` | `src/stores/dds/canvasListStore.ts` | 已在 main (S76-E3) |
| `FolderTree.tsx` | `src/components/dds/canvas/` | 已在 main |
| `CanvasMeta` interface | `src/stores/dds/canvasListStore.ts` | 已在 main |

### 架构变更

```
CanvasMeta 接口扩展
  ├── parentCanvasId?: string       ← 当前画布所属的父画布
  └── relatedCanvasIds: string[]    ← 关联画布列表

canvasListStore.ts 扩展 actions
  ├── setParentCanvas(canvasId, parentId)
  ├── removeParentCanvas(canvasId)
  ├── addRelatedCanvas(canvasId, relatedId)
  ├── removeRelatedCanvas(canvasId, relatedId)
  └── getCanvasRelations(canvasId)
        ← 返回 { parent, children[], related[] }

新增组件
  ├── CanvasRelationsPanel.tsx     ← 画布详情页关系 Tab
  └── CanvasRelationBadge.tsx      ← FolderTree 关系图标
```

---

## 跨 Epic 集成决策

### Decision 1: `comments` 和 `activityEntries` 独立存储
**结论**: 保持独立，不做数据合并。评论是上下文关联的讨论，活动流是全局历史记录。
**理由**: 合并会破坏 S75-E4 的现有逻辑，且语义不同。

### Decision 2: 定时导出触发时机
**结论**: 定时触发在客户端实现（`setInterval` 检查 cron 表达式）。
**理由**: 不依赖服务端，S77-E4 的离线缓存支持此模式。

### Decision 3: 关系追踪与文件夹层级分离
**结论**: 画布关系（parentCanvasId）与文件夹层级（FolderTree）是独立的概念，FolderTree 显示文件夹，CanvasRelationsPanel 显示关系网络。
**理由**: 避免功能耦合，用户可同时使用两种组织方式。

---

## 既有资产映射（Pre-Discovery）

| 文件 | 位置 | 预判 |
|------|------|------|
| `canvasHistoryStore.ts` | `src/stores/canvasHistoryStore.ts` | 存在，需扩展 |
| `templateStore.ts` | `src/stores/templateStore.ts` | 存在，需扩展 |
| `notificationStore.ts` | `src/stores/notificationStore.ts` | 存在，需扩展 |
| `collabSessionStore.ts` | `src/stores/collabSessionStore.ts` | 存在，需扩展 |
| `canvasListStore.ts` | `src/stores/dds/canvasListStore.ts` | 存在，需扩展 |
| `ZipExporter.ts` | `src/services/export/ZipExporter.ts` | 存在，需扩展 |
| `BranchManager.tsx` | `src/components/dds/canvas-history/` | 存在，需扩展 |
| `TemplateMarketplacePanel.tsx` | `src/components/dds/templates/` | 存在，需扩展 |
| `DDSCanvasPage.tsx` | `src/app/` | 存在，需集成 |

**⚠️ 预判非最终结论**: Dev 实现前必须用 `git show origin/main:<path>` 验证实际路径。
