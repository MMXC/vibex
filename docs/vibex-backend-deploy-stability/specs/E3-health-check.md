# E3: Health Check 端点 - 详细规格

## S3.1 /health 路由实现

### 目标
添加 `/health` 端点，返回服务状态信息，支持部署验证和外部监控。

### 路由实现

```typescript
// src/routes/health.ts

import { Hono } from 'hono';
import type { Context } from 'hono';

const health = new Hono();

health.get('/', (c: Context) => {
  const env = c.env as { 
    NODE_ENV?: string;
    DB?: D1Database;
  };
  
  return c.json({
    status: 'ok',
    env: env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '1.0.0'
  }, 200);
});

export default health;
```

### Gateway 注册

```typescript
// src/gateway.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import health from './routes/health';

const app = new Hono();

// Health check 路由（无认证，公开访问）
app.route('/health', health);

// ... 其他路由
```

### 验收断言

```typescript
// __tests__/health.test.ts

describe('Health Check Endpoint', () => {
  it('should return 200 with status ok', async () => {
    const app = new Hono();
    app.route('/health', health);
    
    const res = await app.request('/health');
    
    expect(res.status).toBe(200);
  });

  it('should return JSON with status, env, timestamp fields', async () => {
    const app = new Hono();
    app.route('/health', health);
    
    const res = await app.request('/health');
    const body = await res.json();
    
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('env');
    expect(body).toHaveProperty('timestamp');
    expect(body.status).toBe('ok');
  });

  it('should not require authentication', async () => {
    const app = new Hono();
    app.use('*', someAuthMiddleware); // 假设有全局认证
    app.route('/health', health); // health 路由应该绕过认证
    
    const res = await app.request('/health');
    
    // 应该不返回 401
    expect(res.status).not.toBe(401);
  });

  it('should include production env in response', async () => {
    const app = new Hono();
    app.route('/health', health);
    
    // 模拟生产环境
    const res = await app.request('/health', {}, {
      env: { NODE_ENV: 'production' }
    });
    
    const body = await res.json();
    expect(body.env).toBe('production');
  });
});
```

### curl 验证命令

```bash
# 部署后验证
curl -s https://api.vibex.com/health

# 预期输出:
# {"status":"ok","env":"production","timestamp":"2026-04-05T04:30:00.000Z","version":"1.0.0"}
```

### DoD Checklist

- [ ] `/health` 路由在 `src/gateway.ts` 中注册
- [ ] 返回 `{ status, env, timestamp, version }` JSON
- [ ] HTTP 状态码为 200
- [ ] 无需认证即可访问
- [ ] `curl /health` 验证返回 200
- [ ] jest 测试通过
