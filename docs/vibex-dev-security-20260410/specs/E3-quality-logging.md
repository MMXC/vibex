# Epic 3: Quality & Logging

**Project**: vibex-dev-security-20260410
**Epic ID**: E3
**Stories**: ST-05, ST-06
**Priority**: P1–P2
**Estimated Effort**: 1.0h

---

## 1. Overview

改进代码质量和日志规范：
1. **ST-05**: 创建共享 logger 库，替换 `console.log` 以防止生产环境泄露敏感信息，并清理空 catch 块
2. **ST-06**: 启用已有的 `PrismaPoolManager`，使连接池复用

---

## 2. Story ST-05: Production Logging & Empty Catch Cleanup

### 2.1 Problem

**敏感信息泄露**：多处 `console.log` 输出 entityId、token 使用量等敏感信息：

```typescript
// app/api/v1/canvas/generate-contexts/route.ts
console.log('Generated contexts for entity:', entity.id); // ← 泄露 entityId
console.log('Token usage:', usage.total_tokens);         // ← 泄露 token

// services/websocket/connectionPool.ts
console.log('Pool size:', pool.size); // 低风险但应统一
```

**空 catch 块**：多处静默吞掉异常，掩盖错误：

```typescript
try {
  await parseStream(chunk);
} catch { /* 静默忽略 */ }
```

### 2.2 Solution

**Step 1: 创建共享 logger 库**

```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = [
  'entityId', 'entity_id', 'token', 'usage', 'total_tokens',
  'sk-', 'password', 'secret', 'key', 'apiKey', 'api_key',
];

function sanitizeLogMeta(meta: unknown): unknown {
  if (typeof meta !== 'object' || meta === null) return meta;
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEYS.some(key => k.toLowerCase().includes(key));
    sanitized[k] = isSensitive ? '[REDACTED]' : sanitizeLogMeta(v);
  }
  return sanitized;
}

export const logger = {
  debug(ctx: string, meta?: unknown) {
    if (process.env.NODE_ENV === 'production') return;
    console.debug(`[DEBUG] ${ctx}`, sanitizeLogMeta(meta ?? {}));
  },
  info(ctx: string, meta?: unknown) {
    console.info(`[INFO] ${ctx}`, sanitizeLogMeta(meta ?? {}));
  },
  warn(ctx: string, meta?: unknown) {
    console.warn(`[WARN] ${ctx}`, sanitizeLogMeta(meta ?? {}));
  },
  error(ctx: string, meta?: unknown) {
    console.error(`[ERROR] ${ctx}`, sanitizeLogMeta(meta ?? {}));
  },
};
```

**Step 2: 替换 console.log**

```typescript
// 替换前
console.log('Generated contexts for entity:', entity.id);
console.log('Token usage:', usage.total_tokens);

// 替换后
logger.info('generate_contexts', { entityType: entity.constructor.name });
logger.debug('llm_response', { model: options.model });
```

**Step 3: 替换空 catch 块**

```typescript
// 替换前
} catch { }

// 替换后
} catch (err) {
  logger.error('chat_stream_parse_error', { error: err instanceof Error ? err.message : err });
  return NextResponse.json({ error: 'Stream parse failed' }, { status: 500 });
}
```

**Step 4: 添加 ESLint 规则**

```javascript
// .eslintrc.js
{
  rules: {
    'no-empty': ['error', { allowEmptyCatch: false }],
  }
}
```

### 2.3 Files

| File | Change |
|------|--------|
| `vibex-backend/src/lib/logger.ts` | 新增共享 logger 库 |
| `vibex-backend/src/app/api/v1/canvas/generate-contexts/route.ts` | console → logger |
| `vibex-backend/src/app/api/v1/canvas/generate-components/route.ts` | console → logger |
| `vibex-backend/src/app/api/v1/canvas/generate-flows/route.ts` | console → logger |
| `vibex-backend/src/services/websocket/connectionPool.ts` | console → logger |
| `vibex-backend/src/app/api/v1/chat/route.ts` | 空 catch → logger.error |
| `vibex-backend/.eslintrc.js` | 添加 no-empty 规则 |

### 2.4 Acceptance Tests

```typescript
// 验证无敏感词泄露
$ grep -r "console.log" dist/ | grep -E "entityId|token|usage|sk-|password"
// 预期：返回空

// 验证无空 catch
$ grep -rE "catch\s*\{\s*\}" src/
// 预期：返回空

// 验证 logger 替换
$ grep -r "console\.\(log\|warn\|error\|debug\)" src/app/api/v1/
// 预期：返回空（仅保留 logger 调用）
```

### 2.5 Rollback

```bash
git checkout HEAD~1 -- src/lib/logger.ts src/app/api/v1/
```

---

## 3. Story ST-06: Enable PrismaPoolManager

### 3.1 Problem

`lib/db.ts` 中 `PrismaPoolManager` 已完整实现，但所有 Prisma 调用都绕过连接池，每次调用新建连接：

```typescript
// 当前所有路由都是：
const prisma = new PrismaClient(); // 绕过连接池
await prisma.user.findMany();
```

### 3.2 Solution

```typescript
// lib/db.ts — 确保 PrismaPoolManager 正确导出
let pool: PrismaPoolManager | null = null;

export function getPrismaFromPool(): PrismaClient {
  if (!pool) {
    pool = new PrismaPoolManager({ maxConnections: 10 });
  }
  return pool.acquire();
}

export function returnPrismaToPool(prisma: PrismaClient) {
  pool?.release(prisma);
}

// 在路由中使用
const prisma = getPrismaFromPool();
try {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
} finally {
  returnPrismaToPool(prisma);
}
```

### 3.3 Files

| File | Change |
|------|--------|
| `vibex-backend/src/lib/db.ts` | 确认 PrismaPoolManager 正确导出 |
| `vibex-backend/src/__tests__/lib/db.test.ts` | 连接池复用率测试 |

### 3.4 Acceptance Tests

```typescript
describe('PrismaPoolManager', () => {
  it('should reuse same connection after release', () => {
    const pool = new PrismaPoolManager({ maxConnections: 10 });
    const prisma1 = pool.acquire();
    pool.release(prisma1);
    const prisma2 = pool.acquire();
    expect(prisma2).toBe(prisma1); // Same instance
  });

  it('should not leak connections', () => {
    const pool = new PrismaPoolManager({ maxConnections: 5 });
    for (let i = 0; i < 20; i++) {
      const p = pool.acquire();
      pool.release(p);
    }
    expect(pool.activeCount).toBeLessThanOrEqual(2);
  });
});
```

### 3.5 Rollback

```bash
git checkout HEAD~1 -- src/lib/db.ts
```
