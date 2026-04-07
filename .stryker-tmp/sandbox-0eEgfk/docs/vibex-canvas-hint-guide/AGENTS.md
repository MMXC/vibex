# AGENTS.md: vibex-canvas-hint-guide

## Dev
- 实现 4 个 Epic 的组件开发和单元测试
- 使用 CSS Modules，不引入新依赖
- 确保新组件有 aria-label 支持无障碍

## Tester
- 编写 Playwright E2E 测试（? 键、tooltip hover）
- 运行 axe-core 可访问性检查
- gstack screenshot 验证 UI 效果

## Reviewer
- 检查 CSS 变量使用是否符合 DESIGN.md
- 检查 aria-label 完整性
- 检查新组件是否影响现有功能
