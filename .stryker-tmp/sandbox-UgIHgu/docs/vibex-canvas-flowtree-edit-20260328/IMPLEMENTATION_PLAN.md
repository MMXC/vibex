# Implementation Plan: vibex-canvas-flowtree-edit-20260328

## dev 开发顺序

1. **S1.1**: `canvasStore.addFlowNode()` 参数调整 → `BusinessFlowTree.handleManualAdd()` 移除条件 → Vitest 测试
2. **S1.2**: `canvasStore.addStepToFlow()` 新增 → `FlowCard` 按钮 → Vitest 测试
3. **S1.3**: `canvas.module.css` 颜色审查 → 修正 → gstack 截图验证

## tester 验收

- S1.1: gstack 截图（零上下文状态 + 添加流程）
- S1.2: gstack 点击添加步骤 → 截图验证编辑模式
- S1.3: gstack 截图 pending/confirmed/error 三态颜色

## reviewer 检查点

- [ ] S1.1: 零上下文添加不破坏关联添加逻辑
- [ ] S1.2: 新步骤默认 confirmed=false, status=pending
- [ ] S1.3: 不修改 FlowNodes.tsx 深色主题
