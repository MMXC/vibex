# E2: 分布式限流 - 详细规格

## S2.1 Cache API 替代内存存储

### 目标
使用 Cloudflare Workers Cache API (`caches.default`) 替代内存 Map，实现跨 Worker 实例的限流一致性。

### 现状问题
```typescript
// src/lib/rateLimit.ts - 问题代码
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  // ❌ 每个 Worker 实例独立内存，多实例不共享
}
```

### 实施方案
```typescript
// src/lib/rateLimit.ts - 重构后
import { caches } from '@cloudflare/workers-types';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];
}

const CACHE_TTL = 60; // 1 minute TTL

export class DistributedRateLimitStore {
  private cacheName = 'RATE_LIMIT_CACHE';

  private getCacheKey(identifier: string): string {
    return `rl:${identifier}`;
  }

  async checkLimit(identifier: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.getCacheKey(identifier);
    const cache = caches.default;
    
    const cached = await cache.match(key);
    let entry: RateLimitEntry;

    if (cached) {
      const data = await cached.json() as RateLimitEntry;
      entry = data;
      
      // 检查是否过期
      if (Date.now() > entry.resetTime) {
        entry = { count: 0, resetTime: Date.now() + windowMs, requests: [] };
      }
    } else {
      entry = { count: 0, resetTime: Date.now() + windowMs, requests: [] };
    }

    entry.count++;
    entry.requests.push(Date.now());

    // 写入 Cache
    const response = new Response(JSON.stringify(entry), {
      headers: { 'Content-Type': 'application/json' }
    });
    // Cache API TTL 控制
    await cache.put(key, response);

    return {
      allowed: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime
    };
  }

  async getRemaining(identifier: string): Promise<number> {
    const key = this.getCacheKey(identifier);
    const cache = caches.default;
    const cached = await cache.match(key);
    
    if (!cached) return -1; // 无记录
    
    const entry = await cached.json() as RateLimitEntry;
    if (Date.now() > entry.resetTime) return -1;
    
    // 需要从外部传入 limit
    return 0; // placeholder
  }

  async recordRequest(identifier: string): Promise<void> {
    // 已在 checkLimit 中记录
  }
}

// 保持原有接口
export const rateLimitStore = new DistributedRateLimitStore();

export async function checkLimit(
  c: Context,
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number }> {
  const result = await rateLimitStore.checkLimit(identifier, limit, windowMs);
  return { allowed: result.allowed, remaining: result.remaining };
}
```

### 验收断言
```typescript
// __tests__/rateLimit.test.ts

describe('DistributedRateLimitStore', () => {
  const mockCache = {
    match: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  };

  beforeEach(() => {
    vi.stubGlobal('caches', {
      default: mockCache
    });
  });

  it('should use Cache API instead of in-memory Map', async () => {
    mockCache.match.mockResolvedValue(null);
    
    const store = new DistributedRateLimitStore();
    await store.checkLimit('test-user', 100, 60000);
    
    expect(mockCache.match).toHaveBeenCalledWith('rl:test-user');
    expect(mockCache.put).toHaveBeenCalled();
  });

  it('should return allowed=true when under limit', async () => {
    mockCache.match.mockResolvedValue(new Response(JSON.stringify({
      count: 50,
      resetTime: Date.now() + 60000,
      requests: [Date.now()]
    })));
    
    const store = new DistributedRateLimitStore();
    const result = await store.checkLimit('test-user', 100, 60000);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(50);
  });

  it('should return allowed=false when over limit', async () => {
    mockCache.match.mockResolvedValue(new Response(JSON.stringify({
      count: 100,
      resetTime: Date.now() + 60000,
      requests: Array(100).fill(Date.now())
    })));
    
    const store = new DistributedRateLimitStore();
    const result = await store.checkLimit('test-user', 100, 60000);
    
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after TTL expires', async () => {
    // 旧记录已过期
    mockCache.match.mockResolvedValue(new Response(JSON.stringify({
      count: 100,
      resetTime: Date.now() - 1000, // 已过期
      requests: []
    })));
    
    const store = new DistributedRateLimitStore();
    const result = await store.checkLimit('test-user', 100, 60000);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });
});
```

### DoD Checklist
- [ ] `rateLimit.ts` 使用 `caches.default` 而非 `Map`
- [ ] 保留原有接口: `checkLimit()`, `getRemaining()`, `recordRequest()`
- [ ] wrangler.toml 配置 Cache API 权限
- [ ] jest 测试全部通过
- [ ] 集成测试验证多 Worker 一致性

---

## S2.2 限流一致性测试

### 目标
验证在多 Worker 场景下，限流计数保持一致。

### 测试方案
```typescript
// __tests__/rateLimit-integration.test.ts

describe('Rate Limit Multi-Worker Consistency', () => {
  it('should maintain consistent count across multiple cache operations', async () => {
    // 模拟 100 并发请求
    const requests = Array(100).fill(null).map((_, i) => 
      checkLimit({} as Context, `user-${i % 10}`, 10, 60000) // 10 users, 10 limit each
    );
    
    const results = await Promise.all(requests);
    
    // 每个用户应该恰好 10 次请求
    const allowedCount = results.filter(r => r.allowed).length;
    const deniedCount = results.filter(r => !r.allowed).length;
    
    // 10 users × 10 requests each = 100 total
    // Each user has limit 10, so all 10 requests per user should be allowed
    expect(allowedCount).toBe(100);
    expect(deniedCount).toBe(0);
  });
});
```

### DoD Checklist
- [ ] 并发测试用例存在
- [ ] 多用户场景验证
- [ ] 429 响应码验证

---

## wrangler.toml 配置

```toml
name = "vibex-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Cache API 默认启用，无需额外配置
# 如需明确声明：
# [[unsafe.bindings]]
# name = "CACHE"
# type = "cache"
```

**注意**: Workers Cache API 默认启用，无需在 wrangler.toml 中额外配置。
