# Spec: 流程图显示修复 (Epic 2)

## ST-03: 流程图容器渲染

### 验收标准

```typescript
// FlowChart.spec.tsx
render(<FlowChart mermaidCode="graph TD; A-->B" />);
expect(document.querySelector('.mermaid svg')).toBeInTheDocument();
expect(document.querySelector('.mermaid svg')).toHaveAttribute('width');
```

### 实现要点

1. 确认 mermaid 库加载成功
2. 容器正确挂载
3. SVG 生成成功

---

## ST-04: mermaidCode 状态同步

### 验收标准

```typescript
// useConfirmationStore.spec.ts
const store = useConfirmationStore.getState();
expect(store.mermaidCode).toContain('graph');
expect(store.mermaidCode).toMatch(/graph\s+(TD|LR|RL)/);
```

### 根因分析

`onGenerateFlow()` 改为 `onGenerateContexts()` 后，mermaidCode 更新逻辑未同步

### 修复方案

```typescript
// confirmationStore.ts
actions: {
  onGenerateContexts: () => {
    // 生成 boundedContexts 后更新 mermaidCode
    set({
      mermaidCode: generateFlowDiagram(boundedContexts)
    });
  }
}
```

---

## ST-05: 状态更新后重新渲染

### 验收标准

```typescript
// FlowChart.integration.spec.tsx
const { rerender } = render(<FlowChart mermaidCode="" />);
expect(screen.queryByText(/flow.*chart/i)).not.toBeInTheDocument();

rerender(<FlowChart mermaidCode="graph TD; A-->B" />);
expect(screen.getByText(/flow.*chart/i)).toBeVisible();
```

### 页面集成

- **文件**: `vibex-fronted/src/components/FlowChart.tsx`
- **Store**: `vibex-fronted/src/stores/confirmationStore.ts`
- **测试**: `vibex-fronted/src/__tests__/FlowChart.spec.tsx`

### DoD

- [ ] mermaidCode 非空
- [ ] SVG 渲染成功
- [ ] 状态更新触发重渲染
