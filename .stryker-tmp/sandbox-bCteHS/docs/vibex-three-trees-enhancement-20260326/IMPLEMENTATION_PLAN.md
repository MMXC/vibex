# Implementation Plan: VibeX 三树增强

**项目**: vibex-three-trees-enhancement-20260326
**版本**: 1.0
**日期**: 2026-03-26

---

## 1. PR 批次划分

### PR #1: 上下文树领域关系增强（Epic 1）
**范围**: `src/components/canvas/nodes/RelationshipEdge.tsx` + `CardTreeRenderer.tsx` 改动
**工时**: ~2h
**验证**: gstack 截图

**新增文件**:
- `src/components/canvas/nodes/RelationshipEdge.tsx`
- `src/components/canvas/edges/LoopEdge.tsx`（复用）
- `src/lib/canvas/utils/inferRelationships.ts`

**改动文件**:
- `src/components/visualization/CardTreeRenderer/CardTreeRenderer.tsx`

### PR #2: 流程树分支与循环增强（Epic 2）
**范围**: `GatewayNode.tsx` + `CardTreeRenderer.tsx` 改动
**工时**: ~2h
**验证**: gstack 截图

**新增文件**:
- `src/components/canvas/nodes/GatewayNode.tsx`

### PR #3: 组件树交互能力（Epic 3）
**范围**: `ComponentTreePanel.tsx` + `CardTreeNode.tsx` 改动
**工时**: ~1h
**验证**: gstack 交互测试

### PR #4: 回归测试（Epic 4）
**范围**: Playwright E2E
**工时**: ~1h
**验证**: Playwright CI

---

## 2. 改动量估算

| 文件 | 改动类型 | 估算行数 |
|------|---------|---------|
| `CardTreeRenderer.tsx` | 扩展 nodeTypes/edgeTypes | ~20 行 |
| `ComponentTreePanel.tsx` | 展开/折叠逻辑 | ~30 行 |
| 新建 4 个组件 | 自定义节点/边 | ~150 行 |
| 新建推算规则 | 领域关系 | ~40 行 |

---

## 3. 风险与缓解

| 风险 | 缓解 |
|------|------|
| ReactFlow 自定义节点破坏现有渲染 | PR #1 先做最小改动，gstack 截图验证 |
| 循环边导致布局死循环 | ReactFlow 内置布局（dagre）处理，无死循环 |
| 关系推算规则不准确 | OQ1 确认后如需可切换到后端 API |

---

*实施计划完成时间: 2026-03-26 02:54 UTC+8*
