# PRD: Flow Checkbox Toggle Fix

**项目**: flow-checkbox-toggle-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
2 个问题：
1. **checkbox 无 toggle** — `confirmFlowNode` 只单向设置 confirmed，无反向操作
2. **传输全部流程** — `generateComponentFromFlow` 发送所有 flowNodes，未过滤未确认节点

### 目标
添加 toggle 行为，生成组件时只传输 confirmed 的流程。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| toggle 行为 | ❌ 单向 | ✅ 双向 toggle |
| 传输过滤 | ❌ 全部 | ✅ 仅 confirmed |

---

## Epic 拆分

### Epic 1: Toggle 行为修复
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 添加 toggleFlowNode | 0.25h | expect(toggleFlowNode).toBeDefined() |
| E1-S2 | 修改 BusinessFlowTree checkbox onChange | 0.25h | expect(toggleWorks).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | toggleFlowNode | 单向 → toggle | expect(toggleWorks).toBe(true) | ❌ |
| F1.2 | checkbox onChange | toggle confirmed/pending | expect(toggleWorks).toBe(true) | ✅ |

---

### Epic 2: 生成组件过滤修复
**工时**: 0.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | 过滤 confirmed flows | 0.25h | expect(onlyConfirmed).toBe(true) |
| E2-S2 | 验收测试 | 0.25h | expect(noPending).toBe(true) |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 过滤 confirmed | generateComponentFromFlow 只发送 confirmed | expect(onlyConfirmed).toBe(true) | ✅ |
| F2.2 | 无 pending 泄露 | API 请求中无 pending flow | expect(noPendingInAPI).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | Toggle 行为修复 | 0.5h | P0 |
| E2 | 生成组件过滤修复 | 0.5h | P0 |
| **总计** | | **1h** | |

---

## Sprint 排期建议

**Sprint 0 (0.5 天)**:
- E1 + E2 并行（1h）

---

## DoD (Definition of Done)

### Epic 1: Toggle 行为修复
- [ ] `toggleFlowNode` 存在于 canvasStore
- [ ] 点击 checkbox confirmed → pending（toggle 工作）
- [ ] 点击 checkbox pending → confirmed（toggle 工作）

### Epic 2: 生成组件过滤修复
- [ ] `generateComponentFromFlow` 只发送 confirmed flows
- [ ] API 请求中无 pending flow

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 点击已确认 checkbox | toggle | status = 'pending' |
| AC1.2 | 点击未确认 checkbox | toggle | status = 'confirmed' |
| AC2.1 | 调用 generateComponentFromFlow | API body | 只有 confirmed flows |
