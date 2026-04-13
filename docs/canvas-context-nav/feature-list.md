# Feature List: vibex-canvas-context-nav

> Planning Output — Phase1 Step 2 (create-prd)
> Based on: docs/canvas-context-nav/analysis.md
> Date: 2026-04-13

## Problem Frame

Users in `phase === 'prototype'` cannot navigate back to the prototype view once they switch to context/flow/component tabs. The TabBar lacks a prototype tab, and the PhaseIndicator is hidden during prototype phase.

## Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F1.1 | TabBar prototype tab | TabBar 增加第4个 Tab (prototype)，点击切换 phase | TabBar 无 prototype tab | 1h |
| F1.2 | Phase 切换逻辑 | prototype tab 点击调用 setPhase('prototype')，无 phase guard | setPhase 存在但 UI 未暴露 | 0.5h |
| F1.3 | 状态保留验证 | 切换 phase 不触发 Zustand store 重置 | 需要验证 store 状态不丢失 | 0.5h |
| F2.1 | PhaseIndicator prototype 选项 | PhaseIndicator 下拉菜单增加 prototype 选项 | PhaseIndicator 隐藏 prototype 相 | 0.5h |
| F2.2 | PhaseIndicator 返回按钮 | 非 prototype phase 显示"返回原型队列"按钮 | 无返回原型路径 | 0.5h |
| F3.1 | TabBar 单元测试 | prototype tab 渲染/交互/phase 切换测试 | 测试覆盖缺失 | 1h |
| F3.2 | E2E 覆盖 | 生成原型 → 切换 context → 返回 prototype 路径 | E2E 场景缺失 | 1h |

## Epic 划分

**Epic 1**: TabBar prototype tab（主路径，用户最常用）
**Epic 2**: PhaseIndicator 原型返回（辅助路径，PhaseIndicator 下拉）
**Epic 3**: 测试覆盖（保证质量）

## 方案决策

- **推荐方案**: Option A + Option B 双路返回（TabBar prototype tab + PhaseIndicator prototype 选项）
- **方案理由**: 用户从 TabBar 切换是最自然路径；PhaseIndicator 下拉作为辅助路径；两条路都能返回 prototype phase
- **技术实现**: 纯 UI 改动，不涉及 store 重构；setPhase 已存在于 contextStore
