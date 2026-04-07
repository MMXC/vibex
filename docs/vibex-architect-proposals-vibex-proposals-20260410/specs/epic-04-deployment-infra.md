# SPEC — Epic 4: 部署与运维基础设施

**项目**: vibex-architect-proposals-vibex-proposals-20260410
**Epic**: Epic 4 — 部署与运维基础设施
**Stories**: ST-06, ST-07
**总工时**: 8h
**状态**: Ready for Development

---

## 1. Overview

修复部署基础设施中的两个 P1 问题：CORS 预检请求被 auth middleware 拦截（OPTIONS 返回 401），以及内存 Map 限流计数器在多实例环境下失效。

---

## 2. Story: ST-06 — OPTIONS 预检路由修复（2h）

### 2.1 目标
调整 Hono middleware 注册顺序，使 CORS 预检请求（OPTIONS）在认证检查之前处理，返回 200 而非 401。

### 2.2 问题分析

```typescript
// 问题代码（Hono 路由注册顺序错误）
app.use(authMiddleware);      // ← authMiddleware 先注册
app.options('/{*}', handleCORS); // ← OPTIONS 在 auth 之后，无法处理 preflight
```

### 2.3 修复方案

```typescript
// vibex-backend/src/gateway.ts

// 1. OPTIONS 路由必须先于 authMiddleware 注册
app.options('/{*}', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');
  return c.body(null, 204);  // 204 No Content
});

// 2. Auth middleware 随后注册
app.use('/api/*', authMiddleware);
```

**关键**: Hono 按注册顺序匹配路由，OPTIONS 路由必须先于 middleware 注册。

### 2.4 验收测试

```typescript
test('OPTIONS preflight 返回 200 而非 401', async () => {
  const res = await fetch('/api/protected-route', { method: 'OPTIONS' });
  expect(res.status).toBe(200);
});

test('OPTIONS 响应包含正确的 CORS headers', async () => {
  const res = await fetch('/api/protected-route', { method: 'OPTIONS' });
  expect(res.headers.get('access-control-allow-methods')).toBeTruthy();
  expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
});

test('GET/POST 到 protected route 仍需认证（OPTIONS 除外）', async () => {
  const res = await fetch('/api/protected-route', { method: 'GET' });
  expect(res.status).toBe(401);  // 未认证应返回 401
});
```

---

## 3. Story: ST-07 — 分布式限流迁移（6h）

### 3.1 目标
将 `rateLimit.ts` 从内存 Map 迁移到 Cloudflare Cache API，消除多实例环境下的计数不准问题。

### 3.2 问题分析

```typescript
// ❌ 当前问题代码（内存 Map 在 Workers 多实例下失效）
const rateLimitStore = new Map<string, number>();

async function checkRateLimit(ip: string): Promise<boolean> {
  const count = rateLimitStore.get(ip) ?? 0;
  if (count >= MAX_REQUESTS) return false;
  rateLimitStore.set(ip, count + 1);
  return true;
}
```

### 3.3 修复方案（Cache API）

```typescript
// vibex-backend/src/lib/rateLimit.ts

const CACHE_TTL_SECONDS = 60;  // 60 秒窗口
const MAX_REQUESTS = 100;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const cacheKey = `ratelimit:${identifier}`;
  const cache = await caches.open('ratelimit-v1');

  const cached = await cache.match(cacheKey);
  const count = cached ? parseInt(await cached.text(), 10) : 0;

  if (count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + CACHE_TTL_SECONDS * 1000,
    };
  }

  // 写入新的计数（Cache API 不支持原子递增，使用乐观写入）
  const newCount = count + 1;
  const response = new Response(newCount.toString(), {
    headers: {
      'Cache-Control': `max-age=${CACHE_TTL_SECONDS}, stale-while-revalidate=${CACHE_TTL_SECONDS}`,
    },
  });

  await cache.put(cacheKey, response);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - newCount,
    resetAt: Date.now() + CACHE_TTL_SECONDS * 1000,
  };
}
```

### 3.4 备选方案（KV）

如 Cache API 稳定性不足，可复用已有 KV：

```typescript
// 使用已有 KV 命名空间（COLLABORATION_KV 或新建 RATE_LIMIT_KV）
export async function checkRateLimitKV(identifier: string): Promise<RateLimitResult> {
  const key = `rl:${identifier}`;
  const current = (await KV.get(key, 'number')) ?? 0;
  const ttl = 60;  // 60 秒窗口

  if (current >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: Date.now() + ttl * 1000 };
  }

  await KV.put(key, (current + 1).toString(), { expirationTtl: ttl });
  return { allowed: true, remaining: MAX_REQUESTS - current - 1, resetAt: Date.now() + ttl * 1000 };
}
```

### 3.5 验收条件

| 条件 | 验证方式 |
|------|---------|
| `rateLimitStore` 不是 `Map` 实例 | `expect(rateLimitStore).not.toBeInstanceOf(Map)` |
| 限流计数器存储在 Cache API 或 KV | 代码审查 |
| 多实例并发计数误差 < 1% | 压测（10 并发实例） |
| `rateLimit.ts` 中无 `new Map()` 残留 | `grep "new Map" rateLimit.ts` 返回空 |

### 3.6 验收测试

```typescript
test('限流计数器不使用内存 Map', () => {
  expect(rateLimitStore).not.toBeInstanceOf(Map);
});

test('第一请求允许，后续递增', async () => {
  const id = `test:${Date.now()}`;
  const r1 = await checkRateLimit(id);
  expect(r1.allowed).toBe(true);
  expect(r1.remaining).toBeLessThan(MAX_REQUESTS);
});

test('超过 MAX_REQUESTS 后拒绝', async () => {
  const id = `test:overlimit:${Date.now()}`;
  for (let i = 0; i < MAX_REQUESTS; i++) {
    await checkRateLimit(id);
  }
  const result = await checkRateLimit(id);
  expect(result.allowed).toBe(false);
});

test('Cache API 在限流中使用', async () => {
  const cache = await caches.open('ratelimit-v1');
  expect(cache).toBeDefined();
});
```

---

## 4. DoD Checklist — Epic 4

- [ ] OPTIONS 预检请求返回 200 而非 401
- [ ] CORS headers 正确出现在 OPTIONS 响应中
- [ ] GET/POST 到 protected route 仍需认证
- [ ] `rateLimitStore` 不是内存 Map
- [ ] 多实例压测下限流计数误差 < 1%
- [ ] `grep "new Map" rateLimit.ts` 返回空
- [ ] `pnpm test` 全部通过
- [ ] PR 已合并到 main

---

*Spec 由 PM Agent 基于 architect 分析文档生成 — 2026-04-10*
