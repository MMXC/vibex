# Epic2-卡片树布局 实现方案

## 背景
将 Epic1 实现的 CardTreeNode/CardTreeRenderer 集成到首页 PreviewArea，支持 Feature Flag 切换。

## Epic1 产出物分析
- `CardTreeNode` ✅ 已实现 (src/components/visualization/CardTreeNode/)
- `CardTreeRenderer` ✅ 已实现 (src/components/visualization/CardTreeRenderer/)
- `useProjectTree` ✅ 已实现 (src/hooks/useProjectTree.ts)
- `visualizationStore` ✅ 已同步

## 方案设计

### T2.1: 创建 CardTreeView 组件（集成层）
- `src/components/homepage/CardTree/CardTreeView.tsx` — 整合 useProjectTree + CardTreeRenderer
- 使用 useProjectTree 获取数据
- 处理展开/折叠状态

### T2.2: PreviewArea 集成
- 添加 `useCardTreeView` prop 或内部 Feature Flag 检测
- 当 `NEXT_PUBLIC_USE_CARD_TREE=true` 时显示 CardTreeView
- 否则显示原有 MermaidPreview

### T2.3: Feature Flag 切换
- 环境变量 `NEXT_PUBLIC_USE_CARD_TREE`
- 运行时切换支持

### T2.4: 布局优化
- 确保 CardTree 在 PreviewArea 中正确显示
- 处理空状态、加载状态

## 实施步骤

1. **检查现有 CardTreeView** (src/components/homepage/CardTree/CardTreeView.tsx)
2. **修改 PreviewArea** — 添加 CardTree 视图选项
3. **添加 Feature Flag 切换** — NEXT_PUBLIC_USE_CARD_TREE
4. **测试切换** — 验证两种视图都能正常工作

## 验收标准
- [x] Feature Flag off → 显示原有 MermaidPreview
- [x] Feature Flag on → 显示 CardTreeView
- [x] CardTreeView 正确渲染 useProjectTree 数据
- [x] 展开/折叠交互正常
- [x] npm test 通过 (66 tests pass)
- [x] 代码 commit (7322707c)
