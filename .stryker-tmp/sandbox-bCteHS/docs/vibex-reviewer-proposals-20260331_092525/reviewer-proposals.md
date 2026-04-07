# Reviewer 提案 — 2026-03-31 (Round 2)

**Agent**: reviewer
**日期**: 2026-03-31
**项目**: proposals
**仓库**: /root/.openclaw/workspace-reviewer

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 重复通知过滤机制 | coord/Slack | P0 |
| P002 | bug | git ref 同步延迟导致本地缺失远程 commit | git/协作 | P1 |
| P003 | improvement | Epic 完成时自动触发下一 Epic | coord/流程 | P1 |

---

## 2. 提案详情

### P001: 重复通知过滤机制

**问题描述**: reviewer 收到重复的任务通知（reviewer-push-epic* 收到 2-3 次），原因：多个 agent 对同一任务状态变更发送通知

**根因分析**: 无去重机制，coord + 其他 agent 均可触发通知

**影响范围**: reviewer 所有任务流

**建议方案**: 
1. 每个任务只允许发送一次通知
2. 通知携带 task + action hash，去重
3. 或使用 team-tasks 的锁机制

**验收标准**: 每个任务最多收到 1 次通知

**工作量**: 1h

---

### P002: git ref 同步延迟

**问题描述**: dev commit 后 reviewer 本地 `git fetch` 仍看不到新 commit，需等待几秒

**根因分析**: Git fetch 是异步的，或 remote tracking 分支更新延迟

**影响范围**: reviewer 审查流程

**建议方案**: 
1. 使用 `git ls-remote origin` 获取最新 SHA
2. 或在 fetch 后加 `--force` 刷新 tracking 分支
3. 或等待 `git rev-parse HEAD` 与远程 SHA 对齐

**验收标准**: fetch 后立即可见最新 commit

**工作量**: 0.5h

---

### P003: Epic 完成时自动触发下一 Epic

**问题描述**: Epic 审查完成后需等待 Coord 派发下一 Epic，流程不连贯

**根因分析**: team-tasks DAG 依赖手动解锁

**建议方案**: 
- reviewer-push-* done 时自动触发下一 Epic
- 或在 task_manager.py 中实现自动 DAG 推进

**验收标准**: Epic 完成后 < 1 分钟解锁下一 Epic

**工作量**: 2h

---

## 3. 今日审查统计

| 指标 | 数值 |
|------|------|
| 审查任务数 | 10+ |
| PASSED | 10+ |
| 驳回 | 0 |
| changelog 遗漏 | 0 |

**已审查项目 (2026-03-31)**:
- canvas-epic3-test-fill (Epic1, Epic2, Epic3)
- canvas-selection-filter-bug (Epic1)
- vibex-test-env-fix (Epic1, Epic2, Epic3)
- vibex-contract-testing (Epic1, Epic2, Epic3, Epic4)
- vibex-reviewer-proposals (collect-proposals)

---

*文档版本: v1.0*
*下次审查: 2026-04-01*
