# Epic3-首页集成 实现方案

## 背景
完成首页 CardTree 集成，确保 Feature Flag 控制和旧布局回退正常工作。

## Epic1-2 产出物
- CardTreeNode ✅
- CardTreeRenderer ✅
- CardTreeView ✅
- PreviewArea 集成 ✅
- Feature Flag 控制 ✅

## Epic2 产出物分析
Epic2 已经完成了大部分工作。需要验证以下功能是否完整：

### P3.1: Feature Flag 配置 ✅
- `NEXT_PUBLIC_USE_CARD_TREE` 环境变量
- `IS_CARD_TREE_ENABLED` 导出

### P3.2: 首页条件渲染 ✅
- PreviewArea 中 CardTreeView 和 MermaidPreview 条件渲染
- Feature Flag 控制开关

### P3.3: 保留旧 GridLayout ✅
- MermaidPreview 作为 fallback
- GridLayout 保留（通过 MermaidPreview）

### P3.4: 首页加载顺序
- 骨架屏 (CardTreeSkeleton) → 数据加载
- 需要验证 useProjectTree 的 loading 状态正确传递

## 实施步骤

1. **验证 Feature Flag 导出** — 确认 IS_CARD_TREE_ENABLED 可被 PreviewArea 访问
2. **验证条件渲染** — 确认 useCardTree prop 正确传递
3. **验证加载状态** — 确认 CardTreeSkeleton 在加载时显示
4. **添加测试** — 确保 Feature Flag 切换测试覆盖

## 验收标准
- [ ] Feature Flag IS_CARD_TREE_ENABLED 正确导出
- [ ] useCardTree prop 可通过环境变量控制
- [ ] 加载状态显示 CardTreeSkeleton
- [ ] 旧布局保留（MermaidPreview fallback）
- [ ] npm test 通过
- [ ] 代码 commit
