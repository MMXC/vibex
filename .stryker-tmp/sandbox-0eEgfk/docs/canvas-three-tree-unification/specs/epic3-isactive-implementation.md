# Epic3 confirmed → isActive 实现方案

## 背景
将 `confirmed` 字段替换为 `isActive`，符合 canvas-three-tree-unification 的统一数据模型目标。

## 影响范围
- types.ts: BoundedContextNode, BusinessFlowNode, ComponentNode, FlowStep
- canvasStore.ts: confirmContextNode, confirmFlowNode, confirmAllComponentNodes 方法
- CascadeUpdateManager.areAllConfirmed: 检查 isActive
- 约 20+ 个组件文件引用 .confirmed

## 方案设计

### 字段映射
- `confirmed: true` → `isActive: true`
- `confirmed: false` → `isActive: false`
- `isActive` 默认值: `true`（向后兼容无 isActive 字段的旧数据）

### 实现步骤

1. **types.ts**:
   - 移除 `confirmed: boolean` 字段
   - 添加 `isActive?: boolean`（可选，默认 true）

2. **canvasStore.ts**:
   - 移除 `confirmContextNode`, `confirmFlowNode`, `confirmAllComponentNodes` 方法
   - 移除 `areAllConfirmed`（改用 `hasNodes`）
   - 更新 persist migration: confirmed → isActive

3. **CascadeUpdateManager.ts**:
   - 更新 `areAllConfirmed` → `hasActiveNodes` 检查 isActive

4. **组件更新**:
   - 所有 `.confirmed` → `.isActive`
   - TreePanel.tsx: confirmedCount → activeCount
   - TreeStatus.tsx: confirmedContexts → activeContexts

5. **migration 测试**: 覆盖 confirmed → isActive

## 验收标准
- [ ] grep 无 `.confirmed` 引用（除测试文件）
- [ ] npm test 通过
- [ ] tsc --noEmit 通过
- [ ] migration 测试覆盖旧数据兼容
