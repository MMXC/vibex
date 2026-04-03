# AGENTS.md: vibex-canvas-flow-card-20260328

## Dev 约束
- ❌ 不修改 FlowCard 渲染内容，只改 border 和添加图标
- ✅ emoji 图标仅用于 branch (🔀) / loop (🔁) 类型标识
- data-testid: `flow-card`, `flow-step-icon`

## Tester
- 验证所有 FlowCard 为 dashed border
- 验证 branch 步骤显示 🔀，loop 显示 🔁
