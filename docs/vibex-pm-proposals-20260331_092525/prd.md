# PRD: PM 自检提案 — 2026-03-31 批次2

> **任务**: vibex-pm-proposals-20260331_092525/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **产出物**: /root/.openclaw/vibex/docs/vibex-pm-proposals-20260331_092525/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | PM 自检提案：Canvas状态管理(P0)、提案追踪(P1)、用户引导(P1)、PRD模板(P2)、KPI体系(P2) |
| **目标** | 提升产品 UX 质量，建立提案全生命周期管理和 KPI 量化体系 |
| **成功指标** | checkbox 成功率 ≥95%；提案执行率 ≥60%；首次完成率 ≥80% |

---

## 2. Epic 拆分

### Epic 1: Canvas 状态管理规范（P0）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S1.1 节点状态统一 | 1h | `expect(nodeStates).toHaveLength(2);` |
| S1.2 checkbox 即时反馈 | 1h | `expect(feedback).toBeImmediate();` |
| S1.3 操作成功率验证 | 1h | `expect(checkboxSuccessRate).toBeGreaterThanOrEqual(0.95);` |

**DoD**: checkbox 成功率 ≥ 95%

---

### Epic 2: 提案生命周期追踪机制（P1）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S2.1 提案状态机定义 | 0.5h | `expect(Object.keys(states)).toEqual(['submitted','reviewing','adopted','executed','rejected']);` |
| S2.2 状态变更通知 | 1h | `expect(notification).toBeSentOnStateChange();` |
| S2.3 提案 dashboard | 2h | `expect(dashboard).toShowAllProposalStates();` |
| S2.4 执行率统计 | 0.5h | `expect(executionRate).toBeGreaterThanOrEqual(0.6);` |

**DoD**: 提案执行率 ≥ 60%

---

### Epic 3: 用户引导流程优化（P1）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S3.1 首次登录引导教程 | 2h | `expect(tutorial).toBeSkippable(); expect(tutorialShown).toBeOnFirstLogin();` |
| S3.2 关键操作 tooltip | 2h | `expect(tooltips).toExistFor('addContext','generateFlows','export');` |
| S3.3 引导完成验证 | 2h | `expect(firstCompletionRate).toBeGreaterThanOrEqual(0.8);` |

**DoD**: 首次完成率 ≥ 80%

---

### Epic 4: PRD 模板标准化（P2）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S4.1 统一模板建立 | 1h | `expect(template).toContain('背景与目标');` |
| S4.2 模板验证脚本 | 1h | `expect(validatePrd(template)).toBe(true);` |

**DoD**: 所有新项目使用统一模板

---

### Epic 5: KPI 量化体系（P2）

| Story | 工时 | 验收标准 |
|-------|------|---------|
| S5.1 核心 KPI 定义 | 1h | `expect(Object.keys(kpis)).toContain('taskCompletionRate');` |
| S5.2 KPI dashboard | 2h | `expect(dashboard).toShowKpiTrends();` |
| S5.3 每周报告 | 1h | `expect(weeklyReport).toBeSent();` |

**DoD**: 核心 KPI 可视化，每周自动报告

---

**总工时**: 19h
