# AGENTS.md: VibeX BC 树连线渲染 — Agent 协作指南

> **项目**: vibex-bc-canvas-edge-render
> **日期**: 2026-03-30

---

## 角色与职责

| Agent | 职责 | 产出物 |
|-------|------|--------|
| **Analyst** | 问题根因分析 | analysis.md ✅ |
| **PM** | PRD 细化 | prd.md ✅ |
| **Architect** | 架构设计 + 实现计划 | architecture.md ✅, IMPLEMENTATION_PLAN.md ✅ |
| **Dev** | Epic 1-3 实施 | PR + 代码变更 |
| **Tester** | E2E 测试 | gstack 截图 + 测试报告 |
| **Reviewer** | 代码审查 | review 报告 |

---

## 开发流程

### Phase 1: Epic 1 — 锚点算法修复 (Dev)

1. 阅读 `edgePath.ts`，理解 `bestAnchor()` 和 `computeEdgePath()`
2. 创建 `edgePath.test.ts`，编写 9 种 dx/dy 组合测试
3. 根据测试修复 `bestAnchor()` 阈值
4. 优化 `computeEdgePath()` 控制点偏移
5. 确保覆盖率 ≥ 90%

### Phase 2: Epic 2 — CSS 布局改造 (Dev)

1. 修改 `canvas.module.css` — `flex-direction: column` → `row`
2. 验证 `nodeRects` DOM 查询时机
3. gstack screenshot 验证水平布局
4. 全量交互回归测试

### Phase 3: Epic 3 — 连线渲染优化 (Dev, P1)

1. 分析当前连线渲染效果
2. 实现控制点动态偏移
3. 添加 hover 高亮和 tooltip
4. gstack 验证视觉效果

---

## 关键文件

| 文件 | 作用 | 修改者 |
|------|------|--------|
| `edgePath.ts` | 锚点选择 + 路径计算 | Dev |
| `canvas.module.css` | CSS 布局 | Dev |
| `BoundedContextTree.tsx` | 组件 + nodeRects | Dev |
| `BoundedEdgeLayer.tsx` | 连线渲染 | Dev (回归) |

---

## 协作约定

- **Epic 1 完成后** → 通知 Tester 进行截图验证（水平布局）
- **Epic 2 完成后** → 全量 E2E 回归测试
- **PR 创建后** → Reviewer 代码审查
- **所有 Epic 完成后** → Coord 决策是否合并 vibex-bounded-edge-rendering
