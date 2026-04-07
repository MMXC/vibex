# AGENTS.md: canvas-data-model-unification

## Dev
- Epic 1: 逐个迁移 confirmationStore 引用方，每步验证 build 通过
- Epic 3-4: middleware 使用 zustand subscribeWithSelector，防止循环触发

## Tester
- Middleware 行为回归测试（无无限循环）
- useCanvasSession hook 单元测试（10 个用例）
- gstack screenshot 验证 UI

## Reviewer
- 检查 confirmationStore 是否完全移除重复类型
- 检查 middleware 是否有循环触发风险
- 检查 migration 是否处理所有旧格式
