# 实施计划: VibeX Test Notify 去重与统一

> **项目**: vibex-test-notify-20260405  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 实施顺序

```
Phase 1 (E1): dedup.js 实现 + 集成      ← 1h
Phase 2 (E2): sendWithRetry + 集成     ← 0.5h
Phase 3 (E3): CI 集成文档               ← 0.5h
```

**并行策略**: E3 独立，可在 E1/E2 之前或并行实施。

---

## 2. 详细步骤

### Phase 1: dedup.js 实现 (E1)

**目标文件**: `vibex-fronted/scripts/dedup.js`

**步骤 1.1** — 创建 dedup.js (25min)
```
1. 创建 scripts/dedup.js
2. 实现 simpleHash() - 32bit DJB2 hash → base36
3. 实现 generateKey(status, message) → 'test:{status}:{hash36}'
4. 实现 readCache() / writeCache() 文件读写
5. 实现 checkDedup(key) → { skipped, remaining }
6. 实现 recordMessage(key) → 写入缓存 + 清理过期条目
7. 导出模块
```

**核心代码**:
```javascript
const CACHE_FILE = path.join(__dirname, '.dedup-cache.json');
const _DEDUP_WINDOW_MS = 5 * 60 * 1000;

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateKey(status, message) {
  const prefix = message.substring(0, 50);
  return `test:${status}:${simpleHash(prefix)}`;
}
```

**步骤 1.2** — 编写测试 (20min)
```
1. 创建 scripts/__tests__/dedup.test.js
2. 覆盖: 新消息、5分钟内重复、过期的key、缓存文件损坏
3. beforeEach 清理缓存文件
```

**步骤 1.3** — 集成到 test-notify.js (15min)
```
1. 在 test-notify.js 顶部 require('./dedup')
2. 在 sendNotification() 开头检查 checkDedup()
3. 发送成功后调用 recordMessage(key)
```

### Phase 2: sendWithRetry + 超时 (E2)

**目标文件**: `vibex-fronted/scripts/test-notify.js`

**步骤 2.1** — 实现 sendWithRetry (20min)
```
1. 在 test-notify.js 中添加 sendWithRetry() 函数
2. 实现指数退避: 1s → 2s → 4s
3. 实现 AbortSignal.timeout(5000) 超时控制
4. 超时不重试，直接退出
```

**步骤 2.2** — 替换现有 https.request (10min)
```
1. 将现有的 https.request 调用替换为 sendWithRetry()
2. 保留现有 Slack 消息格式不变
3. 保留 config.enabled / config.webhookUrl 检查逻辑
```

**步骤 2.3** — 编写测试 (20min)
```
1. 创建 scripts/__tests__/retry.test.js
2. 覆盖: 重试成功、重试用尽、超时不重试
3. 使用 vi.useFakeTimers() 测试超时
```

### Phase 3: CI 集成文档 (E3)

**目标文件**: `vibex-fronted/scripts/README.md`

**步骤 3.1** — 编写文档 (30min)
```
1. 创建 scripts/README.md
2. 包含: 用法、环境变量、CI 示例（GitHub Actions + GitLab CI）
3. 包含: 去重机制说明、故障排查
```

---

## 3. 部署清单

| 步骤 | 操作 | 验证 |
|------|------|------|
| 1 | `pnpm test scripts/__tests__/dedup.test.js` | 全部通过 |
| 2 | `pnpm test scripts/__tests__/retry.test.js` | 全部通过 |
| 3 | 本地测试: `node scripts/test-notify.js --status passed ...` | Slack 收到通知 |
| 4 | 本地测试: 5分钟内重复调用 | 输出 ⏭️ Skip duplicate |

---

## 4. 回滚方案

| 场景 | 回滚操作 |
|------|---------|
| dedup.js 破坏通知发送 | 删除 `require('./dedup')` 调用，恢复原状 |
| sendWithRetry 引入问题 | 恢复原有 `https.request` 代码 |
| CI 文档错误 | 修正 README.md 后重新提交 |

---

## 5. 成功标准

- [ ] `pnpm test scripts/__tests__/dedup.test.js` 通过
- [ ] `pnpm test scripts/__tests__/retry.test.js` 通过
- [ ] `node scripts/test-notify.js --status passed` 发送 Slack 通知
- [ ] 5 分钟内重复调用跳过通知
- [ ] `scripts/README.md` 存在且包含 CI 示例

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
