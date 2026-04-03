# PRD: BoundedContext Checkbox Confirm Style Fix

**项目**: bc-checkbox-confirm-style-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: PM Done

---

## 执行摘要

### 背景
BoundedContextTree 卡片存在 2 个 UX/Bug：
1. **checkbox 与标题不同行** — `selectionCheckbox` 绝对定位脱离文档流
2. **勾选后外框不变绿** — `selectionCheckbox` 的 `checked` 绑定错误（永远为 true）

### 根因
- 双 checkbox 结构：`selectionCheckbox`（绝对定位）+ `confirmCheckbox`（inline）
- `selectionCheckbox.checked` 条件 `node.isActive !== false && node.status !== 'pending'` 永远为 true（只要不是 false 就 checked）
- 两个 checkbox 绑定不同逻辑，用户认知混乱

### 目标
合并为单一 checkbox，与标题同行，勾选后边框正确变色。

### 成功指标

| KPI | 当前 | 目标 |
|-----|------|------|
| checkbox 数量 | 2 个 | 1 个 ✅ |
| checkbox 同行 | ❌ 不同行 | ✅ 同标题行 |
| 边框变色 | ❌ 不变绿 | ✅ confirmed 绿色 |

---

## Epic 拆分

### Epic 1: BoundedContextTree Checkbox 修复
**工时**: 1.5h | **优先级**: P0

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | 删除 selectionCheckbox（绝对定位）| 0.25h | expect(absCheckboxCount).toBe(0) |
| E1-S2 | 保留并修正 confirmCheckbox | 0.5h | expect(checkboxCount).toBe(1) |
| E1-S3 | checkbox 与标题同行（inline）| 0.25h | expect(checkboxInline).toBe(true) |
| E1-S4 | 边框变色验证 | 0.25h | expect(borderColorOnConfirm).toBe('green') |

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 单 checkbox | 只有 1 个 checkbox | expect(checkboxCount).toBe(1) | ✅ |
| F1.2 | checkbox 同行 | checkbox 与标题 `<h4>` 同一行 | expect(checkboxInlineWithTitle).toBe(true) | ✅ |
| F1.3 | 边框变色 | confirmed → 绿色边框 | expect(borderColor).toBe('var(--color-success)') | ✅ |
| F1.4 | 无绝对定位 | 无 position: absolute checkbox | expect(absPositionCount).toBe(0) | ✅ |
| F1.5 | toggle 行为 | 点击切换 confirmed/pending | expect(toggleWorks).toBe(true) | ✅ |

---

## 工时汇总

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | BoundedContextTree Checkbox 修复 | 1.5h | P0 |
| **总计** | | **1.5h** | |

---

## Sprint 排期建议

**Sprint 0 (0.5 天)**:
- E1: BoundedContextTree Checkbox 修复（1.5h）

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 删除 selectionCheckbox 影响多选 | 低 | 低 | Ctrl+Click 多选机制保留 |
| toggleContextNode 不存在 | 极低 | 低 | store 中已存在 |

---

## DoD (Definition of Done)

### Epic 1: BoundedContextTree Checkbox 修复
- [ ] 只有 1 个 checkbox
- [ ] checkbox 与标题 `<h4>` 同一行（inline）
- [ ] 无 `position: absolute` checkbox
- [ ] confirmed → 绿色边框
- [ ] pending → 黄色边框
- [ ] 点击 checkbox toggle confirmed/pending

---

## 验收标准汇总（expect() 断言）

| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 渲染 BoundedContextTree | 节点 | 只有 1 个 checkbox |
| AC1.2 | 检查 DOM | checkbox | 无 `position: absolute` |
| AC1.3 | 渲染节点 | confirmed 状态 | 边框绿色 |
| AC1.4 | 渲染节点 | pending 状态 | 边框黄色 |
| AC1.5 | 点击 checkbox | toggle | 状态切换 |
