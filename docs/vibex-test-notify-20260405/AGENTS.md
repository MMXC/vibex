# 开发约束: VibeX Test Notify 去重与统一

> **项目**: vibex-test-notify-20260405  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 强制规范

### 1.1 不得破坏现有功能

- **Slack 消息格式**: 保持现有的 Block Kit 格式不变
- **CLI 参数**: `--status`, `--duration`, `--tests`, `--errors` 接口不变
- **环境变量**: `CI_NOTIFY_WEBHOOK`, `CI_NOTIFY_ENABLED`, `CI` 行为不变
- **退出码**: `passed` → 0, `failed` → 1，不改变

### 1.2 强制测试覆盖

| 文件 | 必须覆盖的测试场景 |
|------|------------------|
| `scripts/dedup.js` | 新消息、5分钟内重复、过期key、缓存损坏 |
| `scripts/test-notify.js` | 去重跳过、正常发送、重试逻辑 |
| `scripts/__tests__/retry.test.js` | 重试成功、用尽、超时不重试 |

### 1.3 禁止事项

- **禁止** 引入新的 npm 依赖（使用 Node.js 标准库）
- **禁止** 修改 `slack_notify_templates.py`（Python 去重已正常）
- **禁止** 在去重检查之前发送通知（去重是必须行为）
- **禁止** 在 CI 中使用 `console.log` 泄露敏感信息

---

## 2. 代码风格

### 2.1 去重 Key 生成规范

```javascript
// ✅ 正确: 与 Python 等效的 hash
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ✅ 正确: 使用前 50 字符避免 key 过长
function generateKey(status, message) {
  return `test:${status}:${simpleHash(message.substring(0, 50))}`;
}

// ❌ 错误: 使用整个消息可能导致 key 过长
function generateKey(status, message) {
  return `test:${status}:${simpleHash(message)}`; // message 可能很长
}
```

### 2.2 文件操作规范

```javascript
// ✅ 正确: 错误时删除损坏文件重建
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[Dedup] Cache corrupted, rebuilding...');
    try { fs.unlinkSync(CACHE_FILE); } catch {}
  }
  return {};
}

// ✅ 正确: 原子写入
function writeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}
```

### 2.3 重试规范

```javascript
// ✅ 正确: 指数退避 + 超时不重试
async function sendWithRetry(url, payload) {
  const delays = [1000, 2000, 4000]; // 1s, 2s, 4s

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) return { success: true, attempts: attempt + 1 };
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[Notify] Timeout, not retrying');
        return { success: false, attempts: attempt + 1, lastError: 'timeout' };
      }
      if (attempt < 3) {
        await sleep(delays[attempt]);
      }
    }
  }

  return { success: false, attempts: 4, lastError: 'max retries' };
}
```

---

## 3. 测试要求

### 3.1 测试文件命名

```
scripts/dedup.js              → scripts/__tests__/dedup.test.js
scripts/test-notify.js (retry) → scripts/__tests__/retry.test.js
```

### 3.2 测试超时配置

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  testMatch: ['**/__tests__/**/*.test.js'],
};
```

### 3.3 Mock 规范

```javascript
// retry.test.js
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// dedup.test.js
beforeEach(() => {
  // 清理缓存文件
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
});
```

---

## 4. Git 提交规范

```
feat(test-notify): add dedup.js with 5-min window deduplication
feat(test-notify): add sendWithRetry with exponential backoff
feat(test-notify): add AbortSignal.timeout(5000) for webhook requests
test(test-notify): add dedup module unit tests
test(test-notify): add retry logic unit tests
docs(test-notify): add CI integration README
```

---

## 5. 审查清单 (Review Checklist)

开发者提交 PR 前必须自检：

- [ ] `pnpm test` 全部通过
- [ ] `pnpm lint` 无错误
- [ ] Slack 消息 Block Kit 格式未改变
- [ ] CLI 参数 `--status --duration --tests --errors` 仍可用
- [ ] 去重 key 生成使用 `message.substring(0, 50)` 避免过长
- [ ] 缓存文件损坏时自动重建
- [ ] 超时不触发重试
- [ ] 指数退避间隔为 1s → 2s → 4s
- [ ] `scripts/README.md` 包含 GitHub Actions 和 GitLab CI 示例

---

## 6. 性能约束

| 指标 | 上限 | 说明 |
|------|------|------|
| 通知发送（含重试）| < 15s | 3 次重试 + 超时 5s |
| 去重检查 | < 10ms | 纯内存操作 |
| 缓存文件大小 | < 10KB | 过期清理保证 |

---

## 7. 安全约束

- **Webhook URL**: 不写入日志，不输出到 stderr
- **CI 环境变量**: 仅 `CI_NOTIFY_WEBHOOK` 需要保密
- **缓存文件**: `.dedup-cache.json` 无敏感信息（只有 timestamp）

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
