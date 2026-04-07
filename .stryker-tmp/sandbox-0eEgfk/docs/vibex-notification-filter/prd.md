# PRD: Coord 通知过滤机制 — 2026-03-31

> **任务**: vibex-notification-filter/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-notification-filter/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | Coord 心跳脚本无去重机制，同一任务重复通知，导致 Slack 噪音 |
| **目标** | 同一任务通知 ≤ 2 次，done/ready 状态不重复通知 |
| **成功指标** | 重复通知率降低 80% |

---

## 2. Epic 拆分

### Epic 1: 通知去重机制（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 心跳脚本增加"已通知任务"集合 | 1h | `expect(notifiedSet).toBeDefined();` |
| S1.2 | 冷却期内跳过已通知任务 | 0.5h | `expect(duplicateNotificationCount).toBeLessThanOrEqual(2);` |
| S1.3 | done/ready 状态跳过 | 0.5h | `expect(doneTasksNotNotified).toBe(true);` |
| S1.4 | 日志记录通知次数 | 0.5h | `expect(log).toContain('notification_count');` |

**DoD**: 同一任务通知 ≤ 2 次，日志可查

---

## 3. 验收标准

| ID | 条件 | 断言 |
|----|------|------|
| AC-1 | 同一任务通知 ≤ 2 次 | `expect(count('same-task-notification')).toBeLessThanOrEqual(2);` |
| AC-2 | done 状态不通知 | `expect(notifications.filter(t => t.status === 'done')).toHaveLength(0);` |

---

**总工时**: 2.5h
