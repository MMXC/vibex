# Architecture: Test Notify Fix

> **项目**: test-notify-fix  
> **架构师**: architect  
> **日期**: 2026-04-05  
> **版本**: v1.0  
> **状态**: 已完成

---

## 1. 执行决策

- **决策**: 已采纳
- **执行项目**: test-notify-fix
- **执行日期**: 2026-04-05

---

## 2. 问题背景

`test-notify.js`（JS 版）缺少去重机制，每次调用都发送通知，与已实现 5 分钟去重的 Python 版不一致。

| 功能 | JS | Python |
|------|-----|--------|
| Slack webhook 发送 | ✅ | ✅ |
| 5 分钟去重 | ❌ | ✅ |
| 重试（最多 3 次）| ❌ | ✅ |
| 超时控制 | ❌ | ❌ |

**影响**: CI 重试/并发调用导致重复通知。

---

## 3. Tech Stack

| 组件 | 技术选型 | 理由 |
|------|---------|------|
| **去重模块** | `dedup.js` (Node.js) | 纯标准库，无新依赖 |
| **去重持久化** | `.notify-dedup.json` | 与 Python 逻辑对齐 |
| **重试** | 指数退避 (1s, 2s, 4s) | 避免重试风暴 |
| **超时** | `AbortSignal.timeout(5000)` | Node.js 18+ 原生 |
| **测试框架** | Jest (现有) | `vibex-fronted` 已使用 |

---

## 4. 架构图

```mermaid
%%{ init: { "theme": "neutral" } }%%
flowchart TB
    subgraph CLI["CLI 入口"]
        T["test-notify.js"]
    end
    
    subgraph DedupLayer["去重层 (新增)"]
        DK["generateKey()\nsimpleHash(status + msg[0:50])"]
        DC["checkDedup()\n5min window"]
        DR["recordSend()\nwrite .notify-dedup.json"]
        DF["readCache()"]
    end
    
    subgraph RetryLayer["重试层 (新增)"]
        SR["sendWithRetry()\nexponential backoff 1s→2s→4s"]
        ST["AbortSignal.timeout(5000)"]
    end
    
    subgraph HTTP["HTTP 层"]
        NW["https.request()"]
        WH["Slack Webhook"]
    end
    
    T --> DK
    DK --> DC
    DC --> DF
    DR --> DF
    T --> DC
    DC -->|"skipped=true| skip"]
    DC -->|"skipped=false| SR
    SR --> ST
    SR --> NW
    NW --> WH
    
    DF -.->|"read/write"| F[".notify-dedup.json"]
    DR -.-> F
```

---

## 5. API 定义

### 5.1 dedup.js 模块 API

```typescript
// dedup.js - 导出接口

function generateKey(status: string, message: string): string
// → 'test:{status}:{hash36}'

function checkDedup(key: string): { skipped: boolean; remaining: number }
/// remaining: 剩余秒数

function recordSend(key: string): void
// 记录发送时间，自动清理 5 分钟前过期条目

// 常量
const _DEDUP_WINDOW_MS = 5 * 60 * 1000  // 5 分钟
const CACHE_FILE = '.notify-dedup.json'
```

### 5.2 sendWithRetry 签名

```typescript
interface RetryResult {
  success: boolean;
  attempts: number;  // 1 initial + N retries
  lastError?: string;
}

async function sendWithRetry(
  webhookUrl: string,
  payload: object,
  options?: {
    maxAttempts?: number;      // default: 3
    timeoutMs?: number;       // default: 5000
  }
): Promise<RetryResult>
```

---

## 6. 数据模型

```jsonc
// .notify-dedup.json
{
  "test:passed:a1b2c3": 1743806400000,  // timestamp (ms)
  "test:failed:d4e5f6": 1743806500000
}
// 5 分钟前的条目在写入时自动清理
```

---

## 7. 模块设计

### 7.1 修改文件清单

| 文件 | 操作 | 修改内容 |
|------|------|---------|
| `vibex-fronted/scripts/test-notify.js` | 修改 | 集成 dedup + sendWithRetry |
| `vibex-fronted/scripts/dedup.js` | 新建 | 去重核心逻辑 |
| `vibex-fronted/scripts/__tests__/dedup.test.js` | 新建 | 去重测试 |
| `vibex-fronted/scripts/__tests__/retry.test.js` | 新建 | 重试测试 |

### 7.2 关键实现差异 vs Python 版

| 维度 | Python | JS（本方案）| 对齐 |
|------|--------|------------|------|
| 缓存文件 | `~/.openclaw/.../dedup.json` | `.notify-dedup.json` | ✅ 各自文件 |
| Key 生成 | `task_id` 直接 | `status + simpleHash(msg[:50])` | ✅ 等效 |
| 去重窗口 | 5 分钟 | 5 分钟 | ✅ |
| 过期清理 | 写入时清理 | 写入时清理 | ✅ |
| `done/ready` 不去重 | ✅ | N/A | ✅ |

---

## 8. 技术审查

### 8.1 风险评估

| 风险 | 严重性 | 缓解 |
|------|--------|------|
| `.notify-dedup.json` 并发写入冲突 | 低 | 原子写；CI 并发概率极低 |
| 缓存文件损坏 | 低 | 读取失败时删除重建 |
| Node.js < 18 不支持 AbortController | 低 | 回退到 setTimeout 兜底 |
| 重试风暴 | 低 | 指数退避 1s→2s→4s |

### 8.2 兼容性

| 场景 | 影响 |
|------|------|
| 现有 `test-notify.js` 调用方式 | ✅ 无变化 |
| `CI_NOTIFY_WEBHOOK` 环境变量 | ✅ 保持不变 |
| Slack Block Kit 消息格式 | ✅ 无变化 |

---

## 9. 测试策略

| 文件 | 覆盖率要求 | 场景 |
|------|-----------|------|
| `scripts/dedup.js` | > 90% | 新消息/5min内重复/过期/损坏 |
| `test-notify.js` | > 80% | 去重跳过/重试成功/重试用尽/超时 |
| `scripts/__tests__/retry.test.js` | > 90% | 重试成功/用尽/超时不重试 |

```javascript
// dedup.test.js
it('should return skipped=true within 5 minutes', () => {
  const key = 'test:passed:abc';
  recordSend(key);
  const result = checkDedup(key);
  expect(result.skipped).toBe(true);
  expect(result.remaining).toBeGreaterThan(0);
  expect(result.remaining).toBeLessThanOrEqual(300);
});

// retry.test.js
it('should timeout after 5s without retrying', async () => {
  global.fetch = async () => { await new Promise(r => setTimeout(r, 10000)); return { ok: true }; };
  const result = await sendWithRetry('url', {});
  expect(result.success).toBe(false);
  expect(result.attempts).toBe(1); // 超时不重试
}, 10000);
```

---

## 10. 实施计划

| Phase | 内容 | 工时 | 产出 |
|-------|------|------|------|
| E1 | dedup.js 实现 + 集成 | 1h | 去重模块 |
| E2 | sendWithRetry + 集成 | 0.5h | test-notify.js 增强 |
| E3 | CI 检测逻辑 | 0.5h | CI=true 自动启用 |

**并行度**: E3 独立，E1/E2 顺序执行

---

## 11. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 首次调用 | `node test-notify.js --status passed` | Slack 收到通知 |
| AC2 | 5 分钟内重复 | 再次调用 | 跳过，输出 ⏭️ |
| AC3 | 5 分钟后 | 再次调用 | 发送通知 |
| AC4 | `CI=true` | `CI=true node test-notify.js` | 自动启用 |
| AC5 | webhook 失败 | 3 次重试后 | 记录日志，不抛异常 |
| AC6 | 网络慢 | webhook 请求 | 5s 超时 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
