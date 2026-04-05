# Canvas CORS Preflight 500 错误修复

## 问题描述

**时间**: 2026-04-05 00:20 GMT+8

用户在 VibeX 前端（`https://vibex-app.pages.dev`）访问 Canvas 画布时，浏览器控制台报错：

```
TypeError: Incorrect type for Promise: the Promise did not resolve to 'Response'.
```

实际 HTTP 请求：

```
OPTIONS https://api.vibex.top/api/v1/canvas/generate-contexts
  → 500 Internal Server Error
```

**影响**: 所有 Canvas API 的 CORS 预检请求全部失败，导致前端无法调用任何受保护的 Canvas API。

---

## 根因分析

### 请求链路

```
Browser → Cloudflare → Worker (Hono)
                        ↓
                   OPTIONS /api/v1/canvas/generate-contexts
                        ↓
              v1.options('/*', handler)  ← 未匹配
                        ↓
              protected_ (子 app)
                        ↓
              authMiddleware (检查 Authorization header)
                        ↓
              无 Authorization → 401 Unauthorized
                        ↓
              401 response → 被当作内部错误处理 → 500
```

### 三个层次的问题

1. **v1 gateway 层**：`v1.options('/*')` 只匹配 `/api/v1/xxx` 路径，但 Canvas 路由是挂载在 `protected_` 子 app 下的 `canvas` 路由。
2. **protected_ 子 app 层**：没有处理 OPTIONS，导致请求落入 `authMiddleware`。
3. **canvas 子路由层**：`canvas.use('/*', cors())` 在 Hono 中的执行顺序在 `protected_.use('*', authMiddleware)` 之后。

### 关键误解

> "加了 `allowMethods: ['OPTIONS']` 就是处理了预检请求"

`cors()` 中间件的 `allowMethods` 只影响响应头中的 `Access-Control-Allow-Methods`，**不负责处理 OPTIONS 请求本身**。必须显式注册 `OPTIONS` 路由或让 `authMiddleware` 放行 OPTIONS。

---

## 修复方案

### 1. v1 gateway 层 — 处理顶级预检

```typescript
// 在 protected_ 路由注册之前，拦截所有 OPTIONS 请求
v1.options('/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return c.text('', 204);
});
```

### 2. protected_ 子 app 层 — 放行预检请求

```typescript
const protected_ = new Hono<{ Bindings: CloudflareEnv }>();

// 方式 A: 显式 OPTIONS 处理器
protected_.options('/*', (c) => {
  return c.text('', 204);
});

// 方式 B: 在 authMiddleware 中跳过 OPTIONS
protected_.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return next();
  }
  // ... 原有 auth 逻辑
});
```

### 3. canvas 路由层 — 保留冗余（防御性）

```typescript
// canvas/index.ts - 防御性处理
const canvas = new Hono();
canvas.use('/*', cors());
canvas.options('/generate-contexts', (c) => c.text('', 204));
```

---

## 修复 commit

```
65936875 fix(cors): explicit OPTIONS handlers for preflight requests
```

**文件变更**:
- `vibex-backend/src/routes/v1/gateway.ts`
- `vibex-backend/src/routes/v1/canvas/index.ts`

---

## 经验教训

### 1. CORS 预检请求（OPTIONS）的特殊性

CORS 预检请求**不带 Authorization header**，但受保护的 API 期望有 Authorization。如果不单独处理 OPTIONS，会形成死锁：

```
OPTIONS → authMiddleware → 401 → 浏览器阻止 POST
```

### 2. Hono 路由注册顺序

```
v1.use('*', logger);
v1.use('*', rateLimit);
v1.options('/*', preflightHandler);  ← 必须在这里！
v1.route('/auth', auth);
v1.route('/canvas/stream', canvasStream);
v1.route('/', protected_);           ← protected_ 里的 OPTIONS 不够
```

**原则**: 越早拦截 OPTIONS 越好，避免落入认证层。

### 3. 中间件层级的幂等性

CORS headers 允许多次设置（后者覆盖前者）。在多个层级加 `cors()` / `options()` 是安全的，不会有副作用。

### 4. Cloudflare Worker crash 版本检测

部署后发现所有请求（包括 `/health`）返回 Cloudflare 1101 错误。这是 Worker crash 的特征，Cloudflare 返回固定错误页面。解决方式：

```bash
# 检查当前运行的版本
npx wrangler deployments list

# 回滚到上一个正常版本
npx wrangler rollback <version-id>
```

---

## 防范机制

### 检查清单

新加任何受保护的 API 路由时，必须确认：

- [ ] v1 gateway 层的 `v1.options('/*')` 存在且包含 `Access-Control-Allow-Origin`
- [ ] 所有子 app（如 `protected_`）的 OPTIONS 请求已被放行
- [ ] 部署后用 curl 测试 OPTIONS 预检：`curl -X OPTIONS -i <url>`
- [ ] 确认 CORS 响应头中有 `Access-Control-Allow-Origin: *`

### 测试命令

```bash
# 验证 CORS 预检
curl -s -X OPTIONS "https://api.vibex.top/api/v1/canvas/generate-contexts" \
  -H "Origin: https://vibex-app.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -i

# 期望: HTTP/2 204 + CORS headers (非 401/500)
```

---

## 相关文档

- [Hono CORS Middleware](https://hono.dev/middleware/cors)
- [MDN: CORS Preflight Request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
