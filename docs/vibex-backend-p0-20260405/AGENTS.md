# 开发约束: VibeX Backend OPTIONS + CORS Fix

> **项目**: vibex-backend-p0-20260405  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 强制规范

### 1.1 不得破坏现有路由

- **认证逻辑**: `authMiddleware` 的认证检查逻辑不变，仅调整注册顺序
- **CORS headers**: 新增 `protected_.options` 的 headers 必须与现有 `v1.options` 一致
- **其他中间件**: `rateLimit`, `logger` 等中间件顺序不变

### 1.2 强制测试覆盖

| 文件 | 必须覆盖的测试场景 |
|------|------------------|
| `gateway.ts` | OPTIONS 返回 204、CORS headers 完整、无 401 |
| `index.ts` | 所有路径 OPTIONS 返回 204、NODE_ENV 检测正确 |
| `auth.ts` | JWT_SECRET 缺失返回 CONFIG_ERROR |

### 1.3 禁止事项

- **禁止** 在 `protected_.options` 中移除 `Access-Control-Allow-*` headers
- **禁止** 在 `authMiddleware` 前添加其他中间件（仅移动 `options`）
- **禁止** 在生产环境直接使用 `console.log` — 使用 `devDebug()` 或删除
- **禁止** 在错误响应中返回堆栈信息

---

## 2. 代码风格

### 2.1 Hono OPTIONS handler 规范

```typescript
// ✅ 正确: 完整的 CORS headers
protected_.options('/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.res.headers.set('Access-Control-Max-Age', '86400');
  return c.text('', 204);
});

// ❌ 错误: 缺少必要的 headers
protected_.options('/*', (c) => {
  return c.text('', 204); // 缺少 CORS headers！
});
```

### 2.2 NODE_ENV 检测规范

```typescript
// ✅ 正确: 安全的 optional chaining
const isWorkers = typeof globalThis.caches !== 'undefined';
const isProduction = process.env?.NODE_ENV === 'production';
if (!isWorkers && !isProduction) {
  import('@hono/node-server')...
}

// ❌ 错误: 未使用 optional chaining
if (process.env.NODE_ENV !== 'production') { ... }
// undefined !== 'production' 为 true，在生产环境误导入
```

### 2.3 错误码规范

```typescript
// ✅ 正确: 明确的错误码
return c.json({
  success: false,
  error: 'JWT_SECRET not configured. Please run: wrangler secret put JWT_SECRET',
  code: 'CONFIG_ERROR',
}, 500);

// ❌ 错误: 模糊的错误码
return c.json({
  success: false,
  error: 'Server configuration error',
  code: 'INTERNAL_ERROR', // 用户无法判断具体原因
}, 500);
```

---

## 3. 测试要求

### 3.1 测试文件命名

```
src/routes/v1/gateway.ts → src/routes/v1/__tests__/gateway-cors.test.ts
src/index.ts             → src/index.test.ts
src/lib/auth.ts          → src/lib/auth.test.ts
```

### 3.2 Mock 规范

```typescript
// auth.test.ts - mock Cloudflare Env
const mockEnv = {
  JWT_SECRET: undefined, // 模拟缺失
  DB: mockD1Database,
  caches: mockCache,
} as unknown as CloudflareEnv;

const res = await app.request('/v1/projects', {
  method: 'GET',
  env: mockEnv,
});
```

### 3.3 验证命令

```bash
# 本地验证 OPTIONS
curl -X OPTIONS http://localhost:8787/v1/projects \
  -H 'Origin: https://example.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Authorization' -v

# 生产验证 OPTIONS
curl -X OPTIONS https://api.vibex.top/v1/projects \
  -H 'Origin: https://vibex-app.pages.dev' \
  -H 'Access-Control-Request-Method: POST' -v
```

---

## 4. Git 提交规范

```
fix(cors): move protected_.options before authMiddleware in gateway
fix(env): use optional chaining for NODE_ENV detection in index.ts
fix(auth): return CONFIG_ERROR instead of INTERNAL_ERROR when JWT_SECRET missing
test(cors): add OPTIONS preflight unit tests to gateway-cors.test.ts
test(auth): add JWT_SECRET missing CONFIG_ERROR test
```

---

## 5. 审查清单 (Review Checklist)

开发者提交 PR 前必须自检：

- [ ] `vitest run` 全部通过
- [ ] `pnpm lint` 无错误
- [ ] `protected_.options` 在 `protected_.use('*', authMiddleware)` 之前
- [ ] `protected_.options` 包含完整的 CORS headers
- [ ] `app.options('/*')` 在 `index.ts` 中已添加
- [ ] NODE_ENV 检测使用 `process.env?.NODE_ENV`
- [ ] JWT_SECRET 缺失返回 `CONFIG_ERROR`
- [ ] 错误消息包含 `wrangler secret put JWT_SECRET` 提示
- [ ] `curl -X OPTIONS /v1/projects` 本地验证返回 204

---

## 6. 安全约束

- **CORS headers**: 仅在 OPTIONS 响应中设置，origin 固定为 `*`
- **错误消息**: 不包含堆栈信息或内部路径
- **JWT 配置错误**: 提供可操作的 wrangler 命令提示

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
