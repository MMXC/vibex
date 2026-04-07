# PRD: Flow Step Check Fix

**项目**: flow-step-check-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
勾选流程树卡片时，父节点状态变为 confirmed，但子步骤仍保持 pending。

### 根因
`confirmFlowNode` 只设置 `flowNodes[].isActive` 和 `flowNodes[].status`，不级联到 `steps` 数组。

### 目标
勾选流程卡片 → 父节点 + 所有子步骤同步 confirmed。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| 级联确认 | ❌ 不级联 | ✅ 全部 confirmed |
| 用户认知一致 | ❌ 认知不一致 | ✅ 勾选 = 完成 |

---

## Epic 拆分

### Epic 1: 级联确认逻辑修复
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 修改 confirmFlowNode 级联到 steps | 0.25h | expect(stepStatus).toBe('confirmed') |
| E1-S2 | 测试验证 | 0.25h | expect(allPass).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 级联确认 | confirmFlowNode 级联到 steps | expect(allStepsConfirmed).toBe(true) | ✅ |
| F1.2 | 无 regression | 其他树功能正常 | expect(otherTreesWork).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | 级联确认逻辑修复 | 0.5h | P0 |
| **总计** | | **0.5h** | |

---

## Sprint 排期建议

**Sprint 0 (0.5h)**:
- E1: 级联确认逻辑修复（0.5h）

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 取消确认逻辑缺失 | 低 | 低 | 可后续迭代添加 |

---

## DoD (Definition of Done)

### Epic 1: 级联确认逻辑修复
- [ ] `confirmFlowNode` 级联修改 `steps` 数组
- [ ] 勾选流程卡片后，父节点 confirmed
- [ ] 勾选流程卡片后，所有子步骤 confirmed
- [ ] 其他树功能无 regression

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 点击流程卡片 checkbox | 勾选 | 父节点 status = 'confirmed' |
| AC1.2 | 点击流程卡片 checkbox | 勾选 | 所有子步骤 status = 'confirmed' |
| AC1.3 | 展开步骤 | 勾选后 | 步骤边框绿色 |
| AC1.4 | 其他树操作 | 无修改 | 功能正常 |
