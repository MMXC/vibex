# Implementation Plan: Flow Step Check Fix

**项目**: flow-step-check-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## E1: 级联确认逻辑修复（0.5h）

### 步骤 1: 修改 confirmFlowNode

**文件**: `src/lib/canvas/canvasStore.ts`（或 flowStore）

```typescript
// 替换 confirmFlowNode 实现
confirmFlowNode: (nodeId) => {
  set(state => ({
    flowNodes: state.flowNodes.map(n =>
      n.nodeId === nodeId
        ? {
            ...n,
            status: 'confirmed',
            isActive: true,
            steps: n.steps?.map(s => ({ ...s, status: 'confirmed' }))
          }
        : n
    )
  }));
}
```

### 步骤 2: 测试验证

```typescript
it('should cascade confirm to all steps', () => {
  const node = { nodeId: '1', steps: [{ id: 's1' }, { id: 's2' }] };
  useFlowStore.getState().confirmFlowNode('1');
  const updated = useFlowStore.getState().flowNodes[0];
  expect(updated.status).toBe('confirmed');
  expect(updated.steps.every(s => s.status === 'confirmed')).toBe(true);
});
```

### 步骤 3: 回归测试

```bash
npm test -- --testPathPattern="BusinessFlowTree|flowStore"
```

---

## 验收清单

- [ ] `confirmFlowNode` 级联修改 `steps` 数组
- [ ] 父节点 confirmed
- [ ] 所有子步骤 confirmed
- [ ] 其他树功能无 regression
- [ ] npm test 通过
