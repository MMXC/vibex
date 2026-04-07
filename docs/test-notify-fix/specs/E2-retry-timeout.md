# E2: 重试 + 超时 - 详细规格

## S2.1 重试逻辑

### 目标
为 webhook 请求添加指数退避重试（最多 3 次）。

### 实施方案
```javascript
const RETRY_CONFIG = { maxAttempts: 3, delays: [1000, 2000, 4000] };

async function sendWithRetry(url, payload) {
  let lastError;
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts + 1; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) return { success: true, attempts: attempt };
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') break;
    }
    if (attempt <= RETRY_CONFIG.maxAttempts) {
      await sleep(RETRY_CONFIG.delays[attempt - 1] || 4000);
    }
  }
  console.error(`[Notify] All failed:`, lastError?.message);
  return { success: false, attempts: RETRY_CONFIG.maxAttempts + 1 };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

### 验收断言
```javascript
describe('Retry Logic', () => {
  it('should retry on failure', async () => {
    let count = 0;
    global.fetch = async () => { 
      count++;
      if (count < 3) throw new Error('fail');
      return { ok: true };
    };
    const result = await sendWithRetry('url', {});
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
  });

  it('should stop after max attempts', async () => {
    global.fetch = async () => { throw new Error('fail'); };
    const result = await sendWithRetry('url', {});
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(4);
  });

  it('should not retry on timeout', async () => {
    global.fetch = async ({ signal }) => {
      throw Object.assign(new Error('Abort'), { name: 'AbortError' });
    };
    const result = await sendWithRetry('url', {});
    expect(result.success).toBe(false);
  });
});
```

### DoD Checklist
- [ ] `sendWithRetry()` 实现指数退避
- [ ] 最多 3 次重试（1s/2s/4s）
- [ ] jest 测试通过
