# E1: SSE 稳定性修复 - 详细规格

## S1.1 SSE 超时控制

### 目标
在 `buildSSEStream` 中为 `aiService.chat()` 添加超时控制，防止 Worker 无限期等待。

### 实施方案
```typescript
// src/lib/sse-stream-lib/index.ts

export async function buildSSEStream({ requirement, env }: SSEStreamOptions): Promise<ReadableStream> {
  return new ReadableStream({
    async start(controller) {
      const abortController = new AbortController();
      
      // 10s 超时
      const timeoutId = setTimeout(() => {
        abortController.abort();
        controller.close();
      }, 10000);

      try {
        const stage1Result = await aiService.chat(stage1Prompt, {
          signal: abortController.signal
        });
        controller.enqueue(`data: ${JSON.stringify(stage1Result)}\n\n`);
        // ... stage2, stage3
        controller.close();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('[SSE] Stream timed out after 10s');
        }
        controller.close();
      } finally {
        clearTimeout(timeoutId);
      }
    },
    cancel() {
      // 清理逻辑在 cancel 回调中处理
    }
  });
}
```

### 验收断言
```typescript
// __tests__/sse-stream-lib.test.ts

describe('SSE Stream Timeout', () => {
  it('should close stream after 10s of no response', async () => {
    const mockAiService = { chat: vi.fn().mockImplementation(() => 
      new Promise(r => setTimeout(r, 15000)) // 模拟 15s 延迟
    )};
    
    const stream = await buildSSEStream({ 
      requirement: 'test', 
      env: {} as any,
      aiService: mockAiService 
    });
    
    const start = Date.now();
    const reader = stream.getReader();
    
    // 应该 10s 内抛出或关闭
    try {
      await reader.read();
    } catch {}
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(12000);
  }, 15000);
});
```

### DoD Checklist
- [ ] AbortController.timeout(10000) 或 setTimeout(10000) 实现
- [ ] 超时后 controller.close() 被调用
- [ ] 计时器在 finally 或 cancel 中清理
- [ ] jest 测试通过

---

## S1.2 SSE 连接清理

### 目标
在客户端断开时立即清理 SSE 流，包括计时器和内存引用。

### 实施方案
```typescript
export async function buildSSEStream({ requirement, env }: SSEStreamOptions): Promise<ReadableStream> {
  const timers: number[] = [];
  
  return new ReadableStream({
    async start(controller) {
      const abortController = new AbortController();
      
      // AbortSignal 监听客户端断开
      abortController.signal.addEventListener('abort', () => {
        console.log('[SSE] Client disconnected, closing stream');
        controller.close();
        timers.forEach(clearTimeout);
      });

      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 10000);
      timers.push(timeoutId);

      // ... AI 调用逻辑
      
      const intervalId = setInterval(() => {
        controller.enqueue(`data: ping\n\n`);
      }, 30000);
      timers.push(intervalId);

      try {
        // ... 流处理
      } finally {
        timers.forEach(clearTimeout);
      }
    },
    cancel() {
      // ReadableStream.cancel() 被调用时清理
      timers.forEach(clearTimeout);
    }
  });
}
```

### 验收断言
```typescript
describe('SSE Stream Cleanup', () => {
  it('should clean up timers when stream is cancelled', async () => {
    const timers: number[] = [];
    const originalSetTimeout = global.setTimeout;
    
    vi.spyOn(global, 'setTimeout').mockImplementation((fn, ms) => {
      const id = originalSetTimeout(fn as any, ms);
      timers.push(id as number);
      return id as any;
    });
    
    const stream = await buildSSEStream({ requirement: 'test', env: {} as any });
    const reader = stream.getReader();
    
    // 取消流
    await reader.cancel();
    
    // 验证 timers 被清理
    timers.forEach(id => {
      const cleared = vi.mocked(global.clearTimeout).mock.calls.some(
        call => call[0] === id
      );
      expect(cleared).toBe(true);
    });
  });
});
```

### DoD Checklist
- [ ] AbortSignal 监听 'abort' 事件
- [ ] abort 事件触发 controller.close()
- [ ] cancel() 回调清理所有 timers
- [ ] finally 块清理 timers
- [ ] jest 测试通过
