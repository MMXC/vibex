# Epic2-FlowRenderer 实现方案

## 背景
Epic2 = Sprint 1 Day 3：ReactFlow 集成（基于 Epic1 的类型系统和 Store）

## 方案设计

### T1.8: FlowRenderer 组件
- 新建 `src/components/visualization/FlowRenderer.tsx`
- 封装 `FlowEditor` 组件，连接 `visualizationStore`
- 支持 zoom/pan/minimap 从 store 读取

### T1.9: useFlowVisualization Hook
- 新建 `src/hooks/useFlowVisualization.ts`
- 提供 nodes/edges 状态管理
- 解析 FlowVisualizationRaw → ReactFlow 格式

### T1.10: 节点/边渲染 + 缩放/拖拽
- FlowEditor 已支持，通过 FlowRenderer 暴露

### T1.11: 状态同步到 store
- FlowRenderer 将 selected node 同步到 `visualizationStore.options.selectedNodeId`

## 实施步骤
1. 创建 `useFlowVisualization` hook
2. 创建 `FlowRenderer` 组件
3. 添加测试
4. 验证 TypeScript + tests
5. Commit
