# Feature: Mermaid 统一初始化管理器

## Jobs-To-Be-Done
- 作为用户，我希望点击分析后图表能稳定渲染，以便我能在 2 秒内看到 DDD 分析结果的可视化展示。

## User Stories
- US1: 作为用户，我希望 Mermaid 图表在首页点击分析后立即渲染，以便我无需等待或刷新页面
- US2: 作为开发者，我希望使用统一的 Mermaid 初始化管理器，避免两套组件竞争导致的渲染失败

## Requirements
- [ ] (F1.1) 创建 MermaidManager 单例类，统一管理 mermaid 初始化和渲染
- [ ] (F1.2) MermaidManager 在应用启动时静默预初始化（layout.tsx useEffect）
- [ ] (F1.3) MermaidManager 确保初始化完成后才执行 render()，避免时序竞争
- [ ] (F1.4) MermaidManager 配置统一：theme='dark', securityLevel='loose'（覆盖旧 strict）
- [ ] (F1.5) MermaidManager 提供 `initialize()` 和 `render(code)` 两个公开方法

## Technical Notes
- 使用类单例模式：`MermaidManager.getInstance()`
- `initialize()` 返回 Promise，支持并发调用（只初始化一次）
- 移入 `@/lib/mermaid/MermaidManager.ts`
- 版本锁定 mermaid@11.13.0，需监控 API 变更

## Acceptance Criteria
- [ ] AC1: expect(await mermaidManager.render('graph TD; A-->B')).resolves.toContain('<svg')
- [ ] AC2: expect(mermaidManager.render('invalid')).rejects.toThrow() — 错误可被捕获
- [ ] AC3: expect(layout useEffect 中调用 initialize() 不抛出错误
- [ ] AC4: 多次调用 initialize() 只执行一次初始化逻辑（检查 initialized 标志）
