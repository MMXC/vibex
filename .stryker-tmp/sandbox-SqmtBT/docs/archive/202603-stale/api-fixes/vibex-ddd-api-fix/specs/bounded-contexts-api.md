# Feature: 限界上下文 API 增强

## Jobs-To-Be-Done
- 作为用户，我希望限界上下文图展示完整的上下文关系（含上下游连线），以便我理解业务领域的协作结构。

## Requirements
- [ ] (F1.1) 更新 AI 提示词，引导生成 relationships 字段（Context Mapping 模式）
- [ ] (F1.2) 更新 JSON Schema，增加 keyResponsibilities 和 relationships 字段定义
- [ ] (F1.3) 更新 Mermaid 生成逻辑，基于 relationships 生成带连线的图

## Acceptance Criteria
- [ ] AC1: API 返回的 boundedContexts 包含 relationships 数组（平均 ≥2 条关系）
- [ ] AC2: Mermaid 图包含节点之间的边（-->），非孤立节点
- [ ] AC3: 每个上下文有 keyResponsibilities 字段（3-5 项）
