# AGENTS.md — vibex-canvas-404-post-project

> **项目**: vibex-canvas-404-post-project — POST /api/v1/canvas/project 404 修复  
> **版本**: v1.0  
> **日期**: 2026-04-16

---

## 1. 代码变更

### 1.1 核心变更

| 文件 | 变更 |
|------|------|
| `vibex-backend/src/routes/v1/canvas/index.ts` | 新增 `POST /project` handler |
| `vibex-backend/migrations/0007_canvas_project.sql` | 新增 `CanvasProject` D1 表 |

### 1.2 POST /project handler 规范

**路由**: `POST /v1/canvas/project` (Hono, Cloudflare Workers)

**认证**: `Authorization: Bearer <JWT>` header required

**Request Body**:
```json
{
  "requirementText": "string",
  "contexts": [],
  "flows": [],
  "components": []
}
```

**Responses**:
| Status | Body |
|--------|------|
| 201 | `{ "projectId": "xxx", "status": "created" }` |
| 400 | `{ "success": false, "error": "...", "code": "INVALID_REQUEST" }` |
| 401 | `{ "success": false, "error": "Authentication required", "code": "UNAUTHORIZED" }` |
| 500 | `{ "success": false, "error": "Failed to create canvas project", "code": "INTERNAL_ERROR" }` |

---

## 2. D1 Schema

**新增表**: `CanvasProject`

```sql
CREATE TABLE IF NOT EXISTS CanvasProject (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  name TEXT NOT NULL,
  contextsJson TEXT NOT NULL DEFAULT '[]',
  flowsJson TEXT NOT NULL DEFAULT '[]',
  componentsJson TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
);
```

---

## 3. 验证命令

```bash
# 验证 handler 存在
grep "POST.*project" vibex-backend/src/routes/v1/canvas/index.ts

# 验证 D1 migration
grep "CanvasProject" vibex-backend/migrations/0007_canvas_project.sql

# 验证认证逻辑
grep "getAuthUserFromHono" vibex-backend/src/routes/v1/canvas/index.ts
```

---

## 4. 部署注意事项

D1 migration 需要应用到 Cloudflare：

```bash
cd vibex-backend
wrangler d1 migrations apply vibex-db --remote
```

---

## 5. 审查清单

- [x] `POST /project` handler 已注册到 Hono app
- [x] 无 JWT 时返回 401
- [x] 缺少必填字段返回 400
- [x] D1 写入 Project + CanvasProject
- [x] 返回 `{ projectId, status: 'created' }`, status 201
- [x] 风格与 `generate-*` handlers 一致
- [x] D1 migration 文件已创建

---

*文档版本: v1.0 | 最后更新: 2026-04-16*
