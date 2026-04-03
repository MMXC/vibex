# Spec: DDD API Client — `dddApi.ts`

## Overview

SSE 客户端封装，复用后端已验证的 DDD API 端点。

## API Design

### `dddApi.generateContexts(requirementText: string): EventSource`

```ts
export const dddApi = {
  generateContexts: (text: string) => {
    const es = new EventSourcePolyfill(
      `/api/ddd/bounded-context/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirementText: text }),
        // SSE 不支持 POST，用 fetch + EventSource 桥接
      }
    );
    return es;
  }
};
```

### SSE Event Types

| Event | `event` field | `data` shape |
|-------|--------------|-------------|
| thinking | `thinking` | `{ message: string }` |
| context | `context` | `{ context: BoundedContext }` |
| done | `done` | `{}` |
| error | `error` | `{ message: string }` |

## Implementation Notes

1. 使用 `fetch` + `ReadableStream` 桥接 SSE（EventSource 仅支持 GET，DDD 端点需要 POST）
2. `AbortController` 控制 10s 超时
3. 错误通过 `onerror` 回调传递
4. 兼容 SSR（Node.js 环境使用 Node fetch）

## File Structure

```
src/lib/canvas/api/
  dddApi.ts          # SSE 客户端封装
  canvasApi.ts        # 已有 project/generate/status/export
```
