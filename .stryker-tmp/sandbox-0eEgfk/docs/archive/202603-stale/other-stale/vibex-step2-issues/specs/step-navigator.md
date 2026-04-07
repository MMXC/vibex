# Feature: 步骤指示器与导航

## Jobs-To-Be-Done
- 作为用户，我希望在设计流程中看到清晰的步骤指示器，以便我知道当前在哪一步、总共还有几步、可以跳转到哪一步。

## User Stories
- US1: 作为用户，我希望在每个设计页面顶部看到5步导航条，当前步骤高亮显示
- US2: 作为用户，我希望能点击已完成的步骤快速回退，而不必逐页返回
- US3: 作为用户，我希望未完成的步骤显示为 disabled，避免误操作

## Requirements
- [ ] (F1.1) 每个 `/design/*` 页面顶部集成 `StepNavigator` 组件
- [ ] (F1.2) `StepNavigator` 从 `designStore.currentStep` 读取当前步骤
- [ ] (F1.3) 点击已完成的步骤（index < currentStep）触发 `router.push` 跳转
- [ ] (F1.4) 点击未完成或当前步骤（index >= currentStep）无操作（disabled）
- [ ] (F1.5) 设计页面复用首页 ProgressIndicator 样式，统一视觉体验

## Technical Notes
- 5个设计页面: clarification, bounded-context, domain-model, business-flow, ui-generation
- StepNavigator 组件路径: `@/components/ui/ProgressIndicator` 或 `@/components/ui/StepNavigator`
- designStore 路径: `src/stores/designStore.ts`
- 路由前缀: `/design/clarification` 等

## Acceptance Criteria
- [ ] AC1: 访问 `/design/bounded-context`，StepNavigator 显示 Step 2 of 5 高亮
- [ ] AC2: 点击 Step 1（clarification），路由跳转到 `/design/clarification`
- [ ] AC3: Step 3-5 显示为 disabled（不可点击）
- [ ] AC4: expect(screen.queryByRole('button', {name: /step 3/i})).toBeDisabled()
