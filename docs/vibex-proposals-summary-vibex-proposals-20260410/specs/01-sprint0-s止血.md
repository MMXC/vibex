# Spec: Sprint 0 — 紧急止血

**Epic**: E1（全团队阻塞解锁）+ E2（运行时崩溃修复）
**Sprint**: Sprint 0
**工时**: 4h
**目标**: 解锁全团队 push 能力 + 修复部署/运行时阻塞

---

## Spec E1-S1: task_manager.py Token 环境变量化

### 1. 概述

`task_manager.py` 中 Slack bot token 硬编码在源码中，任何修改该文件的 commit 触发 GitHub secret scanning 全团队阻断。

### 2. 当前状态（问题代码）

```python
# task_manager.py（问题代码）
SLACK_BOT_TOKEN = "xoxb-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ← 硬编码，必须移除
```

### 3. 目标状态

```python
# task_manager.py（目标代码）
import os

SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")
if not SLACK_BOT_TOKEN:
    raise ValueError("SLACK_BOT_TOKEN environment variable is required")
```

### 4. 验收标准

- `process.env.SLACK_BOT_TOKEN` 读取成功（容器/环境变量注入）
- 源码中无硬编码 token 字符串（正则扫描 `xox[bap]-` 模式为空）
- 修改 `task_manager.py` 的任意 PR 可正常 push，不触发 secret scanning
- 未设置 `SLACK_BOT_TOKEN` 时脚本启动报错并 exit(1)

### 5. 副作用处理

- 所有调用 `task_manager.py` 的 CI 任务需确保环境变量注入
- `.env.example` 添加 `SLACK_BOT_TOKEN=` 行并注释说明

### 6. 测试用例

```python
# test_task_manager_env.py
def test_token_from_env(monkeypatch):
    monkeypatch.setenv("SLACK_BOT_TOKEN", "xoxb-test-token")
    import importlib
    import task_manager
    importlib.reload(task_manager)
    assert task_manager.SLACK_BOT_TOKEN == "xoxb-test-token"

def test_token_missing_raises():
    import os
    os.environ.pop("SLACK_BOT_TOKEN", None)
    # reload 后应抛出 ValueError
```

---

## Spec E2-S1: createStreamingResponse 闭包修复

### 1. 概述

`services/llm.ts` 中 `createStreamingResponse` 函数存在闭包引用未定义变量，导致 streaming API 调用时抛出 `ReferenceError`。

### 2. 排查方向

- 检查函数体内是否有引用外部变量但该变量未在闭包作用域中声明
- 检查 TypeScript 编译后变量提升（hoisting）导致的引用问题
- 典型 pattern：`const handler = () => { use(somethingDefinedLater) }`

### 3. 目标状态

- `tsc --noEmit` 零错误
- streaming API 端点手动测试通过（curl 或 Postman）
- 运行时日志无 "variable is not defined" 错误

### 4. 验收标准

```typescript
// expect(() => createStreamingResponse(req, stream)).not.toThrow(ReferenceError)
// expect(streamingResponse.headers['content-type']).toContain('text/event-stream')
```

### 5. 相关文件

- `services/llm.ts`（主要）
- `app/api/stream/*.ts`（如有 streaming 路由）
- `services/llm.test.ts`（单元测试）

---

## Spec E2-S2: PrismaClient Workers 守卫

### 1. 概述

8+ API 路由（login、generate 等）在 Cloudflare Workers 环境中直接使用 `new PrismaClient()`，违反 Workers 禁止全局对象访问规则，导致 `wrangler deploy` 失败。

### 2. 问题文件（不完全列表）

- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/generate/component/route.ts`
- 其他 6+ 使用 Prisma 的 API 文件

### 3. 目标状态

```typescript
// lib/prisma.ts（Workers-safe 初始化）
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 4. Workers 特定守卫

```typescript
// 仅在非 Workers 环境创建 PrismaClient
// Cloudflare Pages Functions 不需要此守卫（使用传统 Node.js runtime）
export function getPrismaClient(): PrismaClient {
  if (typeof globalThis.caches !== 'undefined' && typeof Request !== 'undefined') {
    // Workers 环境 — 使用 Durable Objects 或外部 DB
    return createWorkersPrismaClient();
  }
  return prisma;
}
```

### 5. 验收标准

- `wrangler deploy` 成功（CI 环境或本地验证）
- 所有 API 路由 Prisma 初始化在请求级别完成
- 无 "PrismaClient is not defined" 或 Workers 全局对象相关错误
- 连接池正确释放（无内存泄漏）

### 6. 副作用处理

- 更新 Prisma schema（如有新增 model）→ `prisma generate`
- 更新 `schema.prisma` 的 `provider` 确保兼容 Workers（SQLite 不兼容，需 PostgreSQL）
- 数据库连接字符串通过环境变量注入（Workers secret）

---

## Spec E2-S3: SSE Stream 超时控制

### 1. 概述

Streaming API（Server-Sent Events）未实现超时控制，`AbortController` 未传递到 Worker，导致：
1. 连接永不关闭（客户端/网络异常时）
2. Worker setInterval 被禁用（Cloudflare Workers 限制），超时逻辑失效
3. 潜在资源泄漏

### 2. 目标状态

```typescript
// services/stream.ts
export async function createSSEStream(
  req: Request,
  options: { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 60_000 } = options; // 默认 60s
  const controller = new ReadableStreamDefaultController();
  const encoder = new TextEncoder();

  // AbortController for timeout
  const timeoutId = setTimeout(() => {
    controller.close();
    console.log('[SSE] Stream timed out after', timeoutMs, 'ms');
  }, timeoutMs);

  // 若客户端断开，优雅关闭
  req.signal?.addEventListener('abort', () => {
    clearTimeout(timeoutId);
    controller.close();
  });

  try {
    for await (const chunk of dataGenerator()) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
  } catch (err) {
    controller.error(err);
  } finally {
    clearTimeout(timeoutId);
  }

  return new Response(
    new ReadableStream({
      start(controller) {
        // 将超时 controller 绑定到外部 controller
      },
      cancel() {
        clearTimeout(timeoutId);
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
      },
    }
  );
}
```

### 3. 验收标准

- streaming 请求超过 60s 自动断开（`controller.close()` 被调用）
- 客户端断开时，服务器端立即清理（无 orphaned timeout）
- Worker 内存稳定（setTimeout 正确清理）
- CI 有对应的超时测试

### 4. 相关文件

- `services/stream.ts`（新建或修改）
- `services/llm.ts`（streaming 逻辑）
- `app/api/stream/*.ts`
