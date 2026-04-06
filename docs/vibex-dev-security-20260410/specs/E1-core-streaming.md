# Epic 1: Core Infrastructure & Streaming

**Project**: vibex-dev-security-20260410
**Epic ID**: E1
**Stories**: ST-01, ST-02
**Priority**: P0
**Estimated Effort**: 2.5h

---

## 1. Overview

修复 Vibex backend 的两个 P0 部署阻断问题：
1. **ST-01**: LLM 流式响应 `this` 绑定错误，导致 ReadableStream 运行时崩溃
2. **ST-02**: PrismaClient 未在 Workers 环境中隔离，导致部署失败

---

## 2. Story ST-01: Fix `createStreamingResponse` this Binding

### 2.1 Problem

```typescript
// services/llm.ts — 当前代码（有 bug）
async createStreamingResponse(options, onChunk?) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of thisLLMService.streamChat(options)) {
        // ↑ thisLLMService 在此引用，行序在下方的赋值之前
        controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
        onChunk?.(chunk);
      }
      controller.close();
    },
  });
  const thisLLMService = this; // ← 赋值在 ReadableStream 构造之后
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

`ReadableStream` 构造函数是同步执行的，`start()` 方法在构造期间立即运行，此时 `const thisLLMService = this` 尚未执行，导致 `thisLLMService` 为 `undefined`。

### 2.2 Solution

在 `ReadableStream` 构造之前捕获 `this` 引用：

```typescript
// services/llm.ts — 修复后
async createStreamingResponse(options, onChunk?) {
  const self = this; // ← 在 ReadableStream 构造前绑定
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of self.streamChat(options)) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
          onChunk?.(chunk);
        }
        controller.close();
      } catch (e) {
        controller.error(e); // 错误时必须调用 error()，不可静默
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 2.3 Files

| File | Change |
|------|--------|
| `vibex-backend/src/services/llm.ts` | 修复 this 绑定，添加 try/catch + error() |
| `vibex-backend/src/__tests__/services/llm.test.ts` | 新增流式响应测试（2 cases） |

### 2.4 Acceptance Tests

```typescript
// __tests__/services/llm.test.ts
describe('createStreamingResponse', () => {
  it('should start stream without ReferenceError', async () => {
    const service = new LLMService(mockEnv);
    const response = await service.createStreamingResponse({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'hello' }],
    });
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    // Stream should start without throwing
  });

  it('should call onChunk callback for each chunk', async () => {
    const chunks: string[] = [];
    const service = new LLMService(mockEnv);
    const response = await service.createStreamingResponse(
      { model: 'gpt-4', messages: [] },
      (chunk) => chunks.push(JSON.stringify(chunk))
    );
    // Cancel to stop iteration
    await response.body.cancel();
    // Chunks should be collected
  });
});
```

### 2.5 Rollback

```bash
# Rollback: revert services/llm.ts to previous commit
git checkout HEAD~1 -- src/services/llm.ts
```

---

## 3. Story ST-02: Unified Workers DB Client

### 3.1 Problem

多个 API 路由文件直接实例化 `PrismaClient`：

```typescript
// app/api/v1/chat/route.ts — 当前（有 bug）
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Workers 环境中不存在
```

Workers 运行时无 Prisma 驱动，导致冷启动报错：`PrismaClient is not a constructor`。

`lib/db.ts` 中已有 `isWorkers` 守卫逻辑，但 API 路由未统一使用。

### 3.2 Solution

创建统一的 `getDBClient()` 函数，所有路由替换：

```typescript
// lib/db.ts — 扩展现有实现
export function getDBClient(env: CloudflareEnv, isWorkers = false) {
  if (isWorkers) {
    return createD1Client(env.D1_DB);
  }
  return new PrismaClient();
}

// 替换模式（8+ 路由文件）
// 替换前：
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 替换后：
import { getDBClient } from '@/lib/db';
const prisma = getDBClient(env, isWorkers);
```

### 3.3 Affected Files

| 文件 | 替换模式 |
|------|---------|
| `app/api/v1/chat/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/canvas/generate/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/canvas/generate-contexts/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/canvas/generate-components/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/canvas/generate-flows/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/canvas/stream/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/canvas/status/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/canvas/export/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/canvas/project/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/ai-ui-generation/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/domain-model/[projectId]/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/prototype-snapshots/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/prototype-snapshots/[id]/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/agents/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/agents/[id]/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/pages/route.ts` | PrismaClient → getDBClient |
| `app/api/v1/pages/[id]/route.ts` | PrismaClient → getDBClient |

### 3.4 Acceptance Tests

```typescript
// 验证无 PrismaClient bundle 警告
$ wrangler deploy --dry-run
// 预期：无 "@prisma/client" 警告

// 验证本地回归
$ pnpm --filter vibex-backend run test
// 预期：所有测试通过

// 验证无直接 PrismaClient 实例化
$ grep -r "new PrismaClient()" vibex-backend/src/app/api/
// 预期：返回空
```

### 3.5 Rollback

```bash
# Rollback: revert all route files
git checkout HEAD~1 -- src/app/api/v1/
# Re-deploy
```

---

## 4. Epic 1 Dependencies

```
无外部依赖
Epic 1 是所有其他 Epic 的基础（ST-02 提供统一的 DB 客户端）
```
