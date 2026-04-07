# Implementation Plan: vibex-canvas-context-pass-20260328

## dev 开发步骤

1. **检查 Store**: 确认 `canvasStore` 有 `contextTree` 字段和 `setContextTree` action
2. **检查 Editor 同步**: 确认 ContextTreeEditor 的 `onChange` → `setContextTree` 调用
3. **检查 API 参数**: 找到「继续·流程树」按钮的 API 调用，确认 `contextTree` 在 params 中
4. **补充缺失**: 如果 store 或 API 缺失 contextTree，补上对应代码
5. **Git commit + task update**

## tester 验收步骤

1. gstack 编辑 contextTree → 验证 store 更新（Vitest mock store）
2. gstack network 监控 → 点击按钮 → 验证 POST body 包含 contextTree
3. E2E 端到端验证后端使用最新上下文

## reviewer 检查点

- [ ] store.setContextTree 在 editor onChange 中被调用
- [ ] API 调用 params 包含 contextTree
- [ ] 现有功能不受影响（其他 API 调用未破坏）
