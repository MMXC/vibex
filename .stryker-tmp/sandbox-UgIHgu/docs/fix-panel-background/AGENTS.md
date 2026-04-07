# AGENTS.md: fix-panel-background

## Dev
- 修改 design-tokens.css 中的 3 个 CSS 变量
- 修改 auth 页面内联样式中的 input 背景色
- 使用 gstack screenshot 验证修复前后对比

## Tester
- Playwright 测试覆盖：对比度计算 ≥ 2:1
- gstack screenshot 截图保存到 `.gstack/qa-reports/`
- 验证亮色模式（homepage）不受影响

## Reviewer
- 检查 CSS 变量修改不影响亮色模式（`data-theme="light"` 变量独立）
- 检查 canvas 三栏面板对比度
- 检查 dashboard 无视觉回归
