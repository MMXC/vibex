# IMPLEMENTATION_PLAN: vibex-canvas-hint-guide

## 依赖
无上游依赖，可直接开始。

## 开发顺序
Epic 1 → Epic 2, 3, 4 可并行

## 实施步骤

### Epic 1: ComponentTree 空状态引导
1. 读取 ComponentTree.tsx line 1024-1027
2. 修改 emptySubtext 文案
3. 添加对应 CSS 样式
4. 写 ComponentTree guidance test

### Epic 2: 快捷键帮助面板
1. 新增 HelpPanel.tsx 组件
2. 新增 HelpPanel.module.css
3. 在 CanvasPage.tsx 添加 ? 键监听
4. 写 HelpPanel unit tests
5. Playwright E2E 验证 ? 键打开面板

### Epic 3: FlowLegend 连线图例
1. 新增 FlowLegend.tsx（SVG 三种连线样式）
2. 新增 FlowLegend.module.css
3. 在 BusinessFlowTree 或 CanvasPage 引入
4. 写 FlowLegend unit tests

### Epic 4: 节点标记 Tooltip
1. 读取 BusinessFlowTree.tsx SVG marker definitions
2. 添加 <title> 元素到 start/end markers
3. 写 tooltip E2E 测试

## 验收
npm test + Playwright E2E 通过。
