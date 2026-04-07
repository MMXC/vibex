# AGENTS.md: vibex-canvas-import-nav-20260328

## Dev 约束
- ❌ 不使用 VSCode deep link 作为主链路
- ✅ previewUrl 作为主导航
- ✅ 无 previewUrl 时显示 toast，不静默失败
- data-testid: `component-node-clickable`

## Tester
- 验证导入示例后点击节点跳转到预览页
- 验证无 previewUrl 时显示 toast
