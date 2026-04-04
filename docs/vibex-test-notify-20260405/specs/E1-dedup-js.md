# E1: JS 去重逻辑实现 - 详细规格

## S1.1 去重模块实现

### 目标
创建 `dedup.js` 模块，实现 5 分钟窗口去重，避免重复发送 Slack 通知。

### 实施方案
```javascript
// vibex-fronted/scripts/dedup.js

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '.dedup-cache.json');
const _DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 分钟

/**
 * 生成消息 key
 * @param {string} status - passed/failed
 * @param {string} message - 消息内容
 * @returns {string} 消息 key
 */
function generateKey(status, message) {
  // 简化版：使用 status + 消息前 50 字符 hash
  const msgPrefix = message.substring(0, 50);
  const hash = simpleHash(msgPrefix);
  return `test:${status}:${hash}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * 读取去重缓存
 * @returns {Object} 缓存对象
 */
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // 文件损坏，删除后重建
    console.error('[Dedup] Cache corrupted, rebuilding...');
    fs.unlinkSync(CACHE_FILE);
  }
  return {};
}

/**
 * 写入去重缓存
 * @param {Object} cache 缓存对象
 */
function writeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * 检查消息是否应该跳过（去重）
 * @param {string} key 消息 key
 * @returns {Object} { skipped: boolean, remaining: number (seconds) }
 */
function checkDedup(key) {
  const cache = readCache();
  const now = Date.now();
  
  if (cache[key]) {
    const elapsed = now - cache[key].timestamp;
    const remaining = Math.ceil((_DEDUP_WINDOW_MS - elapsed) / 1000);
    
    if (elapsed < _DEDUP_WINDOW_MS) {
      return { skipped: true, remaining };
    }
  }
  
  return { skipped: false, remaining: 0 };
}

/**
 * 记录已发送消息
 * @param {string} key 消息 key
 */
function recordMessage(key) {
  const cache = readCache();
  cache[key] = { timestamp: Date.now() };
  
  // 清理过期条目（避免缓存文件无限增长）
  const now = Date.now();
  for (const k of Object.keys(cache)) {
    if (now - cache[k].timestamp > _DEDUP_WINDOW_MS) {
      delete cache[k];
    }
  }
  
  writeCache(cache);
}

module.exports = { generateKey, checkDedup, recordMessage, _DEDUP_WINDOW_MS };
```

### 验收断言
```javascript
// __tests__/dedup.test.js

const { checkDedup, recordMessage, generateKey } = require('../scripts/dedup');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../scripts/.dedup-cache.json');

describe('Dedup Module', () => {
  beforeEach(() => {
    // 清理缓存文件
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  });

  it('should return skipped=false for new message', () => {
    const result = checkDedup('test:passed:abc123');
    expect(result.skipped).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should return skipped=true for duplicate within 5 minutes', () => {
    const key = 'test:passed:abc123';
    recordMessage(key);
    
    const result = checkDedup(key);
    expect(result.skipped).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.remaining).toBeLessThanOrEqual(300);
  });

  it('should return skipped=false after 5 minutes', async () => {
    const key = 'test:passed:old';
    
    // 直接写入过期时间（模拟）
    const cache = { [key]: { timestamp: Date.now() - 6 * 60 * 1000 } };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
    
    const result = checkDedup(key);
    expect(result.skipped).toBe(false);
  });

  it('should persist cache to disk', () => {
    const key = 'test:passed:persist';
    recordMessage(key);
    
    expect(fs.existsSync(CACHE_FILE)).toBe(true);
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    expect(cache[key]).toBeDefined();
  });

  it('should handle corrupted cache file', () => {
    fs.writeFileSync(CACHE_FILE, 'invalid json');
    
    // 应该删除损坏文件并重建
    expect(() => checkDedup('test:any')).not.toThrow();
    expect(fs.existsSync(CACHE_FILE)).toBe(true);
  });
});
```

### DoD Checklist
- [ ] `dedup.js` 实现 `checkDedup()` 和 `recordMessage()`
- [ ] 去重窗口 `_DEDUP_WINDOW_MS = 5 * 60 * 1000`
- [ ] 状态持久化到 `.dedup-cache.json`
- [ ] jest 测试全部通过

---

## S1.2 与 test-notify.js 集成

### 目标
在 `test-notify.js` 中集成去重逻辑，避免重复发送通知。

### 集成方案
```javascript
// vibex-fronted/scripts/test-notify.js

const { checkDedup, recordMessage, generateKey } = require('./dedup');
const https = require('https');

// 解析参数
const args = parseArgs(process.argv.slice(2));
const { status, duration, tests, errors } = args;

// 生成消息 key（用于去重）
const message = `Test ${status}: ${tests} tests in ${duration}${errors ? `, ${errors} errors` : ''}`;
const messageKey = generateKey(status, message);

// 检查去重
const { skipped, remaining } = checkDedup(messageKey);
if (skipped) {
  console.log(`⏭️ Skip duplicate notification (${remaining}s remaining)`);
  process.exit(0);
}

// 发送通知
async function sendNotification() {
  // ... 发送逻辑
  
  // 成功后记录到去重缓存
  recordMessage(messageKey);
}

// 运行
sendNotification().catch(err => {
  console.error('[Notify] Failed:', err.message);
  process.exit(1); // 通知失败不影响 CI
});
```

### DoD Checklist
- [ ] `test-notify.js` 调用 `checkDedup()` 检查去重
- [ ] 发送成功后调用 `recordMessage()` 记录
- [ ] 跳过重复消息时输出 `⏭️ Skip duplicate notification`
- [ ] 本地测试验证去重行为
