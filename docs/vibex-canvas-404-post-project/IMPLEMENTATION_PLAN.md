# IMPLEMENTATION_PLAN — vibex-canvas-404-post-project

**项目**: vibex-canvas-404-post-project — POST /api/v1/canvas/project 404 修复  
**产出日期**: 2026-04-16  
**规划人**: analyst  
**状态**: completed

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 端点实现 | E1-U1 ~ E1-U4 | 4/4 | — |
| E2: 验收测试 | E2-U1 | 0/1 | E2-U1 |

---

## E1: 端点实现

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | 添加 POST /project handler | ✅ | — | handler 注册到 Hono app，返回 201 + `{ projectId, status: 'created' }` |
| E1-U2 | 认证中间件 | ✅ | E1-U1 | 无 JWT 时请求返回 401 |
| E1-U3 | D1 数据写入 | ✅ | E1-U1 | D1 写入 Project + CanvasProject 记录 |
| E1-U4 | 字段校验 | ✅ | E1-U1 | 缺少 requirementText 返回 400 |

### E1-U1 详细说明

**文件变更**: 
- `vibex-backend/src/routes/v1/canvas/index.ts`
- `vibex-backend/migrations/0007_canvas_project.sql`

**实现步骤**:
1. 创建 `0007_canvas_project.sql` D1 migration — 添加 `CanvasProject` 表
2. 在 `canvas/index.ts` 添加 `POST /project` handler
3. handler 使用 `getAuthUserFromHono(c)` 认证
4. handler 内联校验 body: `{ requirementText, contexts, flows, components }`
5. D1 INSERT: `Project` 表 + `CanvasProject` 表
6. 返回 `{ projectId: canvasProjectId, status: 'created' }`, status 201

**Verification**:
```bash
grep 'POST.*project' vibex-backend/src/routes/v1/canvas/index.ts
grep 'canvas_project' vibex-backend/migrations/0007_canvas_project.sql
```

---

### E1-U2 详细说明

**认证逻辑**: `getAuthUserFromHono(c)` 内联调用，无 JWT 时返回 401。

**Verification**:
```typescript
// 无 JWT 返回 401
expect(response.status).toBe(401)
```

---

### E1-U3 详细说明

**D1 操作**:
1. `INSERT INTO Project (id, name, description, userId, createdAt, updatedAt) VALUES (...)`
2. `INSERT INTO CanvasProject (id, projectId, name, contextsJson, flowsJson, componentsJson, createdAt, updatedAt) VALUES (...)`

**Verification**:
```bash
# D1 migration 存在
ls vibex-backend/migrations/0007_canvas_project.sql
grep 'CanvasProject' vibex-backend/migrations/0007_canvas_project.sql
```

---

### E1-U4 详细说明

**字段校验**: 内联检查 `requirementText`, `contexts`, `flows`, `components`，任一缺失返回 400。

**Verification**:
```typescript
// 缺少 requirementText 返回 400
expect(response.status).toBe(400)
```

---

## E2: 验收测试

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | gstack browse 端到端验证 | ⬜ | E1-U3 | 三场景（正常/认证失败/参数缺失）返回正确状态码 |

---

## 回滚计划

| Unit | 回滚方式 |
|------|---------|
| E1-U1~U4 | `git checkout vibex-backend/src/routes/v1/canvas/index.ts` |
| E1-U3 | `git checkout vibex-backend/migrations/0007_canvas_project.sql` |

---

*Plan 版本: v1.0 | 最后更新: 2026-04-16*
