# SPEC: E2 - P1 数据完整性与安全

> **所属 Epic**: E2
> **PRD**: vibex-dev-proposals-vibex-proposals-20260408/prd.md
> **前置 Epic**: E1（建议 E1 先合并到 staging）
> **状态**: Ready for Dev

---

## 1. 概述

修复 3 个影响数据完整性和安全性的问题：JWT 配置缺失静默放行、SSE buffer 边界 bug、lock 原子性不足。

---

## 2. S2.1: JWT_SECRET 缺失强制拒绝

### 文件

- `vibex-backend/src/lib/auth.ts`

### 变更

```typescript
// 1. verifyToken 增加启动告警
export function verifyToken(token: string, jwtSecret: string): JWTPayload | null {
  if (!jwtSecret) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[AUTH] FATAL: JWT_SECRET is not configured!');
    }
    return null;
  }
  // ... existing JWT verification
}

// 2. authMiddleware 增加配置检查（前置守卫）
export async function authMiddleware(c: AuthContext, next: Next) {
  if (!c.env.JWT_SECRET) {
    return c.json(
      { error: 'Server misconfigured: JWT_SECRET missing' },
      500
    );
  }
  // ... existing auth logic
}
```

### 验收

```typescript
// spec: auth.middleware.spec.ts
describe('authMiddleware JWT_SECRET checks', () => {
  it('should return 500 when JWT_SECRET is empty string', async () => {
    const res = await app.request('/protected', {}, { env: { JWT_SECRET: '' } });
    expect(res.status).toBe(500);
  });

  it('should return 500 when JWT_SECRET is undefined', async () => {
    const res = await app.request('/protected', {}, { env: {} });
    expect(res.status).toBe(500);
  });

  it('should log FATAL to console.error when JWT_SECRET is missing', async () => {
    const warnSpy = vi.spyOn(console, 'error');
    verifyToken('any', '');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[AUTH] FATAL'));
  });

  it('should return 200 with valid JWT when JWT_SECRET is set', async () => {
    const token = signToken({ userId: 'u1' }, 'secret');
    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${token}` }
    }, { env: { JWT_SECRET: 'secret' } });
    expect(res.status).toBe(200);
  });

  it('should return 401 with invalid JWT even when JWT_SECRET is set', async () => {
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalid' }
    }, { env: { JWT_SECRET: 'secret' } });
    expect(res.status).toBe(401);
  });
});
```

---

## 3. S2.2: SSE buffer 行缓冲重构

### 文件

- `vibex-backend/src/routes/ai-design-chat.ts`

### 变更

将累积 buffer + `split('\n')` + `pop()` 模式替换为行缓冲：

```typescript
// 行缓冲 SSE 解析器
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let lineBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // 流结束时，若 lineBuffer 有内容，尝试解析
      if (lineBuffer.trim()) {
        yield parseSSELine(lineBuffer);
      }
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    lineBuffer += chunk;

    // 按行分割
    let newlineIndex;
    while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
      const line = lineBuffer.slice(0, newlineIndex);
      lineBuffer = lineBuffer.slice(newlineIndex + 1);

      if (!line.trim()) continue; // 跳过空行
      if (!line.startsWith('data: ')) continue;

      const data = line.slice(6).trim();
      if (data === '[DONE]') return;

      yield parseSSELine(data);
    }
  }
}

function parseSSELine(data: string): SSEEvent {
  try {
    return JSON.parse(data);
  } catch {
    return { type: 'raw', raw: data };
  }
}
```

### 验收

```typescript
// spec: sse-buffer.spec.ts
describe('SSE line buffer', () => {
  it('should preserve incomplete line at buffer boundary', async () => { ... });
  it('should correctly parse multi-line SSE events', async () => { ... });
  it('should skip empty lines', async () => { ... });
  it('should stop on [DONE]', async () => { ... });
  it('should handle chunk that ends mid-line', async () => { ... });
  it('should not lose data when chunk contains multiple complete lines', async () => { ... });
});
```

---

## 4. S2.3: lock 原子性保证

### 文件

- `vibex-backend/src/services/CollaborationService.ts`

### 变更

D-P0-1 的 S1.1 已实现乐观锁语义。本 Story 确认：

```typescript
// acquireLock 必须包含 hasLock 检查（原子性保证）
async acquireLock(projectId: string, stageId: string, ttlMs = 300_000): Promise<void> {
  if (await this.hasLock(projectId, stageId)) {
    throw new LockHeldError(`Lock already held for ${projectId}/${stageId}`);
  }
  // ...
}

// 新增：acquireLock 的竞态场景测试
it('should prevent race condition between concurrent acquireLock calls', async () => {
  const svc = new CollaborationService(tmpDir);
  const results = await Promise.allSettled([
    svc.acquireLock('p1', 's1'),
    svc.acquireLock('p1', 's1'),
  ]);
  const successes = results.filter(r => r.status === 'fulfilled');
  const failures = results.filter(r => r.status === 'rejected');
  expect(successes.length).toBe(1);
  expect(failures.length).toBe(1);
  expect(failures[0].reason).toBeInstanceOf(LockHeldError);
});
```

### 验收

```typescript
// spec: CollaborationService.atomicity.spec.ts
describe('CollaborationService lock atomicity', () => {
  it('should throw on second acquireLock call without release', async () => { ... });
  it('should prevent race condition between concurrent acquireLock calls', async () => { ... });
  it('should allow re-acquire after releaseLock', async () => { ... });
  it('should throw LockHeldError with correct message', async () => { ... });
});
```

---

## 5. E2 Epic DoD Checklist

- [ ] D-P1-1: auth middleware 5 个测试用例全部通过
- [ ] D-P1-2: SSE 行缓冲 6 个边界 case 测试通过
- [ ] D-P1-3: lock 原子性 4 个测试用例通过
- [ ] E1 + E2 合并后 staging 验证通过
- [ ] 代码 review 通过（至少 1 人）
- [ ] `npm run test -- --run` 全部通过
