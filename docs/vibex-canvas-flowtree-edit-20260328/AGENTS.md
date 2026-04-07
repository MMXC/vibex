# AGENTS.md: vibex-canvas-flowtree-edit-20260328

## dev 约束

### S1.1
- ✅ `addFlowNode(contextId?)` 支持可选参数
- ✅ 移除 `canManualAdd` 条件后确保有 contextNodes 时仍正常工作

### S1.2
- ✅ `addStepToFlow(flowNodeId)` 新增到 store
- ✅ 新步骤默认 `confirmed=false`, `status='pending'`, `autoFocus=true`
- ✅ FlowCard 按钮仅在 `expanded && !readonly` 时显示

### S1.3
- ✅ 只修改 `canvas.module.css`（浅色主题）
- ❌ 不修改 `FlowNodes.tsx`（React Flow 深色主题）

## tester 约束
- ✅ 所有 3 个 Story 的边界场景覆盖
- ✅ gstack 截图验证三态颜色

## reviewer 约束
- [ ] 确认 S1.1 改动无回归
- [ ] 确认 S1.3 不影响 React Flow 画布
