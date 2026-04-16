# vibex-canvas-404-post-project 经验沉淀

**完成日期**: 2026-04-16
**问题**: POST /api/v1/canvas/project 返回 404
**根因**: Legacy Hono canvas route 缺少 POST /project handler
**修复**: 在 src/routes/v1/canvas/index.ts 中添加 Hono handler

---

## 根因分析

### 请求链路

```
前端 canvasApi.createProject()
  → POST https://api.vibex.top/api/v1/canvas/project
    → Cloudflare Worker (workers/index.ts)
      → v1 gateway (src/routes/v1/index.ts)
        → legacy canvas Hono app (src/routes/v1/canvas/index.ts)
          → 找不到 POST /project handler
            → 404
```

### 两套实现并存

| 实现 | 文件 | 状态 |
|------|------|------|
| App Router | `src/app/api/v1/canvas/project/route.ts` | 存在但从未接入 Workers 网关 |
| Legacy Hono | `src/routes/v1/canvas/index.ts` | 实际运行，缺少 POST /project |

---

## 经验教训

### 1. 多后端架构的路由接入必须显式确认

Workers 网关的路由分发逻辑决定了哪个实现真正被调用。App Router 文件存在 ≠ 接入网关。

**验证方法**：`git log` + 路由分发代码确认。

### 2. Hono 路由 vs App Router 的取舍

- Hono：Cloudflare Workers 轻量路由，数据库用 D1 API
- App Router：Next.js 生态，数据库可用 Prisma ORM

**经验**：新增 API 端点时，应确认项目使用哪套路由体系，避免两套都写但只生效一套。

### 3. 多后端架构的测试策略

- Hono handler：用 curl 脚本验证（`scripts/verify-canvas-project.sh`）
- App Router route：用 vitest 测试

**经验**：curl 脚本更贴近生产路由链路。

---

## 技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 在哪里添加 handler | Hono (src/routes/v1/canvas/index.ts) | 与现有 generate-* 端点风格一致 |
| 数据库方式 | D1 API (c.env.DB) | 与其他 Hono handlers 一致 |
| 认证方式 | 手动 JWT 提取（无 authMiddleware） | Hono canvas app 未注册全局 auth 中间件 |

---

## Epic 产出

| Epic | 描述 | 关键文件 |
|------|------|---------|
| E1 | POST /project handler | `src/routes/v1/canvas/index.ts` |
| E2 | API 验收测试 | `scripts/verify-canvas-project.sh` |

---

## 状态码行为

| 场景 | 状态码 | 响应 |
|------|--------|------|
| 正常创建 | 201 | `{ projectId, status: 'created' }` |
| 无 JWT | 401 | `{ error: 'Unauthorized' }` |
| 缺少必填字段 | 400 | `{ error: 'Missing required fields...' }` |
| 服务器错误 | 500 | `{ error: 'Failed to create canvas project' }` |
