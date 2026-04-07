# AGENTS.md: vibex-contract-testing

## Architect
- 定义 Zod schemas，确保关键字段（confirmed）明确
- 设计中间件 API，保证可扩展

## Dev
- 实现 validate.ts 中间件
- 修改 flows.ts / components.ts 集成校验
- 修改 canvasApi.ts 添加 response 校验

## Tester
- 编写 MSW 契约测试
- 验证 CI blocking 机制
- 验证 400 错误格式正确

## Reviewer
- 检查 schema 定义是否完整（无遗漏字段）
- 检查 Zod 校验是否足够严格（不允许 undefined 当 false）
- 检查 CI 配置正确性
