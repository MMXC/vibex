# Sprint95 Architecture — Canvas Analytics & Public Sharing

**Project**: vibex-proposals-sprint95
**Sprint**: S95
**Date**: 2026-06-13
**Self-impl by coord**

---

## 1. 系统架构概览

S95 在 S94 基础设施之上扩展 4 个 Epic：

```
┌─────────────────────────────────────────────────────────────┐
│                     VibeX Frontend                          │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ AnalyticsDashboard│  │ PublicCanvasPage│                  │
│  │   (E1)          │  │    (E2)         │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│  ┌────────┴────────┐  ┌────────┴────────┐                  │
│  │ analyticsStore   │  │PublicGalleryPage│                  │
│  │ (E1)            │  │   (E2)          │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│  ┌────────┴────────┐  ┌────────┴────────┐                  │
│  │ExportProfilePanel│  │NodeLockBadge    │                  │
│  │   (E4)          │  │    (E3)          │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│  ┌────────┴────────┐  ┌────────┴────────┐                  │
│  │exportProfileStore│  │ nodeLockStore   │                  │
│  │   (E4)          │  │    (E3)          │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
└───────────┼────────────────────┼──────────────────────────┘
            │                    │
            ▼                    ▼
┌────────────────────────────────────────────────────────────┐
│                 VibeX Backend (Cloudflare Workers)         │
│  GET  /api/canvas/[id]/analytics    ← E1                 │
│  PATCH /api/canvas/[id]/visibility   ← E2                 │
│  GET  /api/public/canvas/[slug]       ← E2                 │
│  GET  /api/canvas/public              ← E2                 │
│  POST /api/canvas/[id]/nodes/[nid]/lock ← E3              │
│  DELETE /api/canvas/[id]/nodes/[nid]/lock← E3              │
│  GET/POST/DELETE /api/canvas/[id]/export-profiles ← E4    │
└────────────────────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
┌────────────────────────────────────────────────────────────┐
│                  Cloudflare D1 (SQLite)                    │
│  audit_logs           ← S94-E3 (已有)                      │
│  canvas_health        ← S94-E1 (已有)                     │
│  canvas_permissions   ← S94-E2 (扩展: is_public, slug)     │
│  + audit_logs.action_index (复合索引) ← E1                 │
│  + canvas_export_profiles ← E4                            │
└────────────────────────────────────────────────────────────┘
```

## 2. API 设计

### E1: Canvas Analytics API

```
GET /api/canvas/[id]/analytics
Query: range=7d|30d|90d (default: 7d)
Auth: 必须登录，canvas 所有者或协作者
Response 200:
{
  "views": { "today": number, "week": number, "month": number },
  "editCount": number,
  "uniqueUsers": number,
  "shareCount": number,
  "exportCount": number,
  "dailyTrend": [{ "date": "YYYY-MM-DD", "views": number, "edits": number }],
  "actionBreakdown": { "create": n, "update": n, "delete": n, "share": n, "export": n }
}
```

D1 查询策略：
```sql
-- 审计日志聚合（利用现有 audit_logs 表）
SELECT
  date(created_at) as day,
  COUNT(*) FILTER (WHERE action = 'view') as views,
  COUNT(*) FILTER (WHERE action IN ('create','update','delete')) as edits
FROM audit_logs
WHERE canvas_id = ?
  AND created_at >= date('now', '-30 days')
GROUP BY day
ORDER BY day DESC;
```

### E2: Public Canvas API

```
PATCH /api/canvas/[id]/visibility
Body: { "is_public": boolean, "slug"?: string }
Auth: canvas 所有者
Response 200: { "slug": string, "public_url": "/public/[slug]" }
Response 409: { "error": "slug already taken" }

GET /api/public/canvas/[slug]
Auth: 无需认证
Response 200: { "canvas": { "id", "name", "nodes", "edges", "owner" }, "is_public": true }
Response 404: { "error": "not found or not public" }

GET /api/canvas/public
Query: page=1&limit=20&sort=recent|popular
Auth: 登录用户
Response 200: { "canvases": [{ "id", "name", "slug", "owner", "preview", "created_at" }], "total": number }
```

### E3: Node Edit Locking API

```
POST /api/canvas/[id]/nodes/[nodeId]/lock
Auth: canvas 协作者
Response 200: { "acquired": true, "locked_by": userId, "expires_at": timestamp }
Response 200: { "acquired": false, "locked_by": otherUserId, "expires_at": timestamp }

DELETE /api/canvas/[id]/nodes/[nodeId]/lock
Auth: 锁持有者
Response 200: { "released": true }

-- D1 锁表
CREATE TABLE canvas_node_locks (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,  -- Unix timestamp
  UNIQUE(canvas_id, node_id)
);
```

### E4: Export Profile API

```
GET /api/canvas/[id]/export-profiles
Auth: canvas 所有者
Response 200: { "profiles": [{ "id", "name", "format", "scale", "include_nodes", "include_edges" }] }

POST /api/canvas/[id]/export-profiles
Body: { "name": string, "format": "react"|"svg"|"markdown"|"json", "scale": number, "include_nodes"?: boolean, "include_edges"?: boolean }
Response 201: { "id", "name", ... }

DELETE /api/canvas/[id]/export-profiles/[profileId]
Auth: profile 创建者
Response 200: { "deleted": true }
```

## 3. 前端架构

### 3.1 组件结构

```
vibex-fronted/src/
├── components/dds/
│   ├── AnalyticsDashboard.tsx       ← E1
│   ├── AnalyticsDashboard.module.css
│   ├── PublicVisibilitySection.tsx  ← E2
│   └── CollaboratorEditorBadge.tsx  ← E3
├── components/dds/toolbar/
│   └── ExportMenu.tsx               ← E4 扩展
├── stores/
│   ├── analyticsStore.ts            ← E1
│   ├── exportProfileStore.ts        ← E4
│   └── nodeLockStore.ts             ← E3
├── app/
│   ├── canvas/[id]/
│   │   └── page.tsx                 ← E1/E2/E3/E4 集成
│   ├── canvas/public/
│   │   └── page.tsx                 ← E2 发现页
│   └── public/[slug]/
│       └── page.tsx                 ← E2 公开只读页
```

### 3.2 Store 设计

**analyticsStore.ts**:
```typescript
interface AnalyticsData {
  range: '7d' | '30d' | '90d';
  views: { today: number; week: number; month: number };
  editCount: number;
  uniqueUsers: number;
  shareCount: number;
  exportCount: number;
  dailyTrend: Array<{ date: string; views: number; edits: number }>;
  actionBreakdown: Record<string, number>;
}
interface AnalyticsStore {
  data: AnalyticsData | null;
  isLoading: boolean;
  fetchAnalytics: (canvasId: string, range: string) => Promise<void>;
  setRange: (range: string) => void;
}
```

**nodeLockStore.ts**:
```typescript
interface NodeLock {
  nodeId: string;
  lockedBy: string;
  expiresAt: number;
}
interface NodeLockStore {
  locks: Map<string, NodeLock>;
  acquireLock: (canvasId: string, nodeId: string) => Promise<NodeLock>;
  releaseLock: (canvasId: string, nodeId: string) => Promise<void>;
  isLocked: (nodeId: string) => boolean;
  getLock: (nodeId: string) => NodeLock | undefined;
}
```

## 4. 数据迁移

```sql
-- E1: 审计日志性能优化索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_canvas_created
ON audit_logs(canvas_id, created_at DESC);

-- E2: 公开画布
ALTER TABLE canvas_permissions
ADD COLUMN is_public INTEGER DEFAULT 0;
ALTER TABLE canvas_permissions
ADD COLUMN public_slug TEXT;

-- E4: 导出模板
CREATE TABLE IF NOT EXISTS canvas_export_profiles (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  scale REAL DEFAULT 1.0,
  include_nodes INTEGER DEFAULT 1,
  include_edges INTEGER DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

## 5. WebSocket 集成（E3）

复用现有 WebSocket presence channel（`user_x/user_y` 广播机制）：
- 锁状态通过 `node_lock_acquired` / `node_lock_released` 消息广播
- 客户端 presenceStore 订阅锁事件，实时更新 `nodeLockStore`

## 6. 性能考量

- **Analytics**: 默认 `range=7d`，D1 查询限制 1000 行；添加复合索引
- **Public Canvas**: slug 查询使用唯一索引，O(1) 查找
- **Node Lock**: 无持久化表（仅 WebSocket 广播 + 内存 TTL），避免 D1 写压力

## 7. 安全性

- 所有 mutation API（visibility, lock, export-profile）均需认证
- `GET /api/public/canvas/[slug]` 无需认证（公开数据）
- 公开画布数据过滤：仅暴露 name/nodes/edges/owner，不含 permissions/auth info
- 导出模板仅所有者可操作
