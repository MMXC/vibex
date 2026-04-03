# Spec: Epic 3 - Design 步骤合并

## Jobs-To-Be-Done

- **JTBD 1**: 作为用户，我希望在 Homepage 也能使用 Design 流程中的澄清和 UI 生成功能，不需要切换到 `/design` 入口。
- **JTBD 2**: 作为开发者，我希望 Design 的独特功能可以逐步合并到 Homepage，降低维护成本。

## User Stories

- US3.1: 作为用户，我在 Homepage 完成领域模型后，可以立即进入需求澄清流程。
- US3.2: 作为用户，我在 Homepage 完成业务流程后，可以直接生成 UI 原型。
- US3.3: 作为维护者，我希望状态管理统一，不需要在多个 Store 之间同步。

## Requirements

### F3.1: Clarification 步骤迁移
- [ ] 将 `/design/clarification` 功能合并到 Homepage Step 2.5（限界上下文和领域模型之间）
- [ ] 保留原有澄清逻辑（AI 追问、用户补充）
- [ ] 状态存储使用 confirmationStore
- [ ] 组件放置在 `src/components/homepage/steps/StepClarification.tsx`

### F3.2: UI Generation 步骤集成
- [ ] 将 `/design/ui-generation` 作为 Homepage 最后一个可选步骤（Step 6）
- [ ] 保留原有 UI 生成逻辑（AI 生成、用户编辑）
- [ ] 组件放置在 `src/components/homepage/steps/StepUIGeneration.tsx`
- [ ] 仅在用户主动触发时显示（不是默认步骤）

### F3.3: 状态管理统一
- [ ] 确认 `confirmationStore` 可以存储 Clarification 和 UI Generation 所需的状态
- [ ] 如需扩展 Store，新增字段并更新 TypeScript 类型
- [ ] 迁移后 Design 页面使用相同 Store（共享状态）

### F3.4: 迁移后 E2E 测试
- [ ] 完整 Homepage 流程（包含新增步骤）E2E 测试通过
- [ ] Design 页面与 Homepage 状态同步测试通过
- [ ] 无功能退化（migration regression）

## Technical Notes

### 迁移组件结构
```
src/components/homepage/steps/
├── StepClarification.tsx    ← 从 /design/clarification 迁移
├── StepUIGeneration.tsx    ← 从 /design/ui-generation 迁移
```

### 状态扩展（confirmationStore）
```typescript
interface ConfirmationState {
  // 现有字段...
  clarification?: ClarificationSession;
  uiGeneration?: UIGenerationSession;
}
```

### Design 页面兼容模式
```typescript
// /design/* 页面保持读取 confirmationStore
// 迁移完成后，Design 页面变成只读视图
// 真正的编辑在 Homepage 完成
```

## Acceptance Criteria

- [ ] `expect(screen.getByText(/clarification/i)).toBeInTheDocument()` — Clarification 步骤在 Homepage 可用 【需页面集成】
- [ ] `expect(screen.getByRole('button', {name: /generate ui/i})).toBeInTheDocument()` — UI Generation 在 Homepage 可用 【需页面集成】
- [ ] `expect(Object.keys(store.getState())).toContain('clarification')` — Store 包含澄清状态
- [ ] `expect(Object.keys(store.getState())).toContain('uiGeneration')` — Store 包含 UI 生成状态
- [ ] E2E 完整流程测试通过 — 包含新增步骤

## Definition of Done

| 维度 | 标准 |
|------|------|
| 功能 | Clarification 和 UI Generation 在 Homepage 完整可用 |
| 测试 | E2E 测试 100% 通过，状态同步验证通过 |
| 安全 | UI Generation 输出经过 XSS 过滤 |
| 性能 | 新增步骤不影响页面加载性能 |
| 兼容性 | Design 页面与 Homepage 状态一致 |
