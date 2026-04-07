# PRD: VibeX Test Notify 去重与统一

> **项目**: vibex-test-notify-20260405  
> **目标**: 统一 JS/Python 去重逻辑，完善测试通知基础设施  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
VibeX 有两套 `--notify` 实现：Node.js (`test-notify.js`) 和 Python (`slack_notify_templates.py`)。Python 版有 5 分钟去重机制，JS 版无去重，导致通知可能重复。

### 目标
- P1: 将 Python 去重逻辑移植到 JS，实现统一
- P1: 添加失败重试逻辑
- P2: 添加超时控制
- P2: 完善 CI 集成文档

### 成功指标
- AC1: JS 版 `--status passed` 发送 Slack 消息
- AC2: JS 版 5 分钟内相同消息不重复发送
- AC3: 去重状态持久化到磁盘
- AC4: 失败时异步重试（最多 3 次）

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 关联问题 |
|------|------|--------|------|----------|
| E1 | JS 去重逻辑实现 | P1 | 1h | JS 版无去重机制 |
| E2 | 重试 + 超时控制 | P1 | 0.5h | 无重试、无超时 |
| E3 | CI 集成文档 | P2 | 0.5h | 缺少 CI 集成指南 |
| **合计** | | | **2h** | |

---

### Epic 1: JS 去重逻辑实现

**问题根因**: `test-notify.js` 无去重机制，短时间内多次调用会发送重复通知。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 去重模块实现 | 0.5h | 见下方 AC |
| S1.2 | 与 test-notify.js 集成 | 0.5h | 见下方 AC |

**S1.1 验收标准**:
- `expect(checkDedup(key).skipped).toBe(true)` after 相同 key 5分钟内 ✓
- `expect(checkDedup(key).remaining).toBeGreaterThan(0)` 剩余时间 ✓
- 去重状态持久化到 `.dedup-cache.json`

**S1.2 验收标准**:
- `node test-notify.js --status passed --duration 120s --tests 50` 发送通知 ✓
- 5 分钟内重复调用不发送（检查 webhook 调用次数）✓

**DoD**:
- [ ] `dedup.js` 模块实现 `checkDedup()` 和 `recordMessage()`
- [ ] 去重窗口为 5 分钟（`_DEDUP_WINDOW_MS = 5 * 60 * 1000`）
- [ ] 状态持久化到 `.dedup-cache.json`
- [ ] 与 `test-notify.js` 集成，调用前检查去重
- [ ] jest 测试覆盖去重场景

---

### Epic 2: 重试 + 超时控制

**问题根因**: webhook 请求无超时，失败时无重试，可能导致通知丢失且阻塞流程。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 重试逻辑实现 | 0.3h | 见下方 AC |
| S2.2 | 超时控制 | 0.2h | 见下方 AC |

**S2.1 验收标准**:
- webhook 请求失败时最多重试 3 次（间隔 1s, 2s, 4s）✓
- 重试次数用尽后记录日志，不抛异常 ✓
- `expect(sendWithRetry().attempts).toBeLessThanOrEqual(4)` ✓

**S2.2 验收标准**:
- webhook 请求超时设置为 5s ✓
- `expect(fetch(url, { signal: AbortSignal.timeout(5000) }))` ✓
- 超时不计入重试

**DoD**:
- [ ] `sendWithRetry()` 实现指数退避重试
- [ ] `AbortSignal.timeout(5000)` 控制超时
- [ ] 失败日志记录到 stderr
- [ ] jest 测试覆盖重试和超时场景

---

### Epic 3: CI 集成文档

**问题根因**: 缺少 `--notify` 在 CI 中的集成指南，开发者不清楚如何使用。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | CI 集成文档 | 0.5h | 见下方 AC |

**S3.1 验收标准**:
- README 包含 `npm run test:notify` 用法说明 ✓
- 包含环境变量配置示例 ✓
- 包含 CI pipeline 集成示例 ✓

**DoD**:
- [ ] `vibex-fronted/scripts/README.md` 存在
- [ ] 包含 `--notify` 用法示例
- [ ] 包含 `CI_NOTIFY_WEBHOOK` 配置说明
- [ ] 包含 GitHub Actions / GitLab CI 示例

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | Epic | 验收标准 | 页面集成 |
|----|--------|------|------|----------|----------|
| F1.1 | 去重模块 | 5 分钟窗口去重 | E1 | expect(checkDedup(key).skipped).toBe(true) | 无 |
| F1.2 | 去重持久化 | 状态保存到 .dedup-cache.json | E1 | expect(readCache()[key]).toBeDefined() | 无 |
| F2.1 | 重试逻辑 | 指数退避重试（最多 3 次）| E2 | expect(attempts).toBeLessThanOrEqual(4) | 无 |
| F2.2 | 超时控制 | 5s AbortSignal.timeout | E2 | expect(timeout).toBe(5000) | 无 |
| F3.1 | CI 文档 | README 集成指南 | E3 | expect(readme).toContain('CI_NOTIFY_WEBHOOK') | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 运行 test-notify.js | `--status passed` | Slack 收到绿色通知 |
| AC2 | 5 分钟内重复调用 | `checkDedup(key)` | `skipped: true, remaining: > 0` |
| AC3 | 进程重启后 | 读取 .dedup-cache.json | 去重状态保持 |
| AC4 | webhook 失败 | 3 次重试后 | 记录日志，不抛异常 |
| AC5 | 网络慢 | webhook 请求 | 5s 超时，返回错误 |
| AC6 | CI 环境 | `CI=true` | 自动启用通知 |

---

## 5. DoD (Definition of Done)

### Epic 1: JS 去重逻辑实现
- [ ] `dedup.js` 实现 `checkDedup(key)` 和 `recordMessage(key)`
- [ ] 去重窗口 `_DEDUP_WINDOW_MS = 5 * 60 * 1000`
- [ ] 状态持久化到 `.dedup-cache.json`
- [ ] 与 `test-notify.js` 集成
- [ ] jest 测试覆盖去重场景

### Epic 2: 重试 + 超时控制
- [ ] `sendWithRetry()` 实现指数退避（1s, 2s, 4s）
- [ ] `AbortSignal.timeout(5000)` 超时控制
- [ ] 失败日志记录到 stderr
- [ ] jest 测试覆盖重试和超时场景

### Epic 3: CI 集成文档
- [ ] `vibex-fronted/scripts/README.md` 存在
- [ ] 包含 `--notify` 用法、环境变量、CI 示例
- [ ] 文档可读且准确

---

## 6. 实施计划

### Sprint 1 (2h)

| 阶段 | 内容 | 工时 | 产出 |
|------|------|------|------|
| Phase 1 | E1: dedup.js 实现 + 集成 | 1h | 去重模块 |
| Phase 2 | E2: 重试 + 超时 | 0.5h | test-notify.js 增强 |
| Phase 3 | E3: CI 集成文档 | 0.5h | README.md |

### 依赖关系
- E2 依赖 E1（集成后增强）
- E3 独立，可并行

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 通知发送 < 10s（含重试） |
| 可靠性 | 重试机制确保通知送达 |
| 可观测性 | 失败时记录日志 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 去重缓存文件损坏 | 读取失败时删除文件，视为新消息 |
| 重试风暴 | 指数退避控制请求频率 |
| Webhook 失效 | 日志告警，不阻塞 CI |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
