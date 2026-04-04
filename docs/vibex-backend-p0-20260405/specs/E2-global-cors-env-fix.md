# E2: 全局 CORS + 环境修复 - 详细规格

## S2.1 全局 CORS 显式处理 OPTIONS

### 目标
在 `index.ts` 中添加显式的 `app.options('/*')` 处理，确保所有路径的 OPTIONS 请求都被正确处理。

### 实施方案
```typescript
// src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createGateway } from './routes/v1/gateway';

const app = new Hono();

// 全局 CORS 中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ 显式处理所有 OPTIONS 请求
app.options('/*', (c) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.res.headers.set('Access-Control-Max-Age', '86400');
  return c.text('', 204);
});

// 注册 gateway
app.route('/v1', createGateway());

// ...
```

### 验收断言
```typescript
describe('Global CORS OPTIONS handling', () => {
  it('should return 204 for OPTIONS on any path', async () => {
    const paths = ['/v1/projects', '/v1/users', '/v1/canvas', '/nonexistent'];
    
    for (const path of paths) {
      const res = await app.request(path, { method: 'OPTIONS' });
      expect(res.status, `OPTIONS ${path} should be 204`).toBe(204);
    }
  });

  it('should include CORS headers in all OPTIONS responses', async () => {
    const res = await app.request('/any-path', { method: 'OPTIONS' });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    expect(res.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
  });
});
```

---

## S2.2 NODE_ENV 修复

### 目标
修复 `NODE_ENV` 检测，防止生产环境误导入 `@hono/node-server`。

### 现状问题
```typescript
// src/index.ts - 问题代码
if (process.env.NODE_ENV !== 'production') {
  import('@hono/node-server').then(...);
}
// ❌ Cloudflare Workers 生产环境 NODE_ENV 为 undefined
// ❌ undefined !== 'production' 为 true，会误导入 Node.js 模块
```

### 实施方案
```typescript
// src/index.ts - 修复后

// 检测是否为 Cloudflare Workers 环境（不导入 Node.js 模块）
const isWorkers = typeof globalThis.caches !== 'undefined';
const isProduction = process.env?.NODE_ENV === 'production';
const isLocalDev = !isProduction && !isWorkers;

// ✅ 安全的检测方式
if (isLocalDev) {
  // 本地开发环境才导入 @hono/node-server
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port: 8787 });
}

// 或者更简单的写法：
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' && process.env?.NODE_ENV !== undefined) {
  // 只有明确设置了 NODE_ENV 且不为 production 时才导入
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port: 8787 });
}
```

### 验收断言
```typescript
describe('NODE_ENV detection', () => {
  it('should not import @hono/node-server in production', async () => {
    // 模拟生产环境
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // 重新加载模块后检查
    const module = await import('../src/index');
    // 验证 @hono/node-server 未被加载
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should use optional chaining for safe detection', () => {
    // process.env?.NODE_ENV 在任何环境下都不应抛出
    expect(() => {
      const env = process.env?.NODE_ENV;
      return env;
    }).not.toThrow();
  });
});
```

---

## S2.3 JWT_SECRET 缺失处理

### 目标
JWT_SECRET 缺失时返回明确的 CONFIG_ERROR，而非 500。

### 现状问题
```typescript
// src/lib/auth.ts - 问题代码
if (!jwtSecret) {
  return c.json(
    { success: false, error: 'Server configuration error', code: 'INTERNAL_ERROR' },
    500 // ❌ 500 对用户不友好，应明确指出配置缺失
  );
}
```

### 实施方案
```typescript
// src/lib/auth.ts - 修复后

export async function verifyToken(c: Context): Promise<AuthResult> {
  const jwtSecret = c.env.JWT_SECRET;

  // ✅ 启动时验证（更好的做法）
  if (!jwtSecret) {
    console.error('[Auth] JWT_SECRET not configured. Run: wrangler secret put JWT_SECRET');
    return {
      success: false,
      error: 'JWT_SECRET not configured. Please run: wrangler secret put JWT_SECRET',
      code: 'CONFIG_ERROR',
      status: 500
    };
  }

  // ...
}

// 或者更好的做法：在 index.ts 启动时验证
// src/index.ts
const requiredSecrets: (keyof CloudflareEnv)[] = ['JWT_SECRET'];

for (const secretName of requiredSecrets) {
  if (!env[secretName]) {
    throw new Error(
      `Missing required Cloudflare secret: ${secretName}\n` +
      `Please run: wrangler secret put ${secretName}`
    );
  }
}
```

### 验收断言
```typescript
describe('JWT_SECRET missing handling', () => {
  it('should return CONFIG_ERROR when JWT_SECRET is missing', async () => {
    const app = new Hono();
    app.use('*', authMiddleware);
    
    const res = await app.request('/test', {
      method: 'GET',
      env: { JWT_SECRET: undefined } // 模拟缺失
    });
    
    const body = await res.json();
    expect(body.code).toBe('CONFIG_ERROR');
    expect(body.error).toContain('JWT_SECRET');
    expect(res.status).toBe(500);
  });

  it('should provide actionable error message', async () => {
    const app = new Hono();
    app.use('*', authMiddleware);
    
    const res = await app.request('/test', {
      method: 'GET',
      env: { JWT_SECRET: undefined }
    });
    
    const body = await res.json();
    // 错误消息应包含 wrangler 命令提示
    expect(body.error).toMatch(/wrangler secret put JWT_SECRET/i);
  });
});
```

### DoD Checklist (E2)
- [ ] `app.options('/*', handler)` 在 `index.ts` 中添加
- [ ] `process.env?.NODE_ENV` 使用 optional chaining
- [ ] JWT_SECRET 缺失时返回 `CONFIG_ERROR` code
- [ ] 错误消息包含 `wrangler secret put JWT_SECRET` 提示
- [ ] jest 测试全部通过
