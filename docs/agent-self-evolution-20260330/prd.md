# PRD: Agent 每日自检任务 — 2026-03-30

> **项目**: agent-self-evolution-20260330
> **创建日期**: 2026-03-30
> **类型**: 自我演进
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
7 个 agent（dev、analyst、architect、pm、tester、reviewer、coord）每日通过心跳协调驱动多个并行项目，需要统一的自检任务框架确保知识沉淀和改进闭环。

### 目标
- 建立 7 个 agent 统一的每日自检任务标准
- 确保每项自检可追踪、可验收
- 将改进建议转化为可执行提案

### 关键指标
| 指标 | 目标 |
|------|------|
| 自检完成率 | 100%（7/7） |
| 提案采纳率 | ≥ 50% |
| 经验沉淀数量 | ≥ 3 条/日 |

---

## 2. Epic 拆分

### Epic 1: Analyst 每日自检任务

**Story ID**: F1.1

| 功能 | 描述 | 验收标准 | 优先级 |
|------|------|----------|--------|
| 分析产出自检 | 统计今日分析任务数量、质量评分 | `expect(analyst_daily_tasks).toBeGreaterThanOrEqual(1)` | P0 |
| 根因分析质量 | 检查根因定位是否准确 | `expect(accuracy_score).toBeGreaterThanOrEqual(7)` | P0 |
| 提案提交 | 提交至少 1 条改进提案 | `expect(proposals_submitted).toBeGreaterThanOrEqual(1)` | P1 |
| 经验沉淀 | 记录 E012 等经验教训 | `expect(lessons_count).toBeGreaterThanOrEqual(1)` | P1 |

**DoD**: 自检文档存在，包含上述 4 项检查结果

---

### Epic 2: PM 每日自检任务

**Story ID**: F1.2

| 功能 | 描述 | 验收标准 | 优先级 |
|------|------|----------|--------|
| PRD 产出自检 | 统计今日 PRD 产出数量 | `expect(pm_prd_count).toBeGreaterThanOrEqual(1)` | P0 |
| Epic 拆分质量 | 检查 Epic 拆分完整性 | `expect(epic_completeness).toBeGreaterThanOrEqual(0.8)` | P0 |
| 验收标准质量 | 检查 expect() 断言格式 | `expect(acceptance_criteria_format).toBe(true)` | P1 |
| 提案提交 | 提交至少 1 条改进提案 | `expect(proposals_submitted).toBeGreaterThanOrEqual(1)` | P1 |

**DoD**: 自检文档存在，包含上述 4 项检查结果

---

### Epic 3: Architect 每日自检任务

**Story ID**: F1.3

| 功能 | 描述 | 验收标准 | 优先级 |
|------|------|----------|--------|
| 架构设计自检 | 统计今日架构设计数量 | `expect(architect_designs).toBeGreaterThanOrEqual(1)` | P0 |
| 技术债务标注 | 检查 tech debt 是否显式标注 | `expect(tech_debt_documented).toBe(true)` | P1 |
| 接口完整性 | 检查接口定义覆盖率 | `expect(interface_coverage).toBeGreaterThanOrEqual(0.9)` | P1 |
| 提案提交 | 提交至少 1 条改进提案 | `expect(proposals_submitted).toBeGreaterThanOrEqual(1)` | P1 |

**DoD**: 自检文档存在，包含上述 4 项检查结果

---

### Epic 4: Dev 每日自检任务

**Story ID**: F1.4

| 功能 | 描述 | 验收标准 | 优先级 |
|------|------|----------|--------|
| 代码产出自检 | 统计今日 commit 数量 | `expect(dev_commits).toBeGreaterThanOrEqual(1)` | P0 |
| 测试覆盖率 | 检查新增代码测试覆盖 | `expect(test_coverage).toBeGreaterThanOrEqual(0.8)` | P0 |
| Bug 修复 | 统计修复的 bug 数量 | `expect(bugs_fixed).toBeGreaterThanOrEqual(0)` | P1 |
| 提案提交 | 提交至少 1 条改进提案 | `expect(proposals_submitted).toBeGreaterThanOrEqual(1)` | P1 |

**DoD**: 自检文档存在，包含上述 4 项检查结果

---

### Epic 5: Tester 每日自检任务

**Story ID**: F1.5

| 功能 | 描述 | 验收标准 | 优先级 |
|------|------|----------|--------|
| 测试产出自检 | 统计今日测试任务数量 | `expect(tester_tasks).toBeGreaterThanOrEqual(1)` | P0 |
| Bug 发现率 | 检查发现的有效 bug 数量 | `expect(bugs_found).toBeGreaterThanOrEqual(0)` | P1 |
| 测试报告 | 检查测试报告完整性 | `expect(report_completeness).toBe(true)` | P1 |
| 提案提交 | 提交至少 1 条改进提案 | `expect(proposals_submitted).toBeGreaterThanOrEqual(1)` | P1 |

**DoD**: 自检文档存在，包含上述 4 项检查结果

---

### Epic 6: Reviewer 每日自检任务

**Story ID**: F1.6

| 功能 | 描述 | 验收标准 | 优先级 |
|------|------|----------|--------|
| 审查产出自检 | 统计今日审查任务数量 | `expect(reviewer_tasks).toBeGreaterThanOrEqual(1)` | P0 |
| 审查质量 | 检查审查意见质量评分 | `expect(review_quality).toBeGreaterThanOrEqual(7)` | P1 |
| 审查闭环率 | 检查审查意见闭环率 | `expect(closure_rate).toBeGreaterThanOrEqual(0.8)` | P1 |
| 提案提交 | 提交至少 1 条改进提案 | `expect(proposals_submitted).toBeGreaterThanOrEqual(1)` | P1 |

**DoD**: 自检文档存在，包含上述 4 项检查结果

---

### Epic 7: Coord 每日自检任务

**Story ID**: F1.7

| 功能 | 描述 | 验收标准 | 优先级 |
|------|------|----------|--------|
| 协调产出自检 | 统计今日协调任务数量 | `expect(coord_tasks).toBeGreaterThanOrEqual(1)` | P0 |
| 项目状态 | 检查活跃项目数量是否合理 | `expect(active_projects).toBeLessThanOrEqual(10)` | P1 |
| 待命计数 | 检查待命机制是否正常 | `expect(standby_count).toBeLessThanOrEqual(3)` | P1 |
| 提案提交 | 提交至少 1 条改进提案 | `expect(proposals_submitted).toBeGreaterThanOrEqual(1)` | P1 |

**DoD**: 自检文档存在，包含上述 4 项检查结果

---

## 3. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | Analyst 自检 | 每日 06:00 前 | 自检文档存在于 `docs/agent-self-evolution-YYYYMMDD/` |
| AC1.2 | PM 自检 | 每日 06:00 前 | 自检文档存在，包含 PRD 产出统计 |
| AC1.3 | Architect 自检 | 每日 06:00 前 | 自检文档存在，包含架构设计统计 |
| AC1.4 | Dev 自检 | 每日 06:00 前 | 自检文档存在，包含 commit 统计 |
| AC1.5 | Tester 自检 | 每日 06:00 前 | 自检文档存在，包含测试任务统计 |
| AC1.6 | Reviewer 自检 | 每日 06:00 前 | 自检文档存在，包含审查任务统计 |
| AC1.7 | Coord 自检 | 每日 06:00 前 | 自检文档存在，包含协调任务统计 |

---

## 4. 非功能需求

| 需求 | 标准 |
|------|------|
| 时效性 | 自检文档在每日 06:00 前提交 |
| 可追溯性 | 所有数据可从 git log 或文档追溯 |
| 完整性 | 每个 agent 必须提交自检 |

---

## 5. 快速验收单

```bash
# 检查 7 个 agent 自检文档是否都存在
for agent in analyst pm architect dev tester reviewer coord; do
  test -f docs/agent-self-evolution-*/${agent}-self-check-*.md && echo "$agent: OK" || echo "$agent: MISSING"
done

# 检查提案数量
grep -r "[ACTIONABLE]" docs/agent-self-evolution-*/ | wc -l
# 预期: >= 1
```

---

**文档版本**: v1.0
**下次审查**: 2026-03-31
