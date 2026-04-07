# ADR-XXX: VibeX 限界上下文树连线渲染异常 — 架构设计

**状态**: Accepted
**日期**: 2026-03-30
**角色**: Architect
**项目**: vibex-bounded-edge-rendering

---

## Context

> ⚠️ **同根因声明**: 本项目与 `vibex-bc-canvas-edge-render` 为**同一根因**，修复方案完全相同。

**问题描述**：3个 context 卡片的所有 edges 全部汇聚在垂直单线上，体现不出任何关系。

**根因**：`boundedContextTree` 使用 `flex-direction: column` 垂直布局 → `bestAnchor()` 始终选择 `bottom→top` → 所有连线在相同 x 位置汇聚。

---

## Decision

### 与 vibex-bc-canvas-edge-render 的关系

| 项目 | 状态 |
|------|------|
| `vibex-bc-canvas-edge-render` | 架构设计已完成 ✅ |
| `vibex-bounded-edge-rendering` | **同根因，共享修复方案** |

### 推荐决策

建议 Coord 将本项目与 `vibex-bc-canvas-edge-render` **合并为单一开发任务**，避免 Dev 重复实现相同的修复。

---

## 技术方案

> 详细方案见 `vibex-bc-canvas-edge-render/architecture.md`

### 核心修复

1. **Epic 1**: `bestAnchor()` 算法加固（`edgePath.ts`）
2. **Epic 2**: CSS `flex-direction: column` → `row`（`canvas.module.css`）
3. **Epic 3**: 连线渲染优化（`BoundedEdgeLayer.tsx`）

---

## 验收标准

- [ ] 3 个 BC 卡片水平展开，连线不重叠成单条线
- [ ] gstack screenshot 验证：连线清晰可辨
- [ ] 与 vibex-bc-canvas-edge-render 合并修复

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-bc-canvas-edge-render（合并执行）
- **执行日期**: 2026-03-30
