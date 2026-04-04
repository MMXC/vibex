# Test Notify Fix 分析报告

> **分析日期**: 2026-04-05
> **分析者**: analyst agent
> **项目**: test-notify-fix

---

## 1. 执行摘要

`--notify` 是测试基础设施中的**结果通知标志**，用于测试完成后将结果推送到 Slack。核心问题：**JS 版本 (`test-notify.js`) 缺少去重机制**，而 Python 版本已实现 5 分钟窗口去重。

**与 vibex-test-notify-20260405 关系**：本分析是同一需求的补充，重点聚焦 "fix" —— 统一两套实现并修复 JS 版本的缺陷。

---

## 2. 现状对比

| 功能 | JS (`test-notify.js`) | Python (`slack_notify_templates.py`) |
|------|----------------------|--------------------------------------|
| Slack webhook 发送 | ✅ | ✅ |
| 环境变量控制 | ✅ | ✅ |
| 异步不阻塞 | ✅ | ✅ |
| 5 分钟去重 | ❌ | ✅ |
| pytest 测试用例 | ❌ | ✅ |

---

## 3. 历史经验

### docs/learnings/ 分析

- `canvas-cors-preflight-500.md` — CORS 预检 500 问题（相关领域：Worker 部署、路由顺序）
- `react-hydration-fix.md` — React 水合问题模式

### Git History 分析

```
commit 2041b146 (2026-03-13)
  feat(test): D3 测试结果自动通知
  - test-notify.js 脚本首次实现

commit dbe00821 (2026-04-04)
  feat(proposals): E3/E4 add TEMPLATE + priority + slack dedup
  - Python 版 slack_notify_templates.py 新增去重逻辑
  - pytest 测试用例 test_slack_notify.py
```

**关键教训**：Python 版在 2026-04-04 已实现去重，但 JS 版未同步更新。

---

## 4. 根因分析

### JS 版本缺陷

```javascript
// test-notify.js — 无去重
const sendNotification = async () => {
  // 每次调用都发送，无检查
  const req = https.request(options, ...);
  // ...
};
```

### 风险场景

1. **CI 重复触发**: 同一个 pipeline run 可能多次调用 `test:notify`，导致重复通知
2. **并发调用**: 多个 job 同时完成，短时间内多次发送相同消息
3. **调试/重试**: 开发者本地多次运行，收到重复消息

---

## 5. 修复方案

### 方案 A：移植 Python 去重到 JS（推荐）

**目标**: 在 `test-notify.js` 中实现与 Python 版一致的 5 分钟去重。

```javascript
// 新增 dedup 模块
const STATE_FILE = '.notify-dedup.json';
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

async function checkDedup(messageKey) {
  const state = loadState();
  const now = Date.now();
  const last = state[messageKey] || 0;
  const elapsed = now - last;
  
  if (elapsed < DEDUP_WINDOW_MS) {
    return { skipped: true, remaining: (DEDUP_WINDOW_MS - elapsed) / 1000 };
  }
  return { skipped: false, remaining: 0 };
}

async function recordSend(messageKey) {
  const state = loadState();
  state[messageKey] = Date.now();
  saveState(state);
}
```

**工时**: 1.5h
**优点**: 与 Python 版行为一致，减少维护成本

### 方案 B：统一使用 Python 包装器

**目标**: 在 `package.json` 中添加 `test:notify:py` 脚本调用 Python 版本。

```json
{
  "scripts": {
    "test:notify": "node scripts/test-notify.js",
    "test:notify:py": "python3 skills/team-tasks/scripts/slack_notify_templates.py notify-test"
  }
}
```

**工时**: 0.5h
**缺点**: 引入 Python 依赖，维护复杂度增加

---

## 6. 验收标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC1 | 首次调用发送通知 | `npm run test:notify -- --status passed` |
| AC2 | 5 分钟内重复调用跳过 | 立即再次运行，无新消息 |
| AC3 | 5 分钟后可再次发送 | 等待 5min+ 后运行 |
| AC4 | CI 环境自动启用 | `CI=true npm run test:notify` |
| AC5 | 通知格式与之前一致 | 对比消息内容 |

---

## 7. 相关文件

| 文件 | 说明 |
|------|------|
| `vibex-fronted/scripts/test-notify.js` | JS 版通知脚本（需修复）|
| `skills/team-tasks/scripts/slack_notify_templates.py` | Python 版参考实现 |
| `skills/team-tasks/scripts/test_slack_notify.py` | Python 测试用例 |

---

**结论**: 推荐方案 A，1.5h 工时统一 JS/Python 去重逻辑，避免重复通知干扰团队。
