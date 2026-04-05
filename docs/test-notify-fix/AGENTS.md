# 开发约束: Test Notify Fix

> **项目**: test-notify-fix  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 强制规范

### 1.1 不得破坏现有功能

- **Slack 消息格式**: Block Kit 格式不变
- **CLI 参数**: `--status --duration --tests --errors` 不变
- **环境变量**: `CI_NOTIFY_WEBHOOK`, `CI_NOTIFY_ENABLED` 行为不变

### 1.2 禁止事项

- **禁止** 引入新 npm 依赖
- **禁止** 在去重检查前发送通知
- **禁止** 修改 Python 版 (`slack_notify_templates.py`)

---

## 2. 代码风格

### 2.1 去重 Key 生成

```javascript
// ✅ 正确: 前 50 字符 + DJB2 hash → base36
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateKey(status, message) {
  return `test:${status}:${simpleHash((message || '').substring(0, 50))}`;
}
```

### 2.2 缓存文件操作

```javascript
// ✅ 正确: 损坏时删除重建
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch {
    try { fs.unlinkSync(CACHE_FILE); } catch {}
  }
  return {};
}
```

### 2.3 重试规范

```javascript
// ✅ 正确: 超时不重试
async function sendWithRetry(url, payload) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) return { success: true, attempts: attempt };
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[Notify] Timeout');
        return { success: false, attempts: attempt }; // 不重试
      }
      if (attempt < 4) await sleep([1000, 2000, 4000][attempt - 1]);
    }
  }
  return { success: false, attempts: 4 };
}
```

---

## 3. 测试要求

```javascript
// dedup.test.js - beforeEach 清理
beforeEach(() => {
  if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
});

// retry.test.js - 假时钟
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });
```

---

## 4. 审查清单

- [ ] `pnpm test` 全部通过
- [ ] Slack Block Kit 格式未改变
- [ ] 缓存损坏时自动重建
- [ ] 超时不触发重试
- [ ] `CI=true` 自动启用

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
