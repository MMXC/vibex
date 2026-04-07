# E1: selectedNodeIds 读取修复 - 详细规格

## S1.1 selectedNodeIds 读取

### 目标
在 `BusinessFlowTree.tsx` 中引入 `selectedNodeIds`，发送选中的上下文而非全部。

### 现状问题
```typescript
// BusinessFlowTree.tsx - 问题代码
const handleContinueToComponents = async () => {
  setComponentGenerating(true);
  
  // ❌ 直接发送全部 contextNodes，未读取 selectedNodeIds
  const mappedContexts = contextNodes.map((ctx) => ({
    id: ctx.nodeId,
    name: ctx.name,
    description: ctx.description ?? '',
    type: ctx.type,
  }));
  
  await api.generateComponents({ contexts: mappedContexts });
};
```

### 实施方案
```typescript
// BusinessFlowTree.tsx - 修复后

import { useContextStore } from '@/lib/canvas/stores/contextStore';

// 在组件内获取 selectedNodeIds
const { selectedNodeIds } = useContextStore();

const handleContinueToComponents = async () => {
  // 1. 空上下文检查
  if (!contextNodes || contextNodes.length === 0) {
    toast.showToast('请先生成上下文树', 'error');
    setComponentGenerating(false);
    return;
  }

  setComponentGenerating(true);

  try {
    // 2. 读取 selectedNodeIds，过滤上下文
    const selectedContextSet = new Set(selectedNodeIds.context);
    const activeContexts = contextNodes.filter((ctx) => ctx.isActive !== false);
    
    const contextsToSend = selectedContextSet.size > 0
      ? activeContexts.filter((ctx) => selectedContextSet.has(ctx.nodeId))
      : activeContexts; // fallback: 发送全部

    // 3. 如果过滤后为空，但有 contextNodes，fallback 为全部
    const mappedContexts = contextsToSend.length > 0
      ? contextsToSend
      : contextNodes;

    const response = await api.generateComponents({ contexts: mappedContexts });
    
    if (response.success) {
      // 更新组件树
      setComponentNodes(response.data.components || []);
    }
  } catch (err) {
    console.error('[BusinessFlowTree] generateComponents failed:', err);
    toast.showToast('组件生成失败，请重试', 'error');
  } finally {
    setComponentGenerating(false);
  }
};
```

### 验收断言
```typescript
// __tests__/BusinessFlowTree.test.tsx

describe('handleContinueToComponents', () => {
  it('should send selected contexts when selectedNodeIds exists', async () => {
    const selectedIds = new Set(['ctx-1', 'ctx-2']);
    const mockContextNodes = [
      { nodeId: 'ctx-1', name: 'Context 1', type: 'context' },
      { nodeId: 'ctx-2', name: 'Context 2', type: 'context' },
      { nodeId: 'ctx-3', name: 'Context 3', type: 'context' },
    ];
    
    renderWithStore(<BusinessFlowTree />, {
      contextNodes: mockContextNodes,
      selectedNodeIds: { context: selectedIds, flow: new Set() }
    });
    
    await clickContinue();
    
    expect(api.generateComponents).toHaveBeenCalledWith({
      contexts: expect.arrayContaining([
        expect.objectContaining({ id: 'ctx-1' }),
        expect.objectContaining({ id: 'ctx-2' }),
      ])
    });
    expect(api.generateComponents).toHaveBeenCalledWith({
      contexts: expect.not.arrayContaining([
        expect.objectContaining({ id: 'ctx-3' })
      ])
    });
  });

  it('should fallback to all contexts when nothing selected', async () => {
    renderWithStore(<BusinessFlowTree />, {
      contextNodes: mockContextNodes,
      selectedNodeIds: { context: new Set(), flow: new Set() }
    });
    
    await clickContinue();
    
    expect(api.generateComponents).toHaveBeenCalledWith({
      contexts: expect.arrayContaining(mockContextNodes)
    });
  });

  it('should show error toast when contextNodes is empty', async () => {
    renderWithStore(<BusinessFlowTree />, {
      contextNodes: [],
      selectedNodeIds: { context: new Set(), flow: new Set() }
    });
    
    await clickContinue();
    
    expect(toast.showToast).toHaveBeenCalledWith(
      '请先生成上下文树',
      'error'
    );
    expect(setComponentGenerating).toHaveBeenCalledWith(false);
  });
});
```

### DoD Checklist
- [ ] `BusinessFlowTree.tsx` 引入 `useContextStore`
- [ ] `handleContinueToComponents` 使用 `selectedNodeIds.context` 过滤
- [ ] fallback 逻辑：无选中时发送全部
- [ ] 空上下文检查 + toast 错误
- [ ] jest 测试覆盖三种场景

---

## S2.1 Toast 错误提示

### 目标
无上下文时显示明确错误提示，不静默失败。

### 实施方案
```typescript
// BusinessFlowTree.tsx 中添加

if (!contextNodes || contextNodes.length === 0) {
  toast.showToast('请先生成上下文树', 'error');
  setComponentGenerating(false);
  return;
}
```

### 验收断言
```typescript
it('should show error toast when no contexts exist', async () => {
  renderWithStore(<BusinessFlowTree />, {
    contextNodes: [],
    selectedNodeIds: { context: new Set(), flow: new Set() }
  });
  
  await clickContinue();
  
  expect(toast.showToast).toHaveBeenCalledWith(
    '请先生成上下文树',
    'error'
  );
});
```

### DoD Checklist
- [ ] 空上下文检查
- [ ] `toast.showToast('请先生成上下文树', 'error')`
- [ ] `setComponentGenerating(false)` 恢复状态
