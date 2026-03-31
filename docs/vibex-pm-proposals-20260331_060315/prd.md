# PRD: PM 自检提案实施 — 2026-03-31

> **任务**: vibex-pm-proposals-20260331_060315/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-pm-proposals-20260331_060315/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | PM 自检提案，4 条改进方向：Canvas 状态管理、提案追踪、用户引导、PRD 模板 |
| **目标** | 提升产品 UX 质量，建立提案全生命周期管理 |
| **成功指标** | checkbox 成功率 ≥95%；提案执行率 ≥60%；首次完成率 ≥80% |

---

## 2. Epic 拆分

### Epic 1: Canvas 状态管理规范（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 节点状态统一（只有未确认/已确认两种） | 1h | `expect(nodeStates).toHaveLength(2); expect(states).toContain('unconfirmed'); expect(states).toContain('confirmed');` |
| S1.2 | checkbox 点击即时视觉反馈 | 1h | `expect(feedback).toBeImmediate(); expect(givenState).not.toBe(afterState);` |
| S1.3 | 操作成功率验证 ≥95% | 1h | `expect(checkboxSuccessRate).toBeGreaterThanOrEqual(0.95);` |

**DoD**: checkbox 操作成功率 ≥ 95%，无状态冲突

---

### Epic 2: 提案生命周期追踪机制（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | 提案状态机定义（5 个状态） | 0.5h | `expect(Object.keys(proposalStates)).toEqual(['submitted','reviewing','adopted','executed','rejected']);` |
| S2.2 | 状态变更 Slack 通知 | 1h | `expect(notification).toBeSentOnStateChange();` |
| S2.3 | 提案 dashboard | 2h | `expect(dashboard).toShowAllProposalStates();` |
| S2.4 | 执行率统计 | 0.5h | `expect(executionRate).toBeGreaterThanOrEqual(0.6);` |

**DoD**: 提案状态全流程可追踪，执行率 ≥ 60%

---

### Epic 3: 用户引导流程优化（P1）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 首次登录引导教程（可跳过） | 2h | `expect(tutorial).toBeSkippable(); expect(tutorialShown).toBeOnFirstLogin();` |
| S3.2 | 关键操作 tooltip 说明 | 2h | `expect(tooltips).toExistFor('addContext','generateFlows','export');` |
| S3.3 | 引导完成后验证 | 2h | `expect(firstCompletionRate).toBeGreaterThanOrEqual(0.8); expect(tutorialCompletionRate).toBeGreaterThanOrEqual(0.6);` |

**DoD**: 首次完成率 ≥ 80%，引导教程完成率 ≥ 60%

---

### Epic 4: PRD 模板标准化（P2）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | 统一 PRD 模板建立 | 1h | `expect(template).toContain('背景与目标'); expect(template).toContain('验收标准');` |
| S4.2 | 模板验证脚本 | 1h | `expect(validatePrd(template)).toBe(true);` |

**DoD**: 所有新项目使用统一模板，模板包含所有必要字段

---

## 3. 实施计划

| Epic | 工时 | 优先级 | 负责人 |
|------|------|--------|--------|
| Epic 1: 状态管理 | 3h | P0 | dev |
| Epic 2: 提案追踪 | 4h | P1 | dev+coord |
| Epic 3: 用户引导 | 6h | P1 | dev |
| Epic 4: PRD 模板 | 2h | P2 | pm |

**总工时**: 15h
