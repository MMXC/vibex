---
title: Sprint4-QA 详设画布——多BLOCKER分类与Spec偏差归档
date: 2026-04-18
category: docs/solutions/best-practices
module: vibex
problem_type: best_practice
component: frontend_stimulus
severity: medium
applies_when:
  - QA sprint validating complex multi-Epic deliverables with spec-implementation mismatches
  - Archiving multi-severity defects (BLOCKER/P0/P1/P2) from canvas component systems
  - CSS token system validation in design system contexts
  - Spec compliance auditing for API endpoint cards and state machine cards
tags:
  - qa-sprint
  - spec-compliance
  - css-tokens
  - defect-archival
  - spec-canvas
  - best-practice
related_components:
  - APIEndpointCard
  - StateMachineCard
  - DDSToolbar
  - exporter
  - ChapterEmptyState
---

# Sprint4-QA 详设画布——多BLOCKER分类与Spec偏差归档

## Context

Sprint4 Spec Canvas Extend 交付了 5 个 Epic（API 章节 + SM 章节 + 跨章节 + 导出 + 四态组件）。QA Sprint 系统性审查发现了 **9 个缺陷**，从 BLOCKER 到 P2 分级归档。核心问题：实现与 Spec 之间存在系统性偏差，CSS Token 系统完全未落地，StateMachineCard 的数据结构与 Spec 期望不符。

---

## Guidance

### 模式 1: CSS Token 系统验证（Spec 合规审计）

```bash
# 检查 Token 定义
grep -E "color-method-|color-sm-" src/styles/tokens.css
# 预期: 每个 Token 至少出现 1 次
# 实际: 0 次（完全缺失）

# 检查组件是否使用硬编码 hex
grep -E "#[0-9a-fA-F]{6}" src/components/dds/cards/APIEndpointCard.tsx
# 预期: 0 次
# 实际: 6 次（METHOD_COLORS 对象）

# 检查 StateMachineCard
grep -E "#[0-9a-fA-F]{6}" src/components/dds/cards/StateMachineCard.tsx
# 预期: 0 次
# 实际: 6 次（STATE_COLORS 对象）
```

### 模式 2: Spec ↔ Implementation 偏差矩阵

每个 Epic 必须建立 Spec 文档与实际代码的对照矩阵：

| 检查项 | Spec 期望 | 实际代码 | 判定 |
|--------|---------|---------|------|
| APIEndpointCard 颜色 | CSS Token | JS 硬编码 hex | ❌ |
| StateMachineCard 结构 | 单节点 stateId/stateType | 容器 states[]/transitions[] | ❌ |
| Exporter 返回类型 | OpenAPISpec 对象 | JSON string | ❌ |
| ChapterEmptyState | 独立组件 + 引导文案 | 文件不存在 | ❌ |

### 模式 3: 多严重性缺陷归档策略

```
defects/
  P0/  ← 阻塞基本功能，阻断 QA 报告
    P0-001-css-token-missing.md
    P0-002-apiendpointcard-hardcode.md
    P0-003-statemachinecard-mismatch.md
    P0-004-exporter-return-type.md
    P0-005-empty-state-components.md
  P1/  ← 影响完整性，有 workaround
    P1-001-sm-export-format.md
  P2/  ← 体验/代码质量
    P2-001-chapter-offset-unequal.md
    P2-002-missing-createform.md
```

---

## Why This Matters

**CSS Token 系统未落地是设计系统的基础设施缺失。** 所有颜色都用 JS 硬编码，当需要主题切换或统一调整时，需要改每个组件。Spec 明确要求用 `var(--color-method-get)` 形式，但实现完全没有遵循。

**StateMachineCard 结构不符合 Spec** 影响更深远：Spec 定义的是单节点卡片（用户从面板拖拽单个状态），实际实现的是整个状态机容器（拖一个放整个机）。这不是 bug，是架构级别的设计分歧。

---

## Prevention

- **Spec 评审必须在代码之前**：在 implementation plan 开始前，对照 Spec 逐条确认字段映射
- **CSS Token 是原子化设计的基础**：任何涉及颜色的需求，必须在 `tokens.css` 中定义 Token，组件中引用 Token
- **Exporter 返回类型必须类型对齐**：TypeScript 接口定义了 OpenAPISpec 但函数返回 string，是典型的类型系统失效
- **空状态组件是基本 UX**：没有引导文案的空状态，用户不知道下一步该做什么

---

## Related

- `vibex-sprint4-spec-canvas-extend-qa/defects/` — 原始缺陷归档文件
- `vibex-sprint4-spec-canvas-extend-qa/qa-final-report.md` — 最终 QA 报告
