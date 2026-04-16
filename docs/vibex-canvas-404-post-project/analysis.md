# Analysis: vibex-canvas-404-post-project — POST /api/v1/canvas/project 404 修复

**任务**: analyze-requirements  
**产出日期**: 2026-04-16  
**分析人**: analyst  
**状态**: 推荐 ✅

---

## 1. 业务场景

- **问题**: 前端调用 `POST /api/v1/canvas/project` 返回 404
- **调用方**: `vibex-fronted/src/lib/canvas/api/canvasApi.ts` → `canvasApi.createProject(data)`
- **数据**: `{ requirementText, contexts, flows, components }` — 三树数据
- **期望**: 创建 Canvas 项目，返回 `{ projectId, status: 'created' }`

**Research 根因分析**：

| 组件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | ✅ | 调用 `POST /api/v1/canvas/project` |
| `vibex-backend/src/routes/v1/canvas/index.ts` | ❌ | Hono canvas 路由，无 `/project` 端点 → 404 |
| `vibex-backend/src/app/api/v1/canvas/project/route.ts` | ⚠️ | App Router 版本存在，使用 Prisma → Workers 不兼容 |

**请求路径**:
```
Frontend → /api/v1/canvas/project
  → Cloudflare Pages redirect → api.vibex.top/api/v1/canvas/project
  → Hono gateway: /v1/canvas/project
    → canvas Hono router (no /project) → 404 ✅ 根因确认
```

App Router 版本（`cf578266`, 2026-04-07）使用 Prisma，与 Cloudflare Workers 部署不兼容（Workers 无 Prisma 运行时）。前端流量打在 Workers 上，App Router 版本无法被命中。

---

## 2. 技术方案

### 方案 A（✅ 推荐）：Hono 路由 + D1 SQL + D1 Migration

**步骤 1：创建 D1 Migration**

新建 `migrations/0007_canvas_project.sql`：

```sql
CREATE TABLE IF NOT EXISTS canvas_project (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  contexts_json TEXT NOT NULL,
  flows_json TEXT NOT NULL,
  components_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_canvas_project_project_id ON canvas_project(project_id);
```

**步骤 2：创建 Hono 路由**

新建 `vibex-backend/src/routes/v1/canvas/project.ts`：

```ts
import { Hono } from 'hono';
import { Env } from '@/lib/db';
import { generateId } from '@/lib/db';

const canvasProject = new Hono<{ Bindings: Env }>();

canvasProject.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { requirementText, contexts, flows, components } = body;

    if (!contexts || !flows || !components) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const id = generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO canvas_project (id, project_id, name, contexts_json, flows_json, components_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      `canvas-${id}`,
      requirementText || '未命名画布项目',
      JSON.stringify(contexts),
      JSON.stringify(flows),
      JSON.stringify(components),
      now,
      now
    ).run();

    return c.json({ projectId: id, status: 'created' }, 201);
  } catch (err) {
    return c.json({ error: 'Failed to create canvas project' }, 500);
  }
});

export default canvasProject;
```

**步骤 3：在 gateway 中挂载**

在 `vibex-backend/src/routes/v1/gateway.ts` 的 `protected_` 块中添加：

```ts
protected_.route('/canvas/project', canvasProjectRouter);
```

**验收**：
- `curl -X POST https://api.vibex.top/api/v1/canvas/project -d '{...}'` 返回 201
- 已在本地 wrangler dev 中测试通过

---

### 方案 B（⚠️ 备选）：仅创建 Project 记录，跳过 CanvasProject

不在 D1 中创建 `canvas_project` 表，只创建标准 `Project` 记录存储项目名。

**缺点**：
- 三树数据（contexts/flows/components）丢失，无法恢复
- 与 App Router 版本行为不一致
- 违反 Epic 4 的数据持久化目标

**结论**：不推荐。

---

## 3. 可行性评估

| 维度 | 评估 |
|------|------|
| 技术难度 | 低 — D1 SQL INSERT + Hono 路由，模式已在项目中验证 |
| D1 Migration | 需新增迁移文件，应用到 Cloudflare D1 |
| 风险 | 低 — 幂等操作，错误返回 500 不破坏现有系统 |
| 工时 | 约 2h（migration 0.5h + route 1h + 测试 0.5h） |
| 依赖 | D1 Database ID (`52de5df6-fe28-48c2-b2ab-bac4812597d0`) 已配置 |

**Research 结果**：
- `projects.ts` Hono 路由已有 `POST /` 创建 Project 的完整模式
- `migrations/0006_canvas_snapshot.sql` 证明 D1 Canvas 相关表的迁移流程已成熟
- `generateId()` 在 Hono 路由中可用

---

## 4. 风险矩阵

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| D1 Migration 未应用导致查询失败 | 中 | 高 | 确保 CI/CD 中包含 `wrangler migrations apply` |
| Prisma schema 与 D1 schema 不一致 | 中 | 中 | `canvas_project` D1 表与 Prisma `CanvasProject` 模型保持字段对齐 |
| Canvas 项目与其他模块数据不一致 | 低 | 中 | `canvas_project.project_id` 作为关联键，后续可与 Project 表对齐 |

---

## 5. 验收标准

- [ ] `POST /api/v1/canvas/project` 返回 `{ projectId, status: 'created' }` (201)
- [ ] D1 中 `canvas_project` 表有对应记录
- [ ] 输入字段 `{ requirementText, contexts, flows, components }` 均正确存储
- [ ] 未认证请求返回 401（authMiddleware 已挂载）
- [ ] `wrangler dev` 本地测试通过

**驳回红线**：
- [ ] 无 D1 Migration → 驳回（缺 schema）
- [ ] Prisma 代码出现在 Hono 路由中 → 驳回（Workers 不兼容）
- [ ] 缺少验收测试 → 驳回补充

---

## 6. 实施路径

```
1. 新建: vibex-backend/migrations/0007_canvas_project.sql
2. 新建: vibex-backend/src/routes/v1/canvas/project.ts
3. 修改: vibex-backend/src/routes/v1/gateway.ts (挂载路由)
4. 修改: vibex-backend/src/routes/v1/canvas/index.ts (添加 JSDoc 说明)
5. 应用 migration: wrangler migrations apply --name vibex-backend
6. 测试: wrangler dev + curl 测试
7. 提交: git add + commit
```

---

## 评审结论

**推荐 ✅**

问题根因明确（路由缺失），方案 A 提供完整解决方案。方案 B 跳过持久化，属于降级方案不应采纳。

**关键建议**：
1. App Router 版本（`src/app/api/v1/canvas/project/route.ts`）应标记为废弃，与 Hono 版本对齐
2. D1 Migration 需作为 sprint 部署的一部分执行
3. 建议在 `schema.prisma` 中同步添加 `CanvasProject` 的 D1 注释，避免两个 schema 持续漂移

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-canvas-404-post-project
- **执行日期**: 2026-04-16
