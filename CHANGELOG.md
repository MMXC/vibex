# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Story 1.2 CSS Variables**: 新增完整的设计令牌系统
  - 颜色变量: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted` 等
  - 间距变量: `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`, `--spacing-2xl`
  - 字体变量: `--font-sans`, `--font-size-base` 等
  - 圆角/阴影: `--radius-md`, `--shadow-lg` 等
  - 过渡动画: `--transition-fast`, `--transition-normal`, `--ease-out`, `--ease-in-out`
  - 暗色主题覆盖

### Tests
- 新增 `css-variables.test.ts` 验证 CSS 变量正确定义
- 更新 `colors.test.ts` 测试 Story 1.2 spec 变量
- 所有 token 测试通过

### Dependencies
- N/A

### Refactor
- N/A

---

## [Previous Changes]

See git history for complete changelog.
