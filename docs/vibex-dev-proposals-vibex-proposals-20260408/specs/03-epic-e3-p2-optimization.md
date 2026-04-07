# SPEC: E3 - P2 基础设施优化

> **所属 Epic**: E3
> **PRD**: vibex-dev-proposals-vibex-proposals-20260408/prd.md
> **前置 Epic**: E1 + E2
> **状态**: Ready for Dev

---

## 1. 概述

P2 分为两个子阶段：E3-P2A（可靠性增强，8h）和 E3-P2B（可维护性提升，11h），共 8 个 Story。

---

## 2. E3-P2A: 可靠性增强

### S3.1: LLM Provider Retry (3h)

**文件**: `vibex-backend/src/services/llm-provider.ts`

```typescript
async chatWithRetry(options: LLMRequestOptions, attempt = 0): Promise<LLMResponse> {
  try {
    return await this.chat(options);
  } catch (error: any) {
    const maxRetries = this.config.retryAttempts ?? 3;
    // 只对可重试错误重试：429 Rate Limit / 5xx Server Error / 503
    const isRetryable = [429, 500, 502, 503, 504].includes(error.status);

    if (!isRetryable || attempt >= maxRetries) throw error;

    const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
    await new Promise(r => setTimeout(r, delay));
    return this.chatWithRetry(options, attempt + 1);
  }
}
```

**验收**: `spec: llm-provider.retry.spec.ts`
- 429 响应触发 3 次重试，第 3 次成功 → `attempts === 3`
- 500 错误不重试 → `attempts === 1`
- 400 Bad Request 不重试 → `attempts === 1`

---

### S3.2: AI Service 边缘缓存 (2h)

**文件**: `vibex-backend/src/services/ai-service.ts`

```typescript
private async executeWithFallback<T>(options: AIRequestOptions): Promise<AIResult<T>> {
  const cacheKey = options.cacheKey;
  if (cacheKey) {
    const cached = await caches.default.match(cacheKey);
    if (cached) {
      const data = await cached.json();
      return { success: true, data, provider: this.config.defaultProvider, latency: 0 };
    }
  }

  const result = await this.execute(options);

  if (cacheKey && result.success) {
    const response = new Response(JSON.stringify(result.data));
    await caches.default.put(cacheKey, response, {
      expirationTtl: this.config.cacheTTL ?? 3600,
    });
  }

  return result;
}
```

**验收**: `spec: ai-service.cache.spec.ts`
- 缓存命中时 `latency === 0` 且 `provider === 'cached'`
- 缓存未命中时执行真实调用
- 缓存写入使用正确 TTL

---

### S3.3: Auth Rate Limit (2h)

**文件**: `vibex-backend/src/routes/auth.ts`

```typescript
import { createRateLimitMiddleware } from '../lib/rate-limit';

// 独立的 auth 限流（更严格：10次/分钟/IP）
const authRateLimit = createRateLimitMiddleware({
  limit: 10,
  windowMs: 60_000,
  keyBy: 'ip',
});

v1.post('/auth/login', authRateLimit, authLoginHandler);
v1.post('/auth/register', authRateLimit, authRegisterHandler);
```

**验收**: `spec: auth.ratelimit.spec.ts`
- 同一 IP 在 1 分钟内第 11 次请求返回 429
- 不同 IP 不共享计数
- 配置错误（limit=0）不崩溃，返回 500 或使用默认值

---

### S3.4: CUID2 替换 (1h)

**文件**: `vibex-backend/src/lib/id.ts`

```bash
npm install @paralleldrive/cuid2
```

```typescript
import { createId } from '@paralleldrive/cuid2';

export function generateId(): string {
  return createId(); // 默认 22 字符，Crockford base32
}
```

**注意**: 需要扫描所有调用点，确保 ID 格式向后兼容。

**验收**: `spec: id.spec.ts`
- 生成的 ID 长度 === 22
- 10000 次生成无碰撞
- 现有 ID 格式（`c` 前缀）不再生成

---

## 3. E3-P2B: 可维护性提升

### S3.5: ConnectionPool / MessageRouter DI 重构 (3h)

**文件**: `vibex-backend/src/routes/gateway.ts`, `vibex-backend/src/services/websocket/connectionPool.ts`

```typescript
// gateway.ts
const connectionPool = new ConnectionPool({
  heartbeatInterval: 30_000,
  disconnectTimeout: 60_000,
});
const messageRouter = new MessageRouter(connectionPool);

// 通过 c.set 注入
v1.use('*', async (c, next) => {
  c.set('connectionPool', connectionPool);
  c.set('messageRouter', messageRouter);
  await next();
});

// 路由中使用
v1.get('/ws', (c) => {
  const pool = c.get('connectionPool');
  // ...
});

// 删除全局单例
// - getConnectionPool()
// - getMessageRouter()
```

**验收**: `spec: di.connectionPool.spec.ts`
- ConnectionPool 可通过 `c.set` 注入
- Vitest 测试可替换 mock 实例
- 全局单例引用在代码中零出现

---

### S3.6: 清理废弃文件 (1h)

```bash
find vibex-backend/src -name "*.backup-*" -delete
find vibex-backend/src -name "*.orig" -delete
```

**验收**: `spec: cleanup.spec.ts`
- `find` 零结果验证（`.backup-*` / `.orig`）
- 确保 `llm-provider.ts.backup-*` 已删除
- 确认 `llm-provider.ts` 主文件仍然存在且功能正常

---

### S3.7: 单元测试覆盖 (5h)

**目标文件**:

| 文件 | 测试用例数 | 目标覆盖率 |
|------|-----------|-----------|
| `CollaborationService.ts` | 5 | ≥80% |
| `NotificationService.ts` | 4 | ≥80% |
| `MessageRouter.ts` | 4 | ≥70% |

**验收**: Vitest 覆盖率报告
- `npx vitest --run --coverage` 输出
- CollaborationService: 分支覆盖率 ≥80%
- NotificationService: 分支覆盖率 ≥80%
- MessageRouter: 行覆盖率 ≥70%

---

### S3.8: SSE 行缓冲实现 (2h)

**文件**: `vibex-backend/src/routes/ai-design-chat.ts`, `vibex-backend/src/routes/prototype-collaboration.ts`

S2-S2.2 的行缓冲实现推广到所有 SSE 流处理点：

```typescript
// prototype-collaboration.ts 中的 SSE 处理
// 替换 for-await-of streamFromMiniMax 模式为行缓冲
```

**验收**: `spec: sse-linebuffer.integration.spec.ts`
- ai-design-chat.ts 使用行缓冲，无 `buffer.split('\n')` 模式
- prototype-collaboration.ts 使用行缓冲
- 端到端测试：完整 SSE 流不丢失事件

---

## 4. E3 Epic DoD Checklist

- [ ] D-P2-1 ~ D-P2-4 (P2A) 实现 + 测试通过
- [ ] D-P2-5 ~ D-P2-8 (P2B) 实现 + 测试通过
- [ ] `generateId` 所有调用点已更新
- [ ] 无 `.backup-*` / `.orig` 废弃文件
- [ ] CI pipeline 通过（lint + test + type check）
- [ ] 代码 review 通过
- [ ] `npm run test -- --run --coverage` 覆盖率 ≥70%
