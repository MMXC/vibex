# Test Notify 分析报告

> **分析日期**: 2026-04-05
> **分析者**: analyst agent
> **项目**: vibex-test-notify-20260405

---

## 1. 执行摘要

`--notify` 是测试基础设施中的**结果通知标志**，用于在测试完成后将结果推送到 Slack。当前有两套实现：Node.js (`test-notify.js`) 和 Python (`slack_notify_templates.py`)，分别服务于前端 Jest 和团队任务系统。

**核心发现**：
- `--notify` 已实现 Slack webhook 通知
- 有 5 分钟去重机制（Python 版本）
- 异步发送，不阻塞主测试流程
- 缺少 `--notify` 在 CI 中的集成验证

---

## 2. 现状分析

### 2.1 Node.js 实现 (`test-notify.js`)

**文件**: `vibex-fronted/scripts/test-notify.js`

```javascript
// 用法
node scripts/test-notify.js --status passed --duration 120s --tests 50
node scripts/test-notify.js --status failed --duration 120s --tests 50 --errors 3

// package.json 集成
"test:notify": "node scripts/test-notify.js"
```

**功能**：
| 功能 | 状态 | 说明 |
|------|------|------|
| Slack webhook 发送 | ✅ | HTTPS POST 到 `CI_NOTIFY_WEBHOOK` |
| 环境变量控制 | ✅ | `CI_NOTIFY_ENABLED`, `CI_NOTIFY_WEBHOOK` |
| 不阻塞主流程 | ✅ | `async/await`，失败不影响 exit code |
| CI 检测 | ✅ | `CI=true` 时自动启用 |

**问题**：
- 没有去重机制（重复调用会重复发送）
- 没有失败重试逻辑
- 没有超时控制

### 2.2 Python 实现 (`slack_notify_templates.py`)

**文件**: `skills/team-tasks/scripts/slack_notify_templates.py`

```python
# 用法
python3 slack_notify_templates.py notify-ready analyst my-task "任务描述"
python3 slack_notify_templates.py notify-report analyst my-task "进度"
```

**功能**：
| 功能 | 状态 | 说明 |
|------|------|------|
| 5 分钟去重 | ✅ | `_DEDUP_WINDOW_MS = 5 * 60 * 1000` |
| 通知类型 | ✅ | ready / report / brief / coord |
| CI 检测 | ✅ | 通过 `_should_notify()` 控制 |
| pytest 集成 | ✅ | `test_slack_notify.py` 测试用例 |

**优势**：去重机制成熟，避免同一条消息在短时间内重复发送。

### 2.3 Git History 分析

```
commit 2041b146 (2026-03-13)
  feat(test): D3 测试结果自动通知
  - test-notify.js 脚本
  - CI_NOTIFY_WEBHOOK 环境变量
  - CI_NOTIFY_ENABLED 配置

commit dbe00821 (2026-04-04)
  feat(proposals): E3/E4 add TEMPLATE + priority + slack dedup
  - 添加 Python 版 slack_notify_templates.py
  - 5 分钟去重逻辑
  - pytest 测试用例
```

---

## 3. 需求分析

### 3.1 业务场景

| 场景 | 描述 | 当前支持 |
|------|------|----------|
| 测试完成通知 | Jest 测试完成后发送 Slack | ✅ JS 实现 |
| 任务状态通知 | coord/analyst 等 agent 发送阶段报告 | ✅ Python 实现 |
| CI 结果推送 | Pipeline 状态推送到 Slack | ⚠️ 需集成 |
| 失败告警 | 测试失败时触发告警 | ✅ `--errors` 参数 |

### 3.2 用户故事

**US1**: 作为 CI/CD 流程，我希望在测试完成后自动收到 Slack 通知，无需手动检查结果。
- AC1: `npm run test:notify -- --status passed` 发送成功通知
- AC2: `npm run test:notify -- --status failed --errors 3` 发送失败通知
- AC3: 通知在 10 秒内送达

**US2**: 作为团队成员，我不希望收到重复的 Slack 通知（同一条消息 5 分钟内不重复）。
- AC4: 5 分钟内相同 `message_key` 不重复发送
- AC5: 去重状态持久化到磁盘（进程重启后保持）

**US3**: 作为开发者，我希望能控制是否发送通知（dev 环境不发送，CI 环境发送）。
- AC6: `CI_NOTIFY_ENABLED=false` 时跳过发送
- AC7: `CI=true` 时自动启用

---

## 4. 技术方案

### 方案 A：统一 JS 实现 + 去重（推荐）

**目标**: 将 Python 版的去重逻辑移植到 JS，保持实现一致。

```javascript
// test-notify.js 新增去重功能
const messageKey = `test:${status}:${Date.now()}`;
const { skipped, remaining } = await checkDedup(messageKey);

if (skipped) {
  console.log(`⏭️ Skip duplicate notification (${remaining}s remaining)`);
  return;
}
```

**优点**: 前端和团队任务系统使用相同逻辑，减少维护成本
**缺点**: 需要新增 dedup 模块

**工时**: 1.5h

### 方案 B：保持现状 + 文档完善

**目标**: 不改代码，完善使用文档。

```markdown
## 使用约束

1. `--notify` 调用间隔 > 5 分钟
2. CI 中使用 `&&` 链式调用，确保上一个成功才发送
3. 失败通知使用 `--errors` 参数携带错误数
```

**优点**: 无代码变更，风险低
**缺点**: 无法强制执行去重

**工时**: 0.5h

---

## 5. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Webhook 失效导致通知丢失 | 低 | 中 | 日志记录失败，不阻塞 |
| 去重状态文件损坏 | 低 | 低 | 读取失败时视为新消息 |
| 通知延迟影响 CI 速度 | 低 | 低 | 异步发送，单独进程 |

---

## 6. 验收标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC1 | `--status passed` 发送绿色 Slack 消息 | 本地运行验证 |
| AC2 | `--status failed --errors 3` 发送红色消息 | 本地运行验证 |
| AC3 | 通知在 10 秒内送达 | 计时验证 |
| AC4 | 5 分钟内相同消息不重复发送 | pytest 验证 Python |
| AC5 | 去重状态持久化 | 重启进程后验证 |
| AC6 | `CI_NOTIFY_ENABLED=false` 跳过 | 环境变量测试 |
| AC7 | `CI=true` 自动启用 | CI 环境验证 |

---

## 7. 相关文件

| 文件 | 说明 |
|------|------|
| `vibex-fronted/scripts/test-notify.js` | JS 版通知脚本 |
| `skills/team-tasks/scripts/slack_notify_templates.py` | Python 版通知模板 |
| `skills/team-tasks/scripts/test_slack_notify.py` | Python 版测试用例 |

---

## 8. 下一步

1. **方案选择**: 推荐方案 A，统一 JS 去重逻辑
2. **实现**: 在 `test-notify.js` 中增加 dedup 模块
3. **测试**: 添加 Jest 测试用例验证去重行为
4. **文档**: 更新 README 说明 `--notify` 用法

---

**结论**: `--notify` 基础设施已基本就绪，核心功能（Slack 通知、异步发送、环境变量控制）已实现。主要改进点是统一 JS 和 Python 的去重逻辑，建议方案 A（1.5h 工时）。
