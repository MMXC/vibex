# Spec: E01 — ProtoPreview 实时联动

**Epic**: E01 ProtoPreview 实时联动
**Stories**: S01, S02
**Agent**: pm
**日期**: 2026-05-07

---

## 1. 概述

ProtoPreview 面板与组件树联动：选中组件节点 → 200ms 内 ProtoPreview 实时渲染；修改 props → 无白屏热更新。

---

## 2. 技术方案（方案 A — Zustand Subscription 联动）

### 核心变更

`ProtoFlowCanvas.tsx` 中 ProtoPreview 子组件增加 `componentStore` subscription：

```typescript
// ProtoFlowCanvas.tsx
import { useShallow } from 'zustand/react/shallow';
import { useComponentStore } from '@/stores/componentStore';

// ProtoPreview 子组件
const ProtoPreviewPanel = () => {
  const { selectedIds } = useComponentStore(
    useShallow(s => ({ selectedIds: s.selectedIds }))
  );

  const selectedNode = useMemo(() => {
    if (!selectedIds.length) return null;
    return useComponentStore.getState().nodes.find(n => n.id === selectedIds[0]);
  }, [selectedIds]);

  return <ProtoPreview node={selectedNode} />;
};
```

### 防抖策略

```typescript
// debounce.ts
import { debounce } from '@/utils/debounce';

const debouncedUpdate = debounce((nodeId: string, props: object) => {
  usePreviewStore.getState().updateNodeProps(nodeId, props);
}, 200);
```

### 性能保护

- `React.memo` 包裹 ProtoPreview，防止父组件重渲染导致子组件卸载
- `data-rebuild="false"` 标记组件热更新成功，供 E2E 断言

---

## 3. 数据流

```
componentStore.selectedIds 变更
  → useShallow subscription 触发
  → debouncedUpdate(200ms)
  → previewStore.nodeProps 更新
  → ProtoFlowCanvas re-render
  → ProtoPreview 接收新 props
  → 组件热更新（无卸载重挂）
```

---

## 4. 页面集成清单

| 页面/组件 | 文件路径 | 变更类型 |
|---------|---------|---------|
| ProtoFlowCanvas | `src/components/prototype/ProtoFlowCanvas.tsx` | 修改：增加 subscription |
| ProtoPreview | `src/components/preview/ProtoPreview.tsx` | 修改：增加热更新逻辑 |
| componentStore | `src/stores/componentStore.ts` | 无变更（只读 selectedIds） |

---

## 5. 测试策略

### Vitest Unit

```typescript
// src/components/prototype/ProtoFlowCanvas.test.ts

test('componentStore selectedIds change → ProtoPreview re-renders', async () => {
  const { getByTestId } = render(<ProtoFlowCanvas />);

  // Simulate store update
  act(() => {
    useComponentStore.getState().setSelectedIds(['node_001']);
  });

  await waitFor(() => {
    expect(getByTestId('proto-preview-node')).toBeVisible();
  });
  expect(getByTestId('proto-preview').dataset.rebuild).toBe('false');
});
```

### E2E

```typescript
// tests/e2e/protopreview-realtime.spec.ts

test('选中组件节点 → ProtoPreview 200ms 内渲染', async ({ page }) => {
  await page.goto('/canvas/proj_001');
  const start = Date.now();
  await page.click('[data-tree-item="node_001"]');
  await page.waitForSelector('[data-testid="proto-preview-node"]');
  expect(Date.now() - start).toBeLessThan(200);
});
```

---

## 6. DoD

- [ ] `ProtoFlowCanvas.tsx` 使用 `useShallow` 订阅 `componentStore.selectedIds`
- [ ] 防抖 200ms，防止高频重渲染
- [ ] 热更新时 `data-rebuild="false"`（无组件卸载重挂）
- [ ] Vitest unit: `componentStore → ProtoPreview re-render` 链路测试通过
- [ ] E2E: 选中节点到预览显示 ≤ 200ms（p95）
- [ ] Props 修改：preview 热更新，rebuild = false
- [ ] 未选中组件：ProtoPreview 显示 placeholder
