# 开发约束: VibeX Backend Deploy Stability

> **项目**: vibex-backend-deploy-stability  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 强制规范

### 1.1 不得破坏现有接口

- **SSE 事件格式**: 保持 `thinking → step_context → step_model → step_flow → step_components → done/error` 的事件顺序和字段结构
- **RateLimit API**: `checkLimit()`, `getRemaining()`, `recordRequest()` 接口签名不得改变
- **gateway.ts**: 现有受保护路由的认证和限流中间件不得移除

### 1.2 强制测试覆盖

所有修改必须包含对应测试用例：

| 文件 | 必须覆盖的测试场景 |
|------|------------------|
| `sse-stream-lib/index.ts` | 超时触发、客户端断开、计时器清理、AI 调用中止 |
| `rateLimit.ts` | Cache 读取、Cache 写入、限流命中、限流穿透 |
| `gateway.ts` (health) | 200 响应、JSON 格式、路由注册 |
| `db.ts` | production 模式 D1 API、dev 模式 PrismaClient |

### 1.3 禁止事项

- **禁止** 在生产环境直接使用 `console.log` — 使用 `devDebug()` 或结构化日志
- **禁止** 在 SSE 流中对 `controller.close()` 之后的 `controller.enqueue()` 调用
- **禁止** 在 RateLimitStore 中混用内存 Map 和 Cache API — 必须二选一
- **禁止** 在 Health Check 端点返回敏感信息（数据库连接详情、堆栈等）

---

## 2. 代码风格

### 2.1 TypeScript 规范

```typescript
// ✅ 正确: 明确的返回类型
function buildSSEStream(opts: SSEStreamOptions): ReadableStream

// ❌ 错误: 隐式 any
function buildSSEStream(opts) { ... }

// ✅ 正确: 使用 @ts-expect-error 标注已知类型问题
// @ts-expect-error - Cloudflare Workers 全局类型
const cache = caches.default;

// ✅ 正确: try-catch 包裹所有可能失败的 Cache API 调用
try {
  const cached = await caches.default.match(cacheKey);
} catch (err) {
  // 降级到内存 Map 或直接拒绝
}
```

### 2.2 错误处理

```typescript
// SSE 流错误处理规范
try {
  const result = await aiService.chat(prompt, { signal: abortController.signal });
  controller.enqueue(`data: ${JSON.stringify(result)}\n\n`);
} catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    devDebug('[SSE] Stream aborted due to timeout or client disconnect');
  } else {
    controller.enqueue(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
  }
} finally {
  // 必须清理计时器
  timers.forEach(clearTimeout);
  controller.close();
}
```

### 2.3 Cache API 使用规范

```typescript
// ✅ 正确: Cache API 操作封装
async function getRateLimitEntry(key: string): Promise<RateLimitEntry | null> {
  try {
    const cached = await caches.default.match(`rl:${key}`);
    if (cached) {
      return await cached.json<RateLimitEntry>();
    }
  } catch (err) {
    devDebug('[RateLimit] Cache read failed, falling back:', err);
  }
  return null;
}

async function setRateLimitEntry(key: string, entry: RateLimitEntry, ttl: number): Promise<void> {
  try {
    const body = JSON.stringify(entry);
    const response = new Response(body, {
      headers: { 'Content-Type': 'application/json' },
      // 注意: Cache API TTL 在 wrangler.toml 中配置，此处无需重复设置
    });
    await caches.default.put(`rl:${key}`, response);
  } catch (err) {
    devDebug('[RateLimit] Cache write failed:', err);
  }
}
```

---

## 3. 测试要求

### 3.1 测试文件命名

```
src/lib/sse-stream-lib/index.ts → src/lib/sse-stream-lib/index.test.ts
src/lib/rateLimit.ts            → src/lib/rateLimit.test.ts
src/lib/db.ts                   → src/lib/db.test.ts
src/routes/v1/health.ts         → src/routes/v1/health.test.ts
```

### 3.2 Mock 规范

```typescript
// SSE 测试 mock AbortController
const mockAbortController = {
  signal: {
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  abort: vi.fn(),
  timeout: vi.fn(),
};
vi.stubGlobal('AbortController', vi.fn(() => mockAbortController));

// RateLimit 测试 mock Cache API
const mockCache = {
  match: vi.fn(),
  put: vi.fn(),
};
vi.stubGlobal('caches', {
  default: mockCache,
});
```

### 3.3 测试超时配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    timeout: {
      test: 10000,
      hook: 10000,
    },
  },
});
```

---

## 4. Git 提交规范

```
feat(sse-stability): add AbortController timeout to buildSSEStream
fix(rate-limit): migrate from in-memory Map to Cache API
feat(health): add GET /health endpoint
feat(db): add NODE_ENV detection for Prisma conditional loading
test(sse-stability): add timeout and cleanup unit tests
test(rate-limit): add Cache API integration tests
```

---

## 5. 审查清单 (Review Checklist)

开发者提交 PR 前必须自检：

- [ ] `vitest run` 全部通过
- [ ] `pnpm lint` 无错误
- [ ] `wrangler deploy --dry-run` 构建成功
- [ ] SSE 事件格式与原有格式兼容（事件类型、字段名不变）
- [ ] RateLimit API 接口签名未改变
- [ ] Health Check 端点无认证
- [ ] 敏感信息未写入日志
- [ ] 所有 `setTimeout` 都有对应的 `clearTimeout`
- [ ] 所有 `caches.default.put` 都在 try-catch 中

---

## 6. 性能约束

| 指标 | 上限 | 测量方式 |
|------|------|---------|
| SSE 超时后 Worker 响应时间 | < 15ms | wrangler dev 日志 |
| RateLimit Cache 读写延迟 | < 5ms | Vitest benchmark |
| /health 端点响应时间 | < 50ms | curl -w "%{time_total}" |
| Prisma 打包产物大小 | 0 KB | `wrangler deploy --dry-run` 检查 |

---

## 7. 安全约束

- **Health Check**: 仅返回 `status`、`env`、`timestamp`、`version` 四个字段
- **Rate Limit**: Cache Key 不得包含 PII（仅使用 IP hash 或 userId）
- **SSE Error**: `error` 事件中不得泄露堆栈信息，仅返回 `error.message`
- **Prisma**: 生产环境 PrismaClient 不存在，确保 `NODE_ENV=production` 检测正确

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
