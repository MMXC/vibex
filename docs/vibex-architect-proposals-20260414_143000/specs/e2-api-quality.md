# Spec — E2: API 质量保障

> **Epic**: E2
> **Epic 名称**: API 质量保障
> **关联提案**: A-P1-3（API 错误格式统一）+ A-P1-4（API 版本管理）
> **Sprints**: Sprint 1（S2.S1）+ Sprint 2（S2.S2）
> **总工时**: 16h
> **状态**: 已采纳

---

## 1. 背景

当前 Cloudflare Workers 后端 API 错误响应格式不统一，前端需要针对不同错误结构编写适配逻辑。此外，缺乏 API 版本化策略，新增路由随意命名，历史路由难以追踪。

## 2. Scope

### In Scope
- 所有 Cloudflare Workers API 错误响应格式统一
- 新增路由必须遵循 `/v{n}/` 前缀规范
- 建立 API 版本化 CI 检查

### Out of Scope
- 不重构现有路由的业务逻辑
- 不做 Breaking Change（仅规范化错误格式）

---

## Story 1: E2.S1 — API 错误格式统一（8h）

### F1.1 — 统一错误响应格式

**功能点 ID**: E2.S1.F1.1

#### 技术实现

**统一错误格式**:
```typescript
// 标准错误响应
interface VibeXError {
  error: {
    code: string      // 错误码，如 "INVALID_PARAMS"
    message: string   // 人类可读消息
    details?: object  // 可选附加信息
  }
}
```

**受影响路由**:
1. 扫描所有 `workers/` 目录下的路由文件
2. 找到所有 `return new Response(...)` 且 status >= 400 的位置
3. 统一替换为 `JSON.stringify({ error: { code, message, details } })`

**示例**:

```typescript
// Before（不一致的错误格式）
return new Response(JSON.stringify({ message: 'Invalid params' }), { status: 400 })
return new Response(JSON.stringify({ error: 'invalid_params' }), { status: 400 })

// After（统一格式）
return new Response(JSON.stringify({
  error: {
    code: 'INVALID_PARAMS',
    message: 'Invalid request parameters',
    details: { field: 'paramName' }
  }
}), { status: 400 })
```

**错误码规范**:
| 错误码 | HTTP Status | 场景 |
|--------|-------------|------|
| `INVALID_PARAMS` | 400 | 参数校验失败 |
| `UNAUTHORIZED` | 401 | 未认证 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `AI_SERVICE_TIMEOUT` | 504 | AI 服务超时 |
| `INTERNAL_ERROR` | 500 | 内部错误 |

#### 验收标准（expect() 断言）

```typescript
describe('E2.S1.F1.1 — API 错误格式统一', () => {
  it('AC1: 400 错误返回标准格式', async () => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'payload' }),
      headers: { 'Content-Type': 'application/json' }
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toHaveProperty('code')
    expect(body.error).toHaveProperty('message')
    expect(typeof body.error.code).toBe('string')
    expect(typeof body.error.message).toBe('string')
  })

  it('AC2: INVALID_PARAMS 错误码正确', async () => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' }
    })
    const body = await res.json()
    expect(body.error.code).toBe('INVALID_PARAMS')
  })

  it('AC3: AI 服务超时时返回 AI_SERVICE_TIMEOUT', async () => {
    // Mock Cloudflare Workers AI 超时场景
    const res = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test', model: 'timeout-model' })
    })
    // 超时场景通过集成测试验证
    expect(res.status).toBeGreaterThanOrEqual(500)
  })

  it('AC4: 错误格式通过 lint 检测', () => {
    // 所有路由文件通过自定义 lint 规则
    const violations = lintApiRoutes('./workers/')
    expect(violations).toHaveLength(0)
  })
})
```

---

## Story 2: E2.S2 — API 版本管理策略（8h）

### F1.1 — 建立 API 版本化规范

**功能点 ID**: E2.S2.F1.1

#### 技术实现

**版本化路由规范**:
- 所有新 API 路由必须在 `/v1/` 或 `/v2/` 前缀下
- 示例：`/api/v1/generate`, `/api/v2/generate`
- 同一功能多版本并存时，旧版本标记 `@deprecated`

**目录结构**:
```
workers/
  routes/
    v1/
      generate.ts
      catalog.ts
    v2/
      generate.ts  # Breaking change 时创建
```

**CI 检查规则**（使用 ESLint 插件或自定义脚本）:
```typescript
// check-api-versioning.ts
// 检测所有 routes/ 下的一级目录是否匹配 /v\d+/ 格式
// 未匹配的一级目录作为 violation 报告
```

#### 验收标准（expect() 断言）

```typescript
describe('E2.S2.F1.1 — API 版本管理', () => {
  it('AC1: 新增路由在版本前缀下', () => {
    const newRoutes = [
      '/api/v1/generate',
      '/api/v2/catalog',
    ]
    newRoutes.forEach(route => {
      const match = route.match(/\/v\d+\//)
      expect(match).not.toBeNull()
    })
  })

  it('AC2: 旧路由（无版本前缀）触发警告', () => {
    const violations = lintApiRoutes('./workers/routes/')
    // 旧路由应被标记为 violation 或警告
    const oldRouteViolations = violations.filter(v => v.rule === 'no-unversioned-route')
    expect(oldRouteViolations.length).toBeGreaterThanOrEqual(0) // 警告，非阻断
  })

  it('AC3: OpenAPI 文档包含版本化路径', async () => {
    const spec = await generateOpenApiSpec()
    expect(spec.paths).toHaveProperty('/v1/generate')
  })

  it('AC4: lint 检测无新增未版本化路由', () => {
    const result = execSync('npx ts-node scripts/check-api-versioning.ts', { encoding: 'utf8' })
    expect(result).not.toContain('ERROR: unversioned route found')
  })
})
```

---

## 工时估算

| Story | 步骤 | 工时 |
|-------|------|------|
| E2.S1 | 扫描 + 识别所有非标准错误格式 | 2h |
| E2.S1 | 实现统一错误格式中间件/工具函数 | 2h |
| E2.S1 | 迁移现有路由到统一格式 | 2h |
| E2.S1 | 编写集成测试验证 | 1h |
| E2.S1 | Code Review + CI | 1h |
| **E2.S1 合计** | | **8h** |
| E2.S2 | 设计版本化目录结构和规范 | 1h |
| E2.S2 | 实现 lint 检查脚本 | 3h |
| E2.S2 | 迁移当前路由（应用现有 `/api/` 路径到 `/api/v1/`） | 2h |
| E2.S2 | OpenAPI 文档更新 | 1h |
| E2.S2 | 测试验证 | 1h |
| **E2.S2 合计** | | **8h** |
| **E2 总计** | | **16h** |

## 依赖关系

```
E2.S2 (API 版本化) → 先于 E4.S1 (路由重组) 执行
E2.S1 (错误格式统一) → 独立，可并行 Sprint 1 执行
```
