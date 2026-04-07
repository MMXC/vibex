# Spec: Epic 2 - Homepage 流程强化

## Jobs-To-Be-Done

- **JTBD 1**: 作为用户，我期望在 Homepage 完成从需求输入到项目创建的全流程，不需要切换到其他入口。
- **JTBD 2**: 作为用户，我期望 Homepage 包含所有原 `/confirm` 和 `/design` 的核心功能。

## User Stories

- US2.1: 作为用户，我在 Homepage 可以输入需求并生成限界上下文。
- US2.2: 作为用户，我在 Homepage 可以查看和编辑限界上下文。
- US2.3: 作为用户，我在 Homepage 可以生成领域模型图。
- US2.4: 作为用户，我在 Homepage 可以生成业务流程图。
- US2.5: 作为用户，我在 Homepage 可以创建项目。

## Requirements

### F2.1: 需求输入步骤（StepRequirementInput）
- [ ] StepRequirementInput 组件完整覆盖原 Requirements 流程
- [ ] 支持文本输入需求
- [ ] 支持需求保存到 confirmationStore
- [ ] 支持需求列表展示（如果有历史需求）

### F2.2: 限界上下文步骤（StepBoundedContext）
- [ ] StepBoundedContext 组件完整覆盖原 Confirm/Design context
- [ ] 支持 Mermaid 图表渲染
- [ ] 支持上下文编辑和保存
- [ ] 支持下一步到领域模型

### F2.3: 领域模型步骤（StepDomainModel）
- [ ] StepDomainModel 组件完整覆盖原 Confirm/Design model
- [ ] 支持 Mermaid 图表渲染
- [ ] 支持领域模型导出
- [ ] 支持上一步到限界上下文

### F2.4: 业务流程步骤（StepBusinessFlow）
- [ ] StepBusinessFlow 组件完整覆盖原 Confirm/Design flow
- [ ] 支持 Mermaid 图表渲染
- [ ] 支持流程编辑
- [ ] 支持下一步到项目创建

### F2.5: Clarification 步骤评估
- [ ] 评估 `/design/clarification` 的独特功能价值
- [ ] 评估是否值得迁移到 Homepage
- [ ] 输出评估报告（specs/clarification-assessment.md）

### F2.6: UI Generation 步骤评估
- [ ] 评估 `/design/ui-generation` 的独特功能价值
- [ ] 评估是否值得迁移到 Homepage
- [ ] 输出评估报告（specs/ui-generation-assessment.md）

## Technical Notes

### Homepage 步骤流程
```
Step 1: StepRequirementInput    ← 原 /requirements/*
Step 2: StepBoundedContext      ← 原 /confirm/context + /design/bounded-context
Step 3: StepDomainModel         ← 原 /confirm/model + /design/domain-model
Step 4: StepBusinessFlow        ← 原 /confirm/flow + /design/business-flow
Step 5: StepProjectCreate       ← 原 /confirm/success
```

### 组件复用策略
```typescript
// 原 Design/Confirm 组件 → Homepage 组件
// 优先复用 Homepage 现有组件
// 如需复用 Design/Confirm 组件，评估后迁移到 components/homepage/steps/
```

## Acceptance Criteria

- [ ] `expect(screen.getByRole('textbox', {name: /requirement/i})).toBeInTheDocument()` — 需求输入可用 【需页面集成】
- [ ] `expect(screen.getByRole('button', {name: /generate context/i})).toBeInTheDocument()` — 限界上下文生成可用 【需页面集成】
- [ ] `expect(screen.getByRole('button', {name: /generate model/i})).toBeInTheDocument()` — 领域模型生成可用 【需页面集成】
- [ ] `expect(screen.getByRole('button', {name: /generate flow/i})).toBeInTheDocument()` — 业务流程生成可用 【需页面集成】
- [ ] `expect(screen.getByRole('button', {name: /create project/i})).toBeInTheDocument()` — 项目创建可用 【需页面集成】

## Definition of Done

| 维度 | 标准 |
|------|------|
| 功能 | 所有 5 个步骤在 Homepage 可用且可正常流转 |
| 测试 | 每步骤有单元测试，E2E 流程测试通过 |
| 安全 | 状态存储安全，无 XSS 风险 |
| 性能 | 页面加载时间 < 3s |
| 页面集成 | 所有涉及 UI 的功能标注【需页面集成】 |
