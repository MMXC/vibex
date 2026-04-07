# AGENTS.md: canvas-drawer-persistent

## Dev
- 实现 Epic 1-6 所有组件和 store 扩展
- flex row 布局改造需确保三列 grid 不受影响
- 拖拽使用 ResizeHandle 组件，统一交互体验
- 右抽屉整合 canvas-drawer-msg 消息列表

## Tester
- E2E 测试覆盖：左抽屉/右抽屉/拖拽
- 验证 flex 布局改造不影响画布渲染
- gstack screenshot 验证左右抽屉展开状态

## Reviewer
- 检查 flex 布局改造是否破坏现有 canvas 三列 grid
- 检查 abortGeneration 与 AbortController 正确集成
- 检查宽度拖拽边界限制（100-400px）
