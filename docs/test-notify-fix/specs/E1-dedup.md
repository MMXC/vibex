# E1: JS 去重机制 - 详细规格

## S1.1 去重模块实现

### 目标
创建 `dedup.js` 模块，实现 5 分钟窗口去重。

### 实施方案
```javascript
// vibex-fronted/scripts/dedup.js

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '.notify-dedup.json');
const _DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 分钟

function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  }
  return {};
}

function writeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function checkDedup(key) {
  const cache = readCache();
  const now = Date.now();
  
  if (cache[key]) {
    const elapsed = now - cache[key];
    const remaining = Math.ceil((_DEDUP_WINDOW_MS - elapsed) / 1000);
    if (elapsed < _DEDUP_WINDOW_MS) {
      return { skipped: true, remaining };
    }
  }
  return { skipped: false, remaining: 0 };
}

function recordSend(key) {
  const cache = readCache();
  cache[key] = Date.now();
  // 清理过期条目
  const now = Date.now();
  for (const k of Object.keys(cache)) {
    if (now - cache[k] > _DEDUP_WINDOW_MS) delete cache[k];
  }
  writeCache(cache);
}

function generateKey(status, message) {
  const hash = simpleHash((message || '').substring(0, 50));
  return `test:${status}:${hash}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(36);
}

module.exports = { checkDedup, recordSend, generateKey, _DEDUP_WINDOW_MS };
```

### 验收断言
```javascript
describe('Dedup Module', () => {
  beforeEach(() => {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  });

  it('should return skipped=false for new message', () => {
    const result = checkDedup('test:passed:new');
    expect(result.skipped).toBe(false);
  });

  it('should return skipped=true within 5 minutes', () => {
    const key = 'test:passed:repeat';
    recordSend(key);
    const result = checkDedup(key);
    expect(result.skipped).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should persist cache to disk', () => {
    recordSend('test:passed:persist');
    expect(fs.existsSync(CACHE_FILE)).toBe(true);
  });

  it('should handle corrupted cache', () => {
    fs.writeFileSync(CACHE_FILE, 'invalid');
    expect(() => checkDedup('test:any')).not.toThrow();
  });
});
```

### DoD Checklist
- [ ] `dedup.js` 实现 `checkDedup()` 和 `recordSend()`
- [ ] 去重窗口 `_DEDUP_WINDOW_MS = 5 * 60 * 1000`
- [ ] jest 测试通过

---

## S1.2 与 test-notify.js 集成

### 集成方案
```javascript
// test-notify.js 修改

const { checkDedup, recordSend, generateKey } = require('./dedup');

// 解析参数
const status = args.status || 'passed';
const message = `Test ${status}: ${tests} tests in ${duration}`;
const messageKey = generateKey(status, message);

// 检查去重
const { skipped, remaining } = checkDedup(messageKey);
if (skipped) {
  console.log(`⏭️ Skip duplicate (${remaining}s remaining)`);
  process.exit(0);
}

// 发送通知
await sendNotification(message);

// 成功后记录
recordSend(messageKey);
```

### DoD Checklist
- [ ] `test-notify.js` 集成去重检查
- [ ] 跳过时输出提示
- [ ] 发送成功后记录
