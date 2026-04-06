# Spec: Epic 4 — Hono/Next.js 双路由收敛

**Epic ID**: E4
**提案**: A-P1-2
**优先级**: P1
**工时**: 4h
**负责人**: Backend Dev

---

## 1. Overview

明确 Hono Gateway 与 Next.js App Router 的边界：Hono 做外部网关（auth/cors/rate-limit），Next.js 做内部业务路由，统一 Auth middleware 行为。

## 2. Scope

### In Scope
- `vibex-backend/src/index.ts`（Hono server）
- `vibex-backend/src/routes/`（Hono 风格路由）
- `vibex-backend/src/app/api/`（Next.js route handlers）
- Auth middleware 行为一致性验证

### Out of Scope
- 将 Hono 路由迁移到 Next.js（方案二，长期技术债）
- Next.js middleware 重构（仅处理边界定义）

## 3. Technical Approach

采用**方案三：明确边界，分层治理**。

### 3.1 分层边界定义

```
外部请求 → Hono Gateway (src/index.ts, src/routes/)
  ├── /auth/*      → Hono 路由（登录、注册、token 刷新）
  ├── /api/external/* → Hono 路由（第三方 webhook、CORS 处理）
  └── /api/*       → Next.js App Router（所有内部 API）
```

### 3.2 Auth Middleware 统一

```typescript
// src/middleware/auth.ts — 统一认证中间件
export async function authMiddleware(c: Context) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return { authorized: false, error: 'Missing token' }
  }
  const user = await verifyToken(token)
  if (!user) {
    return { authorized: false, error: 'Invalid token' }
  }
  return { authorized: true, user }
}

// src/routes/auth/login.ts（Hono 路由使用同一 middleware）
// src/app/api/*/route.ts（Next.js 路由使用同一 middleware）
```

### 3.3 src/routes/ 目录清理原则

`src/routes/` 中保留：
- auth/*.ts（登录、注册、OAuth）
- gateway/*.ts（webhook、CORS、rate-limit）
- 业务路由禁止放在 src/routes/

## 4. File Changes

```
Modified:
  vibex-backend/src/index.ts                  (Hono 仅处理外部网关)
  vibex-backend/src/middleware/auth.ts        (统一 auth 中间件)
  vibex-backend/src/routes/auth/*.ts          (迁移到 gateway 层)
  vibex-backend/src/routes/chat.ts             (→ src/app/api/chat)
  vibex-backend/src/routes/projects.ts        (→ src/app/api/projects)

Documented:
  docs/adr/ADR-001-router-boundary.md         (新建：路由边界定义)
```

## 5. Stories

| Story ID | 描述 | 工时 | 验收条件 |
|----------|------|------|---------|
| E4-S1 | 路由分层边界定义 | 1h | src/routes/ 仅含网关路由，业务路由在 src/app/api/ |
| E4-S2 | Auth middleware 行为一致性 | 2h | Hono 和 Next.js 对同一 token 返回相同结果 |
| E4-S3 | src/routes/ 目录清理 | 1h | 非网关路由文件迁移或删除 |

## 6. Acceptance Criteria

```typescript
// E4-S1
describe('Router boundary', () => {
  it('should only have gateway routes in src/routes/', () => {
    const routes = glob('src/routes/**/*.ts')
    const businessRoutes = routes.filter(f => !f.includes('/gateway/') && !f.includes('/auth/'))
    expect(businessRoutes.length).toBe(0)
  })

  it('should have more routes in src/app/api than src/routes', () => {
    const honoRoutes = glob('src/routes/**/*.ts').length
    const nextRoutes = glob('src/app/api/**/route.ts').length
    expect(nextRoutes).toBeGreaterThan(honoRoutes)
  })
})

// E4-S2
it('should return consistent auth result across routers', async () => {
  const token = await createTestToken()
  const honoResult = await authMiddleware(createMockCxt(token))
  const nextResult = await authMiddleware(createMockNextCtx(token))
  expect(honoResult).toEqual(nextResult)
})
```

## 7. Test Cases

| ID | 输入 | 预期输出 |
|----|------|---------|
| TC01 | src/routes/ 文件数量 | ≤10 |
| TC02 | GET /auth/login (Hono) + GET /api/chat (Next.js) 同 token | Auth 结果一致 |
| TC03 | 过期 token 请求 Hono/Next.js | 均返回 401 |
| TC04 | 无 token 请求 Hono/Next.js | 均返回 401 |

## 8. Edge Cases

- **Auth 不一致**：某些 Next.js API 使用自定义 auth 逻辑，需统一替换为 shared middleware
- **并行开发冲突**：迁移期间可能有新 PR 同时修改路由文件，需协调
- **Hono 注册路由覆盖 Next.js**：配置不当可能导致 Hono 优先匹配，需明确路由注册顺序

## 9. Definition of Done

- [ ] src/routes/ 仅含网关路由（≤10 个文件）
- [ ] 所有内部业务路由在 src/app/api/
- [ ] Auth middleware 行为一致（集成测试通过）
- [ ] ADR 文档写入 docs/adr/
- [ ] Code review 通过（≥1 reviewer）
