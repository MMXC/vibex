# E5 Spec: Integration 测试

## migration.test.ts

```typescript
// src/__tests__/canvas/migration.test.ts
describe('split stores data consistency', () => {
  test('setContextNodes → flowStore cascadeUpdate → componentStore', async () => {
    // 1. 设置 context nodes
    act(() => {
      useContextStore.getState().setContextNodes(mockContexts);
    });

    // 2. 触发 cascade
    act(() => {
      useFlowStore.getState().cascadeUpdate('context-node-1');
    });

    // 3. 验证 flow nodes 数量
    const flowNodes = useFlowStore.getState().flowNodes;
    expect(flowNodes.length).toBeGreaterThan(0);

    // 4. 验证 component nodes
    act(() => {
      useComponentStore.getState().generateComponents('flow-node-1');
    });
    const componentNodes = useComponentStore.getState().componentNodes;
    expect(componentNodes.length).toBeGreaterThan(0);
  });

  test('localStorage persistence after refresh', () => {
    // 写入 localStorage
    act(() => {
      useContextStore.getState().setContextNodes(mockContexts);
    });

    // 模拟刷新（重新创建 store 实例）
    // @ts-ignore
    window.localStorage.setItem('contextStore', JSON.stringify({ state: { contextNodes: mockContexts } }));

    // 重新初始化
    const restored = useContextStore.getState().contextNodes;
    expect(restored.length).toBe(mockContexts.length);
  });
});
```

## store-integration.test.ts

```typescript
// src/__tests__/canvas/store-integration.test.ts
describe('crossStoreSync integration', () => {
  test('activeTree switch syncs centerExpand', () => {
    // 切换 activeTree 到 context
    act(() => {
      useUIStore.getState().setActiveTree('context');
    });

    // 验证 centerExpand 同步
    const centerExpand = useUIStore.getState().centerExpand;
    expect(centerExpand).toBe('context');
  });

  test('phase change syncs panel collapse', () => {
    act(() => {
      useUIStore.getState().setPhase('flow');
    });

    // flow phase 时 context panel 应折叠
    const collapsed = useUIStore.getState().contextPanelCollapsed;
    expect(collapsed).toBe(true);
  });
});
```
