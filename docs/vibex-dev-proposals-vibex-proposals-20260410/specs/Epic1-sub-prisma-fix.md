# Epic Spec: Epic1-sub-prisma-fix — Prisma + Workers 核心修复

**Epic**: Epic1-sub-prisma-fix  
**Parent**: vibex-dev-proposals-vibex-proposals-20260410  
**Stories**: ST-01, ST-02  
**Total Estimate**: 2.0h  
**Priority**: P0  

---

## Story ST-01: 修复 `createStreamingResponse` this 引用

### 文件
`services/llm.ts`

### 问题描述
`createStreamingResponse` 方法中，`thisLLMService` 变量在 `ReadableStream.start()` 方法执行后才被赋值，导致闭包内引用 `thisLLMService` 时为 `undefined`，引发 `ReferenceError`。

### 技术方案
采用**方案 A：提前绑定 this**（最小改动，向后兼容）：
1. 将 `const thisLLMService = this;` 移到 `ReadableStream` 构造之前
2. 在 `start` 方法中添加 `try/finally` 确保 `controller.close()`
3. 移除方法末尾的错误顺序赋值

### 实现步骤
```typescript
// 修复前（错误顺序）
async createStreamingResponse(options, onChunk?) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of thisLLMService.streamChat(options)) { // ← 此时 thisLLMService 未定义
        controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
        onChunk?.(chunk);
      }
      controller.close();
    },
  });
  const thisLLMService = this; // ← 赋值太晚
  return new Response(stream, {...});
}

// 修复后（正确顺序）
async createStreamingResponse(options, onChunk?) {
  const thisLLMService = this; // ← 提前绑定 ✅
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of thisLLMService.streamChat(options)) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
          onChunk?.(chunk);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

### 验收测试
```typescript
// tests/unit/llm.test.ts
describe('createStreamingResponse', () => {
  it('should not throw ReferenceError when streaming', async () => {
    const svc = new LLMService(mockEnv);
    const response = svc.createStreamingResponse({ prompt: 'hello' });
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });

  it('should encode chunks as SSE format', async () => {
    const chunks: string[] = [];
    const svc = new LLMService(mockEnv);
    const response = svc.createStreamingResponse({ prompt: 'hello' }, (chunk) => {
      chunks.push(JSON.stringify(chunk));
    });
    // 读取 stream 验证格式
    const reader = response.body!.getReader();
    const { value } = await reader.read();
    expect(new TextDecoder().decode(value)).toContain('\n');
  });
});
```

### 页面集成
- Chat 页面 → `/api/chat` → `services/llm.ts`
- 流式生成状态直接影响用户感知

---

## Story ST-02: 统一 Workers DB 客户端

### 文件
`lib/db.ts`, 8+ API routes

### 问题描述
`app/api/auth/login/route.ts` 等 8+ 文件直接 `import { PrismaClient } from '@prisma/client'` 并 `new PrismaClient()`，在 Cloudflare Workers 环境中无 Prisma 驱动，部署时报错或连接失败。

### 技术方案
扩展 `lib/db.ts` 的 `getDBClient()` 统一分发：
1. **Workers 环境** → 返回 D1 binding 兼容层
2. **本地环境** → 返回 PrismaClient 实例

```typescript
// lib/db.ts（扩展）
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    });
  }
  return prisma;
}

export function getDBClient() {
  if (isWorkers && typeof globalThis.caches !== 'undefined') {
    // Workers 环境：D1 binding
    return createD1CompatLayer(env.D1_DB);
  }
  // 本地：Prisma SQLite
  return getPrismaClient();
}

// D1 兼容层（可选，按需实现）
function createD1CompatLayer(d1) {
  return {
    user: {
      findUnique: (args) => d1.prepare('SELECT * FROM User WHERE id = ?').bind(args.where.id).first(),
      findMany: (args) => d1.prepare('SELECT * FROM User').all(),
      // ... 按需扩展
    },
  };
}
```

### 需修改的 8+ 路由文件
| 文件 | 修改内容 |
|------|---------|
| `app/api/auth/login/route.ts` | `new PrismaClient()` → `getDBClient()` |
| `app/api/v1/auth/login/route.ts` | 同上 |
| `app/api/v1/auth/register/route.ts` | 同上 |
| `app/api/v1/flows/[flowId]/route.ts` | 同上 |
| `app/api/v1/messages/route.ts` | 同上 |
| `app/api/v1/messages/[messageId]/route.ts` | 同上 |
| `app/api/v1/users/[userId]/route.ts` | 同上 |
| `app/api/v1/canvas/generate-contexts/route.ts` | 同上 |

### 验收测试
```typescript
// tests/integration/workers-db.test.ts
describe('Workers DB Client', () => {
  it('should return D1 client in Workers env', () => {
    // Mock isWorkers = true
    const client = getDBClient();
    expect(client).toBeDefined();
    expect(typeof client.prepare).toBe('function');
  });

  it('should return PrismaClient locally', () => {
    // Mock isWorkers = false
    const client = getDBClient();
    expect(client).toBeInstanceOf(PrismaClient);
  });

  it('should not throw "PrismaClient is not a constructor" in Workers', () => {
    // Wrangler deploy --dry-run 验证
    expect(() => require('@prisma/client')).not.toThrow();
  });
});
```

### 页面集成
- 所有需要数据库的 API 路由均依赖此修复
- Auth 登录/注册 → D-02 阻断修复后可用

---

## Epic 验收

- [ ] ST-01 + ST-02 均通过单元/集成测试
- [ ] `wrangler deploy --dry-run` 无 PrismaClient 警告
- [ ] 本地 `pnpm dev` API 路由正常工作
- [ ] 无新增 lint/typecheck 错误
