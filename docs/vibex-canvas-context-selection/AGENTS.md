# 开发约束: Canvas Context Selection Bug 修复

> **项目**: vibex-canvas-context-selection  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 强制规范

### 1.1 不得破坏现有行为

- **CanvasPage.tsx**: 不修改，`handleContinueToComponents` 行为不变
- **API 接口**: 不修改请求/响应格式
- **BusinessFlowTree 其他函数**: 不修改

### 1.2 禁止事项

- **禁止** 在 `handleContinueToComponents` 外部修改 `selectedNodeIds`
- **禁止** 修改 `useContextStore` 的 `selectedNodeIds` 类型
- **禁止** 移除 `setComponentGenerating(false)` 的 `finally` 块

---

## 2. 代码风格

### 2.1 正确的 selection-aware 逻辑

```typescript
// ✅ 正确: 与 CanvasPage.tsx 一致
const selectedContextSet = new Set(selectedNodeIds.context);
const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
const contextsToSend = selectedContextSet.size > 0
  ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
  : activeContexts;

// ❌ 错误: 直接发送全部
const mappedContexts = contextNodes.map((ctx) => ({ ... }));
```

### 2.2 空上下文检查

```typescript
// ✅ 正确
if (contextNodes.length === 0) {
  toast.showToast('请先生成上下文树', 'error');
  setComponentGenerating(false);
  return;
}

// ❌ 错误: 静默失败
if (contextNodes.length === 0) return;  // 无反馈
```

---

## 3. 测试要求

```typescript
// BusinessFlowTree.test.tsx
import { renderWithStore } from '@/tests/utils';

// 场景 1: 选中部分上下文
it('should send selected contexts only', async () => {
  const store = {
    selectedNodeIds: { context: ['ctx-1'], flow: [] },
    contextNodes: [{ nodeId: 'ctx-1', name: 'Ctx 1' }, { nodeId: 'ctx-2', name: 'Ctx 2' }],
  };
  renderWithStore(<BusinessFlowTree />, store);
  await clickContinue();
  expect(api.generateComponents).toHaveBeenCalledWith({
    contexts: expect.arrayContaining([expect.objectContaining({ id: 'ctx-1' })])
  });
});

// 场景 2: 未选中 → fallback 全部
it('should fallback to all contexts when nothing selected', async () => {
  // selectedNodeIds.context = []
  // 期望发送全部 contextNodes
});

// 场景 3: 空上下文 → toast 错误
it('should show error toast when contextNodes is empty', async () => {
  // 期望 toast.showToast('请先生成上下文树', 'error')
  // 期望不调用 API
});
```

---

## 4. 审查清单

- [ ] `vitest run` 全部通过
- [ ] `pnpm lint` 无错误
- [ ] `handleContinueToComponents` 使用 `selectedNodeIds.context` 过滤
- [ ] `selectedNodeIds.context` 为空时 fallback 发送全部
- [ ] 空 `contextNodes` 时显示 toast 错误
- [ ] `CanvasPage.tsx` 未被修改
- [ ] `setComponentGenerating(false)` 在 finally 中调用

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
