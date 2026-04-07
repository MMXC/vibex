# VibeX 后端 OPTIONS 请求返回 HTTP 500 分析

> **分析日期**: 2026-04-05
> **分析者**: analyst agent
> **项目**: vibex-backend-p0-20260405

---

## 1. 执行摘要

| 项目 | 值 |
|------|-----|
| **错误码** | Cloudflare 1101 — Worker 内部异常 / 源站不可达 |
| **影响** | 所有 OPTIONS 预检请求返回 HTTP 500 |
| **根因** | 2 个问题：① `protected_.options` 被 authMiddleware 拦截；② CORS middleware 在某些路径未正确处理 OPTIONS |
| **严重度** | **P0** — 所有跨域 POST/PUT/DELETE 请求被浏览器拦截 |
| **修复工时** | ~0.5h（最小修复）/ 1.5h（完整修复）|

---

## 2. 问题复现

```bash
# 预检请求失败
curl -X OPTIONS 'https://api.vibex.top/v1/projects' \
  -H 'Origin: https://vibex-app.pages.dev' \
  -H 'Access-Control-Request-Method: POST' \
  -v
# → HTTP 500 (Cloudflare 1101)

# GET 请求正常
curl 'https://api.vibex.top/v1/projects' -v
# → HTTP 200/401（取决于认证）
```

---

## 3. 根因分析

### 3.1 问题链路图

```
OPTIONS /api/v1/projects
    │
    ├─[1] index.ts: app.use('*', cors())
    │      ├─ 设置 CORS headers
    │      └─ OPTIONS → 返回 204 ✅
    │      （正常路径，但可能不匹配）
    │
    └─[2] gateway.ts: v1.options('/*', ...)
           ├─ 设置 Access-Control-Allow-Methods
           └─ 返回 204
                │
                └─[3] protected_.options('/*', ...)
                       ↑
                       │ ❌ authMiddleware 在此之前拦截！
                       │     返回 c.json({...}, 401)
                       │     → 浏览器 CORS 验证失败
                       │     → 最终显示为 Cloudflare 500
```

### 3.2 问题 1：`protected_.options` 被 authMiddleware 拦截

**文件**: `src/routes/v1/gateway.ts`（第 104–119 行）

```typescript
// 1. authMiddleware 先注册到 protected_（第 111 行）
const protected_ = new Hono();
protected_.use('*', authMiddleware);  // ← 所有请求先过这里

// 2. OPTIONS handler 后注册到 protected_（第 119 行）
protected_.options('/*', (c) => {
  return c.text('', 204);  // ← 永远不会执行！
});
```

**后果**: OPTIONS 请求到达 `protected_` 时，先被 `authMiddleware` 拦截：
- `authHeader` 为空 → `c.json({...}, 401)` 返回
- `protected_.options` 永远没机会执行
- 浏览器收到 401 → CORS 预检失败 → 跨域请求被拦截

### 3.3 问题 2：全局 CORS middleware 的 OPTIONS 处理

**文件**: `src/index.ts`（第 62–68 行）

```typescript
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

**分析**: `cors()` 中间件来自 `hono/cors`，对 OPTIONS 请求会：
1. 设置 `Access-Control-*` headers
2. 返回 `new Response(null, { status: 204, ...})`

**问题**: `app.use('*', ...)` 模式可能不匹配某些嵌套路径，或中间件执行顺序问题导致 OPTIONS 未被正确处理。

### 3.4 问题 3：`@hono/node-server` 动态导入风险

**文件**: `src/index.ts`（第 149–160 行）

```typescript
if (process.env.NODE_ENV !== 'production') {
  import('@hono/node-server').then(({ serve }) => { ... });
}
```

**风险**: Wrangler 不设置 `NODE_ENV`，生产环境 `process.env.NODE_ENV === undefined`，条件为 `true`，可能触发不该有的 Node.js 模块导入。

### 3.5 问题 4：JWT_SECRET 缺失时返回 500

**文件**: `src/lib/auth.ts`（第 100–106 行）

```typescript
if (!jwtSecret) {
  console.error('[Auth] JWT_SECRET not configured');
  return c.json(
    { success: false, error: 'Server configuration error', code: 'INTERNAL_ERROR' },
    500  // ← 返回 500 而非 401
  );
}
```

**触发条件**: 如果 Cloudflare Worker secrets 中 `JWT_SECRET` 未通过 `wrangler secret put` 配置。

---

## 4. 修复方案

### 方案 A：最小修复（~0.5h，推荐 P0 立即执行）

在 `gateway.ts` 中，将 `protected_.options` 移到 `authMiddleware` **之前**：

```typescript
const protected_ = new Hono<{ Bindings: CloudflareEnv }>();

// ✅ OPTIONS 必须先注册！
protected_.options('/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return c.text('', 204);
});

// 然后才是 authMiddleware
protected_.use('*', authMiddleware);
```

**验证**:
```bash
curl -X OPTIONS 'https://api.vibex.top/v1/projects' \
  -H 'Origin: https://vibex-app.pages.dev' \
  -H 'Access-Control-Request-Method: POST' -v
# → HTTP 204 + CORS headers ✅
```

### 方案 B：完整修复（~1.5h）

在方案 A 基础上，增加：

1. **全局 CORS middleware 显式处理 OPTIONS**（在 `index.ts` 中）：
   ```typescript
   app.options('/*', (c) => {
     return c.text('', 204);
   });
   ```

2. **NODE_ENV 修复**（在 `index.ts` 中）：
   ```typescript
   // ✅ 改用明确检测
   if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
     import('@hono/node-server').then(({ serve }) => { ... });
   }
   ```

3. **JWT_SECRET 验证**（在 `index.ts` 启动时）：
   ```typescript
   // 启动时验证必需 secrets
   const required = ['JWT_SECRET'];
   for (const key of required) {
     if (!env[key as keyof CloudflareEnv]) {
       throw new Error(`Missing required secret: ${key}`);
     }
   }
   ```

---

## 5. 验收标准

| ID | 标准 | 验证命令 |
|----|------|----------|
| AC1 | OPTIONS `/api/v1/projects` 返回 204 | `curl -X OPTIONS -I https://api.vibex.top/v1/projects` |
| AC2 | OPTIONS 响应含 CORS headers | 检查 `Access-Control-Allow-*` 存在 |
| AC3 | OPTIONS 无认证时返回 204（非 401）| `curl -X OPTIONS -v https://api.vibex.top/v1/projects` |
| AC4 | POST 跨域请求能通过预检 | 浏览器 DevTools → Network → 检查 preflight |

---

## 6. 影响评估

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 前端 `fetch('/api/v1/...', { method: 'POST' })` | ❌ CORS 预检失败 | ✅ 正常 |
| 前端 `fetch('/api/v1/...', { method: 'PUT' })` | ❌ CORS 预检失败 | ✅ 正常 |
| 前端 `fetch('/api/v1/...', { method: 'DELETE' })` | ❌ CORS 预检失败 | ✅ 正常 |
| GET 请求 | ✅ 正常 | ✅ 正常 |

---

## 7. 相关文件

| 文件 | 修改类型 |
|------|----------|
| `src/routes/v1/gateway.ts` | 修复（移动 `protected_.options` 顺序）|
| `src/index.ts` | 增强（CORS 显式 OPTIONS + NODE_ENV 检测）|

---

**结论**: OPTIONS 500 的根因是 `protected_.options` 在 `authMiddleware` 之后注册，导致预检请求被 401 拦截。最小修复是调整注册顺序，30 分钟内可完成。
