# AGENTS.md: VibeX 三树增强开发约束

**项目**: vibex-three-trees-enhancement-20260326
**版本**: 1.0
**日期**: 2026-03-26

---

## 1. ADR 决策清单

- [ADR-001] ✅ ReactFlow 扩展（不做 BPMN.js 迁移）
- [ADR-002] ✅ 前端推算领域关系（后端 API 作为扩展）
- [ADR-003] ✅ 自定义节点/边通过 nodeTypes/edgeTypes 注册（不修改 ReactFlow 源码）

---

## 2. 代码规范

### 2.1 ReactFlow 自定义节点规范
- 所有自定义节点放在 `src/components/canvas/nodes/` 目录
- 必须 `memo()` 包裹，防止不必要的重渲染
- 必须包含 Handle（否则边无法连接）

### 2.2 ReactFlow 自定义边规范
- 所有自定义边放在 `src/components/canvas/edges/` 目录
- 使用 `getBezierPath` 计算路径
- 必须支持 `markerEnd` 属性

### 2.3 组件树交互规范
- 展开/折叠状态用 `expandedIds: Set<string>` 管理
- 点击跳转使用 `window.open(filePath)` 或编辑器 deep link
- hover 效果用 CSS class 切换，不直接操作 DOM

---

## 3. 禁止事项

- ❌ 修改 `nodeTypes`/`edgeTypes` 以外的方式注入自定义节点
- ❌ 在自定义节点内直接调用 API（统一走 canvasStore）
- ❌ 硬编码节点位置（使用 ReactFlow 自动布局）
- ❌ 删除或修改现有 `CardTreeRenderer.tsx` 的默认节点类型

---

## 4. data-testid 规范

| testid | 元素 |
|--------|------|
| `context-tree-tab` | 上下文树 Tab |
| `flow-tree-tab` | 流程树 Tab |
| `component-tree-tab` | 组件树 Tab |
| `context-node-{id}` | 上下文节点 |
| `flow-node-{id}` | 流程节点 |
| `gateway-node-{id}` | 网关节点 |
| `component-node-{id}` | 组件节点 |
| `expand-toggle-{id}` | 展开/折叠按钮 |

---

## 5. gstack 验证要求

每个 PR 必须包含：
1. PR #1: 上下文树连线截图（有箭头连线）
2. PR #2: 流程树网关截图（有菱形节点 + 条件标签）
3. PR #3: 组件树交互截图（展开后显示子节点）
4. PR #4: Epic 4 全回归截图（V4-V5 交互测试）

---

*AGENTS.md 完成时间: 2026-03-26 02:54 UTC+8*
