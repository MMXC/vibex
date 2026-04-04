# 实施计划: Test Notify Fix

> **项目**: test-notify-fix  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 实施顺序

```
Phase 1 (E1): dedup.js 实现 + 集成      ← 1h
Phase 2 (E2): sendWithRetry + 集成     ← 0.5h
Phase 3 (E3): CI 检测逻辑               ← 0.5h
```

---

## 2. 详细步骤

### Phase 1: dedup.js 实现 (E1)

**目标文件**: `vibex-fronted/scripts/dedup.js`

**步骤 1.1** — 创建 dedup.js (25min) ✅ DONE
```
1. 创建 scripts/dedup.js ✅
2. 实现 simpleHash() - 32bit hash → base36 ✅
3. 实现 generateKey(status, message) → 'test:{status}:{hash36}' ✅
4. 实现 readCache() / writeCache() - 错误时删除重建 ✅
5. 实现 checkDedup(key) → { skipped, remaining } ✅
6. 实现 recordSend(key) → 写入 + 清理过期条目 ✅
7. 导出模块 ✅
```

**步骤 1.2** — 编写测试 (20min) ✅ DONE
```
1. 创建 scripts/__tests__/dedup.test.js ✅
2. beforeEach 清理缓存文件 ✅
3. 覆盖: 新消息/5min内重复/过期/损坏 ✅ (18 tests)
```

**步骤 1.3** — 集成到 test-notify.js (15min) ✅ DONE
```
1. require('./dedup') ✅
2. sendNotification() 开头 checkDedup() ✅
3. 成功后 recordSend(messageKey) ✅
```

### Phase 2: sendWithRetry + 超时 (E2)

**目标文件**: `vibex-fronted/scripts/test-notify.js`

**步骤 2.1** — 实现 sendWithRetry (20min)
```
1. 添加 sendWithRetry() 函数
2. 指数退避 delays = [1000, 2000, 4000]
3. AbortSignal.timeout(5000) 超时
4. 超时不重试，直接返回
```

**步骤 2.2** — 替换现有 https.request (10min)
```
1. 替换为 sendWithRetry()
2. 保留 Slack Block Kit 格式不变
```

**步骤 2.3** — 编写测试 (20min)
```
1. 创建 scripts/__tests__/retry.test.js
2. 覆盖: 重试成功/用尽/超时不重试
3. vi.useFakeTimers() 测试超时
```

### Phase 3: CI 检测逻辑 (E3)

**目标文件**: `vibex-fronted/scripts/test-notify.js`

**步骤 3.1** — 修改 config.enabled 逻辑 (20min)
```
1. 找到 config.enabled 初始化
2. 改为: process.env.CI === 'true' || process.env.CI_NOTIFY_ENABLED === 'true'
```

**步骤 3.2** — 验证 (10min)
```
1. CI=true 验证自动启用
2. 本地无 CI 时不发送
```

---

## 3. 部署清单

| 步骤 | 操作 | 验证 |
|------|------|------|
| 1 | `pnpm test scripts/__tests__/dedup.test.js` | 全部通过 |
| 2 | `pnpm test scripts/__tests__/retry.test.js` | 全部通过 |
| 3 | `node scripts/test-notify.js --status passed` | Slack 收到 |
| 4 | 立即再次调用 | 输出 ⏭️ Skip duplicate |

---

## 4. 成功标准

- [x] `pnpm test` 全部通过 — 18 dedup tests pass ✅
- [x] 首次调用发送 Slack 通知 — recordSend records the key ✅
- [x] 5 分钟内重复调用跳过 — checkDedup returns {skipped:true} ✅
- [ ] CI=true 自动启用 (Phase 3 E3)
- [ ] 重试用尽后不抛异常 (Phase 2 E2)

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
