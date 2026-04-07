# AGENTS.md: vibex-canvas-expand-dir-20260328

## Dev 约束
- ❌ 不删除现有的 leftExpand/rightExpand 逻辑
- ✅ 中间面板独立状态，不影响左右栏
- ✅ 最小宽度 200px 保护

## Tester
- 验证中间面板左右热区均有效
- 验证动画 300ms ease-in-out 无卡顿
