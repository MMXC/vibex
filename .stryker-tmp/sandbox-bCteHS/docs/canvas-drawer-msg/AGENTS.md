# AGENTS.md: canvas-drawer-msg

## Dev
- 实现 Epic 1-3 的所有组件和 store
- 使用 CSS Modules，不复用 AIChatPanel 样式
- 命令过滤逻辑：严格遵循 D4 约束（点选卡片后只显示 /update-card）
- 确保 D6 约束：命令执行只用 console.log，不调用 API

## Tester
- E2E 测试覆盖：打开抽屉、执行命令、节点过滤
- 写 MessageDrawer 和 CommandInput 的 Jest 测试
- 验证虚拟列表在 ≥200 条消息时的性能

## Reviewer
- 检查 CSS 变量使用符合 DESIGN.md
- 检查 ARIA label 完整性（键盘可聚焦）
- 检查命令过滤逻辑是否符合 PRD D4 约束
- 检查不引入 AIChatPanel 的样式依赖
