# PRD: Test Notify Fix

> **项目**: test-notify-fix  
> **目标**: 修复 JS 版本 `--notify` 缺少去重机制  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
`--notify` 是测试基础设施的结果通知标志，JS 版本 (`test-notify.js`) 缺少去重机制，导致 CI 重复触发、并发调用、调试重试时会发送重复通知。Python 版本已实现 5 分钟去重，JS 版本需同步。

### 目标
- P1: JS 版本实现 5 分钟去重（与 Python 版一致）
- P1: 添加失败重试逻辑
- P2: 添加超时控制
- P2: CI 环境自动启用

### 成功指标
- AC1: 首次调用发送通知
- AC2: 5 分钟内重复调用跳过
- AC3: 5 分钟后可再次发送
- AC4: CI 环境自动启用

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 关联问题 |
|------|------|--------|------|----------|
| E1 | JS 去重机制 | P1 | 1h | JS 无去重 |
| E2 | 重试 + 超时 | P1 | 0.5h | 无重试、无超时 |
| E3 | CI 自动启用 | P2 | 0.5h | CI 环境需手动配置 |
| **合计** | | | **2h** | |

---

### Epic 1: JS 去重机制

**问题根因**: `test-notify.js` 无去重，每次调用都发送通知。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 去重模块实现 | 0.5h | 见下方 AC |
| S1.2 | 与 test-notify.js 集成 | 0.5h | 见下方 AC |

**S1.1 验收标准**:
- `expect(checkDedup(key).skipped).toBe(true)` within 5 minutes ✓
- `expect(checkDedup(key).remaining).toBeGreaterThan(0)` ✓
- 状态持久化到 `.notify-dedup.json` ✓

**S1.2 验收标准**:
- `npm run test:notify -- --status passed` 发送通知 ✓
- 5 分钟内重复调用跳过 ✓

**DoD**:
- [ ] `dedup.js` 实现 `checkDedup()` 和 `recordSend()`
- [ ] 去重窗口 `_DEDUP_WINDOW_MS = 5 * 60 * 1000`
- [ ] 与 `test-notify.js` 集成
- [ ] jest 测试覆盖

---

### Epic 2: 重试 + 超时

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 重试逻辑 | 0.3h | webhook 失败重试最多 3 次 ✓ |
| S2.2 | 超时控制 | 0.2h | 5s 超时控制 ✓ |

**S2.1 验收标准**:
- `expect(attempts).toBeLessThanOrEqual(4)` (1 initial + 3 retries) ✓
- 指数退避 1s/2s/4s ✓

**S2.2 验收标准**:
- `AbortSignal.timeout(5000)` ✓
- 超时不计入重试 ✓

**DoD**:
- [ ] `sendWithRetry()` 实现指数退避
- [ ] `AbortSignal.timeout(5000)` 超时控制
- [ ] jest 测试覆盖

---

### Epic 3: CI 自动启用

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | CI 环境检测 | 0.5h | CI=true 时自动启用 ✓ |

**S3.1 验收标准**:
- `expect(process.env.CI).toBe('true')` 时自动启用 ✓
- 本地环境默认不发送 ✓

**DoD**:
- [ ] `test-notify.js` 检测 `process.env.CI`
- [ ] CI=true 且 CI_NOTIFY_WEBHOOK 存在时自动发送

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | Epic | 验收标准 | 页面集成 |
|----|--------|------|------|----------|----------|
| F1.1 | 去重模块 | 5 分钟窗口去重 | E1 | expect(checkDedup(key).skipped).toBe(true) | 无 |
| F1.2 | 去重集成 | 与 test-notify.js 集成 | E1 | expect(skipped).toBe(true) for repeat | 无 |
| F2.1 | 重试逻辑 | 指数退避重试 | E2 | expect(attempts).toBeLessThanOrEqual(4) | 无 |
| F2.2 | 超时控制 | 5s AbortSignal | E2 | expect(timeout).toBe(5000) | 无 |
| F3.1 | CI 检测 | CI=true 自动启用 | E3 | expect(enabled).toBe(true) when CI=true | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 首次调用 | `test-notify.js --status passed` | Slack 收到通知 |
| AC2 | 5 分钟内重复 | 再次调用 | 跳过发送，输出提示 |
| AC3 | 5 分钟后 | 再次调用 | 发送通知 |
| AC4 | CI=true | `CI=true node test-notify.js` | 自动启用 |
| AC5 | webhook 失败 | 3 次重试后 | 记录日志，不抛异常 |
| AC6 | 网络慢 | webhook 请求 | 5s 超时 |

---

## 5. DoD (Definition of Done)

### Epic 1: JS 去重机制
- [ ] `dedup.js` 实现 `checkDedup()` 和 `recordSend()`
- [ ] 去重窗口 5 分钟
- [ ] 状态持久化到 `.notify-dedup.json`
- [ ] 与 `test-notify.js` 集成
- [ ] jest 测试通过

### Epic 2: 重试 + 超时
- [ ] `sendWithRetry()` 实现指数退避
- [ ] `AbortSignal.timeout(5000)` 超时
- [ ] jest 测试通过

### Epic 3: CI 自动启用
- [ ] 检测 `process.env.CI`
- [ ] CI=true 时自动发送

---

## 6. 实施计划

### Sprint 1 (2h)

| 阶段 | 内容 | 工时 |
|------|------|------|
| Phase 1 | E1: 去重模块 + 集成 | 1h |
| Phase 2 | E2: 重试 + 超时 | 0.5h |
| Phase 3 | E3: CI 自动启用 | 0.5h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 通知发送 < 10s（含重试） |
| 可靠性 | 重试机制确保送达 |

---

## 8. 风险缓解

| 风险 | 缓解 |
|------|------|
| 去重缓存损坏 | 读取失败时删除重建 |
| 重试风暴 | 指数退避控制 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
