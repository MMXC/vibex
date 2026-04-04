# E1: OPTIONS 预检拦截修复 - 详细规格

## S1.1 OPTIONS handler 顺序调整

### 目标
调整 `protected_.options` 在 `authMiddleware` 之前注册，确保 OPTIONS 预检请求直接返回 204，不被 401 拦截。

### 现状问题
```typescript
// src/routes/v1/gateway.ts - 问题代码
const protected_ = new Hono();

// ❌ authMiddleware 先注册，所有请求先过这里
protected_.use('*', authMiddleware);

// ❌ OPTIONS handler 后注册，永远没机会执行
protected_.options('/*', (c) => {
  return c.text('', 204);
});
```

### 实施方案
```typescript
// src/routes/v1/gateway.ts - 修复后

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from '../middleware/auth';

export function createGateway() {
  const protected_ = new Hono<{ Bindings: CloudflareEnv }>();

  // ✅ OPTIONS handler 必须先注册！
  protected_.options('/*', (c) => {
    c.res.headers.set('Access-Control-Allow-Origin', '*');
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    c.res.headers.set('Access-Control-Max-Age', '86400');
    return c.text('', 204);
  });

  // ✅ 然后才是 authMiddleware（OPTIONS 不带 token，auth 检查会跳过）
  protected_.use('*', authMiddleware);

  // 其他路由...
  protected_.get('/projects', ...);
  protected_.post('/projects', ...);

  return protected_;
}
```

### 验收断言

```typescript
// __tests__/gateway-cors.test.ts

import { Hono } from 'hono';
import { authMiddleware } from '../src/middleware/auth';

describe('OPTIONS Preflight Fix', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    // 正确顺序：OPTIONS 先注册
    app.options('/*', (c) => {
      c.res.headers.set('Access-Control-Allow-Origin', '*');
      c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return c.text('', 204);
    });

    // 然后是认证中间件（不会拦截 OPTIONS）
    app.use('*', authMiddleware);

    app.get('/test', (c) => c.json({ ok: true }));
    app.post('/test', (c) => c.json({ ok: true }));
  });

  it('should return 204 for OPTIONS request without auth', async () => {
    const res = await app.request('/test', { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });

  it('should include CORS headers in OPTIONS response', async () => {
    const res = await app.request('/test', { method: 'OPTIONS' });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });

  it('should NOT return 401 for OPTIONS without auth header', async () => {
    const res = await app.request('/test', { method: 'OPTIONS' });
    expect(res.status).not.toBe(401);
  });

  it('should still require auth for GET/POST', async () => {
    const res = await app.request('/test', { method: 'GET' });
    expect(res.status).toBe(401); // 无 token 应该 401
  });
});
```

### DoD Checklist
- [ ] `protected_.options('/*', ...)` 在 `protected_.use('*', authMiddleware)` 之前
- [ ] OPTIONS handler 设置所有必需的 CORS headers
- [ ] `curl -X OPTIONS -I https://api.vibex.top/v1/projects` 返回 204
- [ ] `curl -v` 验证无 401
- [ ] jest 测试通过
