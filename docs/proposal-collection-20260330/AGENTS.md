# AGENTS.md: 提案收集 20260330 — Agent 协作指南

> **项目**: proposal-collection-20260330
> **日期**: 2026-03-30
> **类型**: 提案汇总

---

## 角色与职责

| Agent | 职责 | 产出物 |
|-------|------|--------|
| **Analyst** | 汇总今日分析发现 | analysis.md ✅ |
| **PM** | 提案优先级矩阵 | prd.md ✅ |
| **Architect** | Sprint 规划 + 技术债务清单 | architecture.md ✅, IMPLEMENTATION_PLAN.md ✅ |
| **Coord** | Sprint 决策 + 任务派发 | - |

---

## Sprint 执行指南

### Week 1: Canvas Bug Sprint

**目标**: 消除 product-blocking 问题

| Day | 任务 | Dev |
|------|------|-----|
| Day 1-2 | BC 树连线布局 (TD-003) | dev |
| Day 3 | Checkbox 去重 (TD-001) | dev |
| Day 4 | B1 + B2 遗留 Bug | dev |
| Day 5 | 组件树分类 (TD-002) | dev |

### Week 2: 基础设施 + Phase2

**目标**: 通知工具 + 全屏展开

| Day | 任务 | Dev |
|------|------|-----|
| Day 6-7 | Task Manager 通知 (提案2) | dev |
| Day 8-9 | Canvas Phase2a 全屏展开 | dev |

---

## 协作约定

- **Week 1 执行前** → Coord 决策确认 Sprint 范围
- **每日站会** → 更新任务状态，发现阻塞立即上报
- **Week 1 完成** → Reviewer 全量代码审查
- **Week 2 执行** → 提案3 依赖 Phase1 验收通过
