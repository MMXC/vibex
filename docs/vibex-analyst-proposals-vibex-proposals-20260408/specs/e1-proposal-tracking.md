# Spec: Epic E1 — 提案执行追踪

## 1. 功能概述

创建 `docs/proposals/TRACKING.md`，维护所有提案状态，解决"提案提出后无人认领"问题。

## 2. 文件格式

```markdown
# VibeX Proposal Tracking

## 提案生命周期状态
- `proposed` — 已提出，待评审
- `triaged` — 已评审，待派发
- `in-progress` — 正在执行
- `done` — 已完成
- `stale` — 超过 2 周未启动，标记过期

## 提案列表

| ID | 日期 | 提案人 | 标题 | 优先级 | 状态 | Assignee |
|----|------|--------|------|--------|------|----------|
| A-P0-1 | 2026-04-08 | analyst | 提案执行率归零 | P0 | triaged | - |
...
```

## 3. 录入规则

1. 每次提案收集后 24h 内，由 Analyst 录入 TRACKING.md
2. Coord 心跳扫描时，检查 `status=triaged` 且 `priority=P0` 的提案
3. P0 提案 48h 内必须分配 assignee

## 4. 验收标准

```typescript
expect(fs.existsSync('docs/proposals/TRACKING.md')).toBe(true)
expect(grep('A-P0-1', 'docs/proposals/TRACKING.md')).toBeTruthy()
expect(grep('A-P0-2', 'docs/proposals/TRACKING.md')).toBeTruthy()
```
