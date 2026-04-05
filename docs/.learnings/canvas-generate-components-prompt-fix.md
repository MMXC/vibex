# learnings: canvas-generate-components-prompt-fix

## 项目信息
- **名称**: canvas-generate-components-prompt-fix
- **目标**: 修复 generate-components AI prompt 导致 flowId=unknown、type=navigation 问题
- **完成时间**: 2026-04-05
- **结果**: ✅ 已完成

## 根因
1. prompt 里写 `flowId: "对应流程ID"`，但 flows 输入没有 id 字段 → AI 输出 literal "unknown"
2. prompt 没有禁止 `navigation/card/button` 等非法类型 → AI 输出了 `navigation`
3. contextSummary 没有包含 ctx.id → AI 无法正确关联上下文

## 关键修复
- flowId: 改用 `[flow-1]`, `[flow-2]` 编号格式，AI 可推断
- contextSummary: 加 `[{c.id}] {c.name}: {c.description}` 格式
- type 白名单: 明确禁止 navigation/card/button/header，仅允许 page/form/list/detail/modal
- 加上真实 API path 示例，引导 AI 输出合理接口

## 经验
- AI prompt 的格式示例必须与输入数据格式完全匹配
- 枚举类型必须明确白名单，不能只说"组件类型"而不列范围
- context id 和 flow id 都要显式传递给 prompt

## Epic 统计
| Epic | Commit | Changelog | 合并 |
|------|--------|-----------|------|
| E1 flowId修复 | `26c383f7` | ✅ | ✅ |
| E2 generateFlows修复 | `250ecb47` | ✅ | ✅ |
