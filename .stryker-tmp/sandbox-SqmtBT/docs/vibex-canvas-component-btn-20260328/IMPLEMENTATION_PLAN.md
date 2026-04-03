# Implementation Plan: vibex-canvas-component-btn-20260328

## dev 开发顺序

1. **S1.1 按钮添加**：在 `BusinessFlowTree.tsx` 工具栏添加「继续·组件树」按钮（初始 disabled）
2. **S1.2 数据绑定**：`useDDDStore` 订阅 `flowData`，按钮 enabled 条件绑定
3. **S1.3 API 调用**：添加 `fetchComponentTree()` 到 `canvasApi.ts`，按钮 onClick handler
4. **S1.4 组件树渲染**：添加 `ComponentTreeCard` 组件，订阅 `componentTree` store

## tester 验收顺序

1. gstack 截图：按钮可见
2. 截图：无 flowData 时按钮 disabled
3. network 监控：API 请求包含 flowData
4. 截图：成功渲染组件树卡片
5. 错误场景测试

## reviewer 检查点

- [ ] 按钮 disabled 逻辑覆盖所有边界情况
- [ ] API 请求参数包含 flowData
- [ ] 错误处理有 try/catch
- [ ] 防止重复提交（isLoading 锁）
