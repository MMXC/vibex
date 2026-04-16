# PRD — vibex-canvas-404-post-project: POST /api/v1/canvas/project 404 修复

**版本**: v1.0
**日期**: 2026-04-16
**负责人**: PM
**状态**: 已完成（待执行）

---

## 执行摘要

### 背景

`POST /api/v1/canvas/project` 返回 404。实际请求链路经过 Cloudflare Worker → v1 gateway → Legacy Hono canvas app (`src/routes/v1/canvas/index.ts`)，而该 Hono 文件中不存在 `POST /project` handler。`src/app/api/v1/canvas/project/route.ts` 是 App Router 实现，但从未接入 Workers 网关，等同于无效代码。

### 目标

在 Legacy Hono 中添加 `POST /project` handler，使 `POST /api/v1/canvas/project` 返回 201 并正确创建项目数据，且认证、校验逻辑与现有端点风格一致。

### 成功指标

- [ ] `POST /api/v1/canvas/project` 返回 201（而非 404）
- [ ] 响应体包含 `{ projectId, status: 'created' }`
- [ ] 未认证请求返回 401
- [ ] 缺少必填字段返回 400
- [ ] 变更已 commit，仅涉及 `src/routes/v1/canvas/index.ts`

---

## Epic 拆分

### Epic E1: 端点实现

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S1.1 | 在 canvas/index.ts 中添加 POST /project handler，接收 body `{ requirementText, contexts, flows, components }` | 1.5 小时 | handler 注册到 Hono app，返回 `{ projectId, status: 'created' }` |
| S1.2 | 复用 authMiddleware，认证失败返回 401 | 15 分钟 | 无 JWT 时请求返回 401 |
| S1.3 | D1 操作：创建 project + contexts + flows + components 关联数据 | 1 小时 | D1 写入成功，数据关联正确 |
| S1.4 | 字段校验：缺少必填字段返回 400 | 15 分钟 | 缺少 `requirementText` 时返回 400 |

**DoD for E1**:
- `src/routes/v1/canvas/index.ts` 中新增了 `POST /project` 路由
- handler 复用现有 authMiddleware
- D1 写入 project + contexts + flows + components
- 风格与 `generate-contexts` / `generate-flows` / `generate-components` 一致

### Epic E2: 验收测试

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S2.1 | QA 验证 201/400/401 状态码，响应体结构正确 | 30 分钟 | gstack browse 测试三种场景均符合预期 |

**DoD for E2**:
- gstack browse QA 测试通过
- 三种场景（正常/认证失败/参数缺失）均返回正确状态码

---

## 验收标准（可写 expect() 断言）

### S1.1 验收标准

```
// handler 正确注册
expect(app.routes).toContainEqual(
  expect.objectContaining({ method: 'POST', path: '/project' })
)

// 成功响应结构
expect(response).toMatchObject({
  status: 201,
  body: expect.objectContaining({
    projectId: expect.any(String),
    status: 'created'
  })
})
```

### S1.2 验收标准

```
// 无 JWT 返回 401
expect(fetch('/api/v1/canvas/project', { method: 'POST' })).resolves.toMatchObject({
  status: 401
})
```

### S1.3 验收标准

```
// D1 中 project 记录存在
expect(
  await env.DB.prepare('SELECT * FROM project WHERE id = ?').bind(projectId).first()
).toMatchObject({
  id: projectId,
  requirement_text: expect.any(String)
})
```

### S1.4 验收标准

```
// 缺少 requirementText 返回 400
expect(
  fetch('/api/v1/canvas/project', {
    method: 'POST',
    body: JSON.stringify({ contexts: [], flows: [], components: [] })
  })
).resolves.toMatchObject({ status: 400 })
```

### S2.1 验收标准

```
// 正常请求返回 201
expect(response.status).toBe(201)
expect(response.json.projectId).toBeDefined()
expect(response.json.status).toBe('created')

// 认证失败返回 401
expect(response.status).toBe(401)

// 缺少必填字段返回 400
expect(response.status).toBe(400)
```

---

## 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | POST /project handler | 在 canvas/index.ts 中添加与 generate-* 风格一致的 handler | `expect(app.routes).toContainEqual(...)` | 无 |
| F1.2 | 认证中间件 | 复用 authMiddleware，无 JWT 返回 401 | `expect(status).toBe(401)` | 无 |
| F1.3 | D1 数据写入 | 创建 project + contexts + flows + components 关联 | `expect(DB.select(...)).toMatchObject(...)` | 无 |
| F1.4 | 字段校验 | 缺少 requirementText 返回 400 | `expect(status).toBe(400)` | 无 |
| F2.1 | QA 验收测试 | gstack browse 三场景验证 | 三个状态码符合预期 | 无 |

---

## Definition of Done (DoD)

研发完成的判断标准：

1. **路由注册** — `src/routes/v1/canvas/index.ts` 中 `POST /project` handler 已注册
2. **认证** — 无 JWT 时返回 401
3. **校验** — 缺少必填字段返回 400
4. **数据写入** — D1 中 project + contexts + flows + components 记录创建成功
5. **响应格式** — 成功时返回 `{ projectId: string, status: 'created' }`，status 201
6. **代码风格** — 与 `generate-contexts` / `generate-flows` / `generate-components` 风格一致
7. **不修改 App Router** — `src/app/api/v1/canvas/project/route.ts` 保持原样

---

## 驳回红线检查

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点可写 expect() 断言
- [x] 已执行 Planning（Feature List 已产出）
- [x] 页面集成标注：无页面集成（纯 API 修复）

---

## 风险与依赖

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| Hono Env 类型与 Prisma Client 类型不兼容 | 中 | 需用 D1 API 而非 Prisma | 参考 generate-contexts 的 D1 用法 |
| D1 binding 在 Hono 中访问方式与 App Router 不同 | 中 | 需调整数据库操作方式 | 参考现有 generate-* handlers |
| 未来 App Router route.ts 接入网关后产生重复逻辑 | 低 | 两套实现可能不一致 | 长期应统一到 App Router，短期保持 Hono |
