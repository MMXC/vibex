# SPEC — Epic 2: SSE 与 AI Service 可靠性

**项目**: vibex-architect-proposals-vibex-proposals-20260410
**Epic**: Epic 2 — SSE 与 AI Service 可靠性
**Stories**: ST-03, ST-04
**总工时**: 10h
**状态**: Ready for Development

---

## 1. Overview

解决 SSE 流式响应的连接清理问题和 AI Service timeout 配置混乱，确保长时间运行的 AI 请求可被正确中断，防止 Worker 内存泄漏和 zombie 连接。

**根因**: `aiService.chat()` 无超时控制，`AbortController` 未传递到 fetch 调用，`setTimeout` 未在 `cancel()` 中清理。

---

## 2. Story: ST-03 — SSE AbortController 集成（6h）

### 2.1 目标
在 `ai-service.ts` 中全面集成 `AbortController`，确保 SSE 流超时后 100% 正确中断，无 zombie 连接残留。

### 2.2 实施步骤

#### 2.2.1 重构 ai-service.ts

```typescript
// vibex-backend/src/services/ai-service.ts

const DEFAULT_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS ?? '120000', 10); // 2min

interface ChatOptions {
  messages: Message[];
  model?: string;
  timeoutMs?: number;  // ← 请求级别 timeout 覆盖
  signal?: AbortSignal; // ← 可接收外部传入的 signal
}

async function chat(options: ChatOptions): Promise<ChatResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();

  // 合并外部 signal 和本地 controller
  const signal = options.signal
    ? anySignal([options.signal, controller.signal])
    : controller.signal;

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const result = await llmProvider.chat(options.messages, { signal });
    return result;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AIAbortError(`Request aborted after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);  // ← 必须在 finally 中清理
  }
}
```

#### 2.2.2 SSE Stream 路由集成

```typescript
// vibex-backend/src/routes/ai/stream.ts

export async function POST(req: Request): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = getTimeoutFromRequest(req);  // 复用配置化逻辑

  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const stream = new ReadableStream({
    async start(enqueue) {
      try {
        const result = await aiService.chat({
          messages: await req.json(),
          signal: controller.signal,
        });
        for await (const chunk of result) {
          enqueue(chunk);
        }
      } finally {
        clearTimeout(timeout);  // ← 确保清理
      }
    },
    cancel() {
      clearTimeout(timeout);
      controller.abort();  // ← cancel() 回调中也要 abort
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

#### 2.2.3 禁止模式检查

```bash
# 确保项目中无 setInterval 使用（Workers 环境禁用）
grep -rn "setInterval" vibex-backend/src/ --include="*.ts"
```

### 2.3 验收条件

| 条件 | 验证方式 |
|------|---------|
| ai-service.ts 所有 fetch 调用传递 `signal` | Code review + grep |
| `setTimeout` 在 `finally` 或 `cancel()` 中被 `clearTimeout` | Code review |
| 无 `setInterval` 调用 | `grep -rn "setInterval" src/` 返回空 |
| 超时后 zombie 连接数为 0 | E2E 压测验证 |

### 2.4 验收测试

```typescript
test('aiService.chat 支持 AbortController signal', async () => {
  const controller = new AbortController();
  const shortTimeout = { timeoutMs: 100 };

  const promise = aiService.chat({ messages: [], ...shortTimeout, signal: controller.signal });
  await new Promise(r => setTimeout(r, 200));  // 让 timeout 触发

  // 应该抛出 AbortError
  await expect(promise).rejects.toThrow(AIAbortError);
});

test('timeout 后 clearTimeout 被调用（无 zombie）', async () => {
  const warnSpy = vi.spyOn(console, 'warn');
  vi.useFakeTimers();

  const controller = new AbortController();
  const promise = aiService.chat({ messages: [], timeoutMs: 5000, signal: controller.signal });

  await vi.advanceTimersByTimeAsync(6000);
  await expect(promise).rejects.toThrow();

  // 无 timer leak warnings
  expect(warnSpy).not.toHaveBeenCalledWith(/timer.*not cleared/);
  vi.useRealTimers();
});
```

---

## 3. Story: ST-04 — AI Timeout 配置化（4h）

### 3.1 目标
将 AI timeout 从硬编码改为环境变量配置，支持请求级别覆盖。

### 3.2 实施步骤

#### 3.2.1 环境变量配置

```bash
# .env.example
AI_TIMEOUT_MS=120000        # 默认 2 分钟
AI_RETRY_COUNT=3
AI_RETRY_BASE_DELAY_MS=1000
```

#### 3.2.2 统一配置模块

```typescript
// vibex-backend/src/config/ai.ts

interface AIConfig {
  timeoutMs: number;
  retryCount: number;
  retryBaseDelayMs: number;
}

export const aiConfig: AIConfig = {
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '120000', 10),
  retryCount: parseInt(process.env.AI_RETRY_COUNT ?? '3', 10),
  retryBaseDelayMs: parseInt(process.env.AI_RETRY_BASE_DELAY_MS ?? '1000', 10),
};
```

#### 3.2.3 请求级别覆盖

```typescript
// 支持在请求中传入 timeoutMs 覆盖默认值
async function chat(options: ChatOptions): Promise<ChatResult> {
  const timeoutMs = options.timeoutMs ?? aiConfig.timeoutMs;
  // ... 实现
}
```

### 3.3 验收条件

| 条件 | 验证方式 |
|------|---------|
| `AI_TIMEOUT_MS` 环境变量存在时生效 | `process.env.AI_TIMEOUT_MS=5000` → timeout 为 5s |
| 请求级别 `timeoutMs` 可覆盖默认 | `chat({ timeoutMs: 1000 })` → timeout 为 1s |
| 默认值合理（120s） | 无 env var 时为 120s |

### 3.4 验收测试

```typescript
test('环境变量 AI_TIMEOUT_MS 生效', () => {
  vi.stubEnv('AI_TIMEOUT_MS', '5000');
  const config = loadAIConfig();
  expect(config.timeoutMs).toBe(5000);
  vi.unstubAllEnvs();
});

test('请求级别 timeout 覆盖默认', async () => {
  vi.stubEnv('AI_TIMEOUT_MS', '120000');
  const result = await aiService.chat({
    messages: [],
    timeoutMs: 5000,  // ← 覆盖
  });
  // 验证使用了 5s 而非 120s
  expect(result).toBeDefined();  // 或通过 mock 验证超时设置
});
```

---

## 4. DoD Checklist — Epic 2

- [ ] `ai-service.ts` 所有外部 fetch 调用传递 `signal: controller.signal`
- [ ] `setTimeout` 在 `finally` 块中被 `clearTimeout` 清理
- [ ] `cancel()` 回调中触发 `controller.abort()`
- [ ] `grep -rn "setInterval" vibex-backend/src/` 返回空
- [ ] `AI_TIMEOUT_MS` 环境变量支持读取
- [ ] 请求级别 `timeoutMs` 参数可覆盖默认值
- [ ] E2E 压测验证 SSE 超时后无 zombie 连接
- [ ] `pnpm test` 全部通过
- [ ] PR 已合并到 main

---

*Spec 由 PM Agent 基于 architect 分析文档生成 — 2026-04-10*
