# Changelog

All notable changes to this project will be documented in this file.

## [Epic3 Fix] - 2026-03-22

### Fixed
- **ThemeWrapper timing bug**: useRef/useEffect 检测异步 homepageData 到达并重新计算 merge 策略
- **ThemeContext**: 异步数据到达时重新计算 mode 而非使用 stale initialState

## [Unreleased]

### Fixed
- **Jest 配置**: 补充 jest.config.ts + mock 文件，明确 testPathIgnorePatterns 排除 e2e/performance 目录，防止 Playwright 测试被 Jest 误执行

### Added (Epic 1 - 布局框架)
- **三栏布局**: Sidebar (15%) + PreviewArea (60%) + InputArea (25%) 实现
- **CSS 变量系统**: tokens.css 完整定义 (颜色/间距/阴影/圆角/z-index)
- **背景特效**: Grid overlay + Cyan/Purple Glow orb 动态效果
- **响应式断点**: 1200px (max-width: 1440px) / 900px (padding: 0 24px)
- **暗色主题**: 完整暗色变量覆盖

### Added (Epic 2 - Header 导航)
- **Navbar 组件**: 顶部导航 (Logo + 导航链接 + CTA 按钮)
- **Logo**: VibeX 文字 + ◈ 图标
- **导航链接**: 模板页 /templates 链接
- **登录状态**: 未登录显示"开始使用"，已登录显示"我的项目"
- **响应式**: 768px 断点隐藏导航链接

### Added (Epic 3 - 左侧抽屉)
- **Sidebar 组件**: 5 步流程导航 (需求澄清 → 限界上下文 → 领域模型 → 业务流程 → UI生成)
- **StepNavigator**: 步骤指示器 + 点击切换
- **进度统计**: 实时步骤进度条
- **状态同步**: 默认/激活/完成三种样式

### Added (Epic 4 - 预览区)
- **PreviewArea 组件**: 图表预览区 (空/加载/Mermaid/交互/导出)
- **PreviewCanvas**: SVG 画布渲染
- **NodeTreeSelector**: 节点树选择器
- **图表导出**: PNG / SVG / 源码复制
- **错误处理**: Mermaid 语法错误 / 初始化失败 / 渲染失败降级

### Added (Epic 5 - 右侧抽屉)
- **右侧配置面板**: 思考列表、新增动画、详情展开

### Added (Epic 6 - 底部面板)
- **底部结果面板**: 设计产物展示、导出、对比

### Added (Epic 7 - 快捷功能)
- **快捷操作**: 常用操作快捷入口

### Added (Epic 8 - AI 展示区)
- **AI 对话面板**: AI 生成结果实时展示

### Added (Epic 9 - 悬浮模式)
- **悬浮 UI**: 画布悬浮工具条

### Added (Epic 10 - 状态管理)
- **Zustand Store**: 设计状态管理、localStorage 持久化
- **状态快照**: 切换前保存，支持回退
- **SSE 连接**: 服务端推送支持

### Added
- **agent-self-evolution-20260321**: 每日自检提案收集
  - 6 个 agent 提案: dev, analyst, architect, pm, tester, reviewer
  - PRD 和架构文档已创建
  - 提案存储在 proposals/20260321/

### Added (Story 1.2 CSS Variables) 新增完整的设计令牌系统
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
