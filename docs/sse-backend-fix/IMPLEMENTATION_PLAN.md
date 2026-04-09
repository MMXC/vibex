# SSE Backend Fix — Implementation Plan

> **项目**: sse-backend-fix
> **版本**: 1.0
> **日期**: 2026-04-09
> **状态**: Draft
> **Agent**: architect

---

## 概述

本文档定义 SSE Backend Fix 的实施计划，基于 `architecture.md` 中的技术设计。

---

## Phase 1: 阻塞性修复（1.5d）

### Epic 1: SSE 超时稳定性修复

#### [DONE] F1.1: AI 调用超时 10s → 30s

**修改文件**: `vibex-backend/src/lib/sse-stream-lib/index.ts`

**变更点**:
```diff
export interface SSEStreamOptions {
  requirement: string;
  env: CloudflareEnv;
  requestSignal?: AbortSignal;
+  timeout?: number; // 新增，默认 30_000
+  errorClassifier?: (err: unknown, ctx: ErrorContext) => SSEErrorType;
}

export function buildSSEStream({ requirement, env, requestSignal }: SSEStreamOptions): ReadableStream {
+  const timeout = options.timeout ?? 30_000;
-  addTimer(() => { abortController?.abort(); }, 10_000);
+  addTimer(() => { abortController?.abort(); }, timeout);
}
```

**验收测试**: `F1.1 jest test` — `timeout === 30000`

#### [DONE] F1.2: 超时计时器触发 Abort + 清理

**修改文件**: `vibex-backend/src/lib/sse-stream-lib/index.test.ts`

**变更点**: 在现有测试套件中增加：
1. `advanceTimersByTime(31_000)` → `abortController.abort` 被调用
2. `sseStream.timers.length === 0` 验证

**验收测试**: `F1.2 jest fake timers test` — abort + timers 清空

---

### Epic 3: SSE 错误可诊断性

#### [DONE] F3.1: errorType 分类函数

**新增文件**: `vibex-backend/src/lib/sse-stream-lib/error-classifier.ts`

**实现**:
```typescript
export type SSEErrorType = 'timeout' | 'network' | 'llm_error';

export interface ErrorContext {
  stage: 'context' | 'model' | 'flow' | 'components';
}

export function errorClassifier(err: unknown, _ctx: ErrorContext): SSEErrorType {
  // 1. AbortError / timeout
  if (err instanceof DOMException && err.name === 'AbortError') return 'timeout';
  if (err instanceof Error && err.name === 'AbortError') return 'timeout';
  
  // 2. LLM API 错误
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (e.success === false) return 'llm_error';
  }
  
  // 3. 网络错误
  if (err instanceof Error) {
    if (err.message.includes('fetch') || err.message.includes('network') ||
        err.message.includes('ECONNREFUSED')) return 'network';
  }
  
  // 4. 兜底
  return 'llm_error';
}
```

#### [DONE] F3.2: SSE error 事件包含 errorType

**修改文件**: `vibex-backend/src/lib/sse-stream-lib/index.ts`

**变更点**:
```diff
catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Stream processing failed';
- sendSSE(controller, 'error', { message: errorMessage, code: 'STREAM_ERROR' });
+ const errorType = errorClassifier(err, { stage: currentStage });
+ sendSSE(controller, 'error', { message: errorMessage, code: 'STREAM_ERROR', errorType });
}
```

**验收测试**: F3.1 unit test 覆盖三种 errorType 分类

---

## Phase 2: 错误处理与诊断（1.5d）

### Epic 2: Chat SSE 可靠性增强

#### F2.1: Chat SSE 添加 30s 超时

**修改文件**: `vibex-backend/src/app/api/v1/chat/route.ts`

**变更点**:
```typescript
// Chat SSE 添加超时控制（F2.1）
const abortController = new AbortController();
const timeoutId = setTimeout(() => abortController.abort(), 30_000);

try {
  // 流式处理...
} catch (error) {
  const errorType = classifyError(error);
  controller.enqueue(encoder.encode(
    `data: ${JSON.stringify({ error: errorMessage, errorType })}\n\n`
  ));
} finally {
  clearTimeout(timeoutId);
  abortController.abort();
  controller.close();
}
```

#### F2.2: Client disconnect 信号转发

**变更点**: 在 `ReadableStream.start()` 中监听 `request.signal`：
```typescript
request.signal.addEventListener('abort', () => {
  clearTimeout(timeoutId);
  abortController.abort();
  try { controller.close(); } catch {}
});
```

#### F2.3: conversationId 首事件返回

**变更点**: 已在现有代码中实现（首次 `enqueue` 包含 `conversationId`）。验证并补充测试。

#### F2.4: Chat SSE 集成测试

**新增文件**: `vibex-backend/src/app/api/v1/chat/route.test.ts`

**Mock MiniMax 延迟策略**:
```typescript
// Mock MiniMax API with configurable delay
jest.mock('@/lib/minimax-client', () => ({
  createMiniMaxStream: jest.fn().mockImplementation((opts) => {
    return new ReadableStream({
      start(controller) {
        setTimeout(() => {
          // send data...
        }, opts.delay || 0);
      }
    });
  })
}));
```

**测试用例**:
1. 正常 5s 完成 → 200 OK，events 包含 done
2. 35s 延迟 → timeout error，errorType === 'timeout'
3. 首事件包含 conversationId

---

### Epic 4: Hono/Next.js 路由一致性

#### F4.1: 路由参数一致性审查

**审查项**: 对比 `/v1/canvas/stream`（Next.js）和 `/v1/canvas/stream`（Hono）的 `sse-stream-lib` 调用参数。

**验证点**: `requestSignal` 在两套路由中均被正确传递。

#### F4.2: Canvas stream 集成测试

**新增文件**: `vibex-backend/src/app/api/v1/canvas/__tests__/stream.test.ts`

**验证**: SSE 事件序列 `thinking → step_context → step_model → step_flow → step_components → done`

---

## Phase 3: 测试覆盖与稳定性（2.0d）

### Epic 5: 测试覆盖

#### F5.1: Canvas stream 集成测试（Vitest）

**新增文件**: `vibex-backend/src/app/api/v1/canvas/__tests__/stream.test.ts`

**验收**: 200 OK，完整事件序列，无 premature close

#### F5.2: Playwright E2E 测试

**新增文件**: `vibex-fronted/tests/sse-e2e.spec.ts`

**测试场景**:
```typescript
test('Canvas SSE completes full event sequence', async ({ page }) => {
  await page.goto('/canvas');
  await page.fill('[data-testid=prompt-input]', 'test prompt');
  
  const events = await collectSSEEvents(page);
  
  expect(events.map(e => e.type)).toEqual([
    'thinking', 'step_context', 'step_model', 'step_flow', 'step_components', 'done'
  ]);
});
```

#### F5.3: flaky-tests.json 清零行动

**步骤**:
1. 读取 `vibex-fronted/flaky-tests.json`
2. 筛选 SSE 相关条目
3. 逐条分析 flaky 原因（timeout？network？mock 不稳定？）
4. 修复或标记 `skip`
5. CI 验证通过率 ≥95%

---

## 实施顺序

```
Phase 1 (1.5d)
├── F1.1: sse-stream-lib timeout 参数化
│   └── sse-stream-lib/index.ts + unit test
├── F1.2: 超时 Abort + cleanup 测试
│   └── sse-stream-lib/index.test.ts (扩展)
├── F3.1: errorClassifier 函数
│   └── 新建 error-classifier.ts + unit test
└── F3.2: error 事件带 errorType
    └── sse-stream-lib/index.ts (catch 块)
        └── unit test 验证 errorType 存在

Phase 2 (1.5d)
├── F2.1: Chat SSE 30s 超时
│   └── chat/route.ts
├── F2.2: Client disconnect 清理
│   └── chat/route.ts
├── F2.3: conversationId 首事件验证
│   └── chat/route.test.ts
├── F2.4: Chat SSE 集成测试
│   └── 新建 chat/route.test.ts
├── F4.1: 路由参数一致性审查
│   └── 代码审查
└── F4.2: Canvas stream 集成测试
    └── 新建 canvas/stream.test.ts

Phase 3 (2.0d)
├── F5.1: Canvas stream 集成测试
│   └── canvas/stream.test.ts (扩展)
├── F5.2: Playwright E2E 测试
│   └── 新建 sse-e2e.spec.ts
└── F5.3: flaky-tests.json 清零
    └── 分析 + 修复 + CI 验证
```

---

## 验收检查单

- [ ] Phase 1 完成后：SSE 超时 30s，所有 error 事件包含 errorType
- [ ] Phase 2 完成后：Chat SSE 可靠，路由参数一致，集成测试覆盖
- [ ] Phase 3 完成后：Playwright E2E 上线，flaky-tests 清零 50%
- [ ] 每个 Epic 完成后：DoD 检查，CI 测试通过
- [ ] 全部完成后：端到端验证（gstack /browse 验证真实环境）

---

## 资源与依赖

| 依赖 | 说明 |
|------|------|
| `vibex-backend/src/lib/sse-stream-lib/` | 核心修改点 |
| `vibex-backend/src/app/api/v1/chat/route.ts` | Chat SSE 增强 |
| `vibex-backend/src/app/api/v1/canvas/stream/route.ts` | Canvas SSE（受益于共享库） |
| `vibex-fronted/tests/sse-e2e.spec.ts` | 新建 E2E 测试 |
| MiniMax API | 上游依赖（需有效 API Key） |
| `flaky-tests.json` | 测试稳定性基线 |
