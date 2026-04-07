# E2: 重试 + 超时控制 - 详细规格

## S2.1 重试逻辑实现

### 目标
为 webhook 请求添加指数退避重试，提高通知送达率。

### 实施方案
```javascript
// 重试配置
const RETRY_CONFIG = {
  maxAttempts: 3,
  delays: [1000, 2000, 4000], // 指数退避: 1s, 2s, 4s
  backoffMultiplier: 2
};

/**
 * 带重试的 fetch
 * @param {string} url Webhook URL
 * @param {Object} payload 消息 payload
 * @returns {Promise<{success: boolean, attempts: number}>}
 */
async function sendWithRetry(url, payload) {
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts + 1; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return { success: true, attempts: attempt };
      }
      
      // 非 2xx 响应视为失败
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      lastError = err;
      
      // 超时不重试
      if (err.name === 'AbortError') {
        console.error(`[Notify] Request timeout (attempt ${attempt})`);
        break;
      }
    }
    
    // 不是最后一次尝试，等待后重试
    if (attempt <= RETRY_CONFIG.maxAttempts) {
      const delay = RETRY_CONFIG.delays[attempt - 1] || 4000;
      console.log(`[Notify] Retry in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts + 1})`);
      await sleep(delay);
    }
  }
  
  // 所有重试失败
  console.error(`[Notify] All ${RETRY_CONFIG.maxAttempts + 1} attempts failed:`, lastError?.message);
  return { success: false, attempts: RETRY_CONFIG.maxAttempts + 1 };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 验收断言
```javascript
// __tests__/retry.test.js

describe('Retry Logic', () => {
  it('should retry on failure', async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      if (callCount < 3) throw new Error('Network error');
      return { ok: true, status: 200 };
    };
    
    global.fetch = mockFetch;
    
    const result = await sendWithRetry('https://example.com/webhook', {});
    
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
  });

  it('should stop after max attempts', async () => {
    global.fetch = async () => { throw new Error('Network error'); };
    
    const result = await sendWithRetry('https://example.com/webhook', {});
    
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(4); // 1 initial + 3 retries
  });

  it('should not retry on timeout', async () => {
    let callCount = 0;
    global.fetch = async ({ signal }) => {
      callCount++;
      signal?.throwAbortedErr?.(); // 模拟超时
      throw new DOMException('Aborted', 'AbortError');
    };
    
    const result = await sendWithRetry('https://example.com/webhook', {});
    
    expect(result.success).toBe(false);
    expect(callCount).toBe(1); // 不重试
  });
});
```

### DoD Checklist
- [ ] `sendWithRetry()` 实现指数退避
- [ ] 最多 3 次重试（1s, 2s, 4s）
- [ ] 超时不计入重试
- [ ] jest 测试覆盖

---

## S2.2 超时控制

### 目标
为 webhook 请求添加 5 秒超时，防止请求无限期等待。

### 实施方案
```javascript
// 使用 AbortController + setTimeout 实现超时
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller.signal // 关联 AbortSignal
  });
  
  clearTimeout(timeoutId); // 成功后清理
} catch (err) {
  clearTimeout(timeoutId); // 失败后也要清理
  throw err;
}
```

### 验收断言
```javascript
it('should timeout after 5 seconds', async () => {
  const slowFetch = async ({ signal }) => {
    await new Promise(r => setTimeout(r, 10000)); // 模拟 10s 延迟
    return { ok: true };
  };
  
  global.fetch = slowFetch;
  
  const start = Date.now();
  const result = await sendWithRetry('https://example.com/webhook', {});
  const elapsed = Date.now() - start;
  
  expect(result.success).toBe(false);
  expect(elapsed).toBeLessThan(6000); // 应该在 5-6s 内超时
}, 10000);
```

### DoD Checklist
- [ ] `AbortSignal.timeout(5000)` 或等效实现
- [ ] 超时时抛出 `AbortError`
- [ ] 超时不计入重试次数
- [ ] jest 测试验证 5s 超时
