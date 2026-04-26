# S14-E3 Spec: E2E 测试覆盖增强

## Epic 概述

为 CodeGen 和 AI Agent 功能路径编写完整的 E2E 测试，防止 regression。覆盖关键用户路径：创建 session → 发送消息 → 接收回复 → 保存到节点 → CodeGen 串联 → Send to AI Agent。

## 用户故事

### US-E3.1: AI Agent Session 完整流程 E2E
**作为**开发者，**我希望**运行 E2E 测试覆盖 AI Agent session 完整生命周期，**这样**每次改动都能快速验证核心功能未损坏。

**验收标准**:
- `pnpm exec playwright test --grep "agent-session"` → 0 failures
- 测试覆盖：创建 session → 发送消息 → 接收回复 → 保存到节点 → 关闭 session
- 每步都有 `expect` 断言，不是纯 happy path

### US-E3.2: CodeGen Pipeline E2E
**作为**开发者，**我希望**运行 E2E 测试覆盖 CodeGen → Send to AI Agent 全链路，**这样**Design-to-Code Pipeline 功能有 regression 保护。

**验收标准**:
- `pnpm exec playwright test --grep "codegen-pipeline"` → 0 failures
- 测试覆盖：选择 Canvas 节点 → CodeGenPanel 生成 → 预览 → Send to AI Agent → 验证 AI Agent 收到 context
- 所有交互元素有 `data-testid` 定位

### US-E3.3: Design Review 全链路 E2E
**作为**开发者，**我希望**运行 E2E 测试覆盖 Design Review 页面完整路径，**这样**设计稿查看与评论功能有 regression 保护。

**验收标准**:
- `pnpm exec playwright test --grep "design-review-e2e"` → 0 failures
- 测试覆盖：打开设计稿 → 切换 chapter → 添加评论 → 提交 → 验证评论显示

## 技术规格

### 测试文件组织
```
tests/
├── e2e/
│   ├── agent-session.spec.ts    # AI Agent session 生命周期
│   ├── codegen-pipeline.spec.ts # CodeGen → AI Agent 串联
│   └── design-review-e2e.spec.ts # Design Review 全流程
```

### Mock 策略
- MockAgentService 已存在，使用标准 mock
- Mock 范围需在测试文件顶部注释说明

## Definition of Done

- [ ] `tests/e2e/agent-session.spec.ts` 通过，无 failure
- [ ] `tests/e2e/codegen-pipeline.spec.ts` 通过，无 failure
- [ ] `tests/e2e/design-review-e2e.spec.ts` 通过，无 failure
- [ ] 每个 spec 文件至少有 3 个 test case（非单 smoke test）
- [ ] Mock 范围在文件顶部注释说明
- [ ] 所有 data-testid 在对应组件代码中存在
