# Epic1-数据层 实现方案

## 背景
根据 CardTree 设计规范，实现 API Hook (useProjectTree) + CardTreeNode + CardTreeRenderer。

## 现有代码分析
- `visualizationStore` ✅ 已就绪
- `flow-data.ts` 后端路由 ✅ 已存在
- ReactFlow ✅ 已集成
- `useFlowVisualizationWithStore` ⚠️ 需要修改为支持 CardTree

## 方案设计

### T1.1: CardTree 数据格式 + 类型
- 在 `types/visualization.ts` 添加 `CardTreeNodeData` 接口
- 定义 `CardTreeNode` = card title + checkbox children
- 定义 `CardTreeData` = 多个 CardTreeNode + ReactFlow edges

### T1.2: CardTreeNode ReactFlow 自定义节点
- `src/components/visualization/CardTreeNode/index.tsx`
- 渲染：圆角卡片 + checkbox 树 + 展开/收起
- 交互：checkbox 点击 → 触发功能、拖拽调整位置

### T1.3: CardTreeRenderer 组件
- `src/components/visualization/CardTreeRenderer/index.tsx`
- 使用 ReactFlow 渲染 CardTreeNode
- 垂直自动布局

### T1.4: useProjectTree Hook (API Hook)
- `src/hooks/useProjectTree.ts`
- React Query 获取 flow-data
- Mock 数据降级
- Feature Flag 控制

### T1.5: 集成 visualizationStore
- CardTreeRenderer 使用 visualizationStore
- selectedNodeId、options 同步

## 验收标准
- [x] CardTreeNode 自定义节点渲染 (12 tests pass)
- [x] React Query hook 带 mock 降级 (useProjectTree.ts)
- [x] Feature Flag 控制 (NEXT_PUBLIC_USE_CARD_TREE)
- [x] npm test 通过 (16 tests: CardTreeNode 12 + useProjectTree 4)
- [x] 代码 commit (f48f6653)
