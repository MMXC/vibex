# ADR: vibex-canvas-bc-layout-20260328 架构设计

## Status
Accepted

## Context
BoundedContextTree 中上下文卡片以纯垂直列表排列，用户无法直观识别领域分组。需要按领域类型（core/supporting/generic/external）分组，用虚线框包裹。

## Decision

### Tech Stack
- **Framework**: React 19 + TypeScript（现有）
- **Styling**: CSS Modules + CSS Custom Properties（现有）
- **State**: canvasStore Zustand（现有，无需新增）
- **Test**: Vitest + Testing Library（现有）

### Architecture

```
canvasStore.contextNodes[]
        │
        ▼
domainType / groupId 字段注入（F1.1）
        │
        ▼
BoundedContextTree 按 domainType 分组渲染（F1.2）
        │
        ├─ core     → DomainGroup[data-type="core"]
        ├─ supporting → DomainGroup[data-type="supporting"]
        ├─ generic   → DomainGroup[data-type="generic"]
        └─ external  → DomainGroup[data-type="external"]
        │
        ▼
DomainGroup 虚线框 + 标签（F1.3）
```

### File Changes

| 文件 | 操作 | 描述 |
|------|------|------|
| `src/lib/canvas/types.ts` | 修改 | ContextNode 增加 domainType + groupId |
| `src/components/canvas/BoundedContextTree.tsx` | 修改 | 按 domainType 分组渲染 |
| `src/components/canvas/canvas.module.css` | 修改 | .domainGroup + .domainGroupHeader 样式 |

### Data Model

```typescript
// src/lib/canvas/types.ts
interface ContextNode {
  nodeId: string;
  name: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  domainType: 'core' | 'supporting' | 'generic' | 'external'; // 新增
  groupId: string; // 新增: `domain-${domainType}`
  confirmed: boolean;
  // ... 其他已有字段
}

// src/components/canvas/BoundedContextTree.tsx 分组逻辑
const groupedNodes = {
  core: contextNodes.filter(n => n.domainType === 'core'),
  supporting: contextNodes.filter(n => n.domainType === 'supporting'),
  generic: contextNodes.filter(n => n.domainType === 'generic'),
  external: contextNodes.filter(n => n.domainType === 'external'),
};

const domainOrder = ['core', 'supporting', 'generic', 'external'] as const;
```

### CSS Architecture

```css
/* canvas.module.css */
.domainGroup {
  position: relative;
  border: 2px dashed var(--domain-color);
  border-radius: 8px;
  padding: 16px;
  padding-top: 24px;
  margin-bottom: 16px;
}

.domainGroup[data-type="core"]        { --domain-color: #F97316; }
.domainGroup[data-type="supporting"]  { --domain-color: #3B82F6; }
.domainGroup[data-type="generic"]     { --domain-color: #6B7280; }
.domainGroup[data-type="external"]    { --domain-color: #8B5CF6; }

.domainGroupHeader {
  position: absolute;
  top: -10px;
  left: 12px;
  background: #fff;
  padding: 0 8px;
  color: var(--domain-color);
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
}
```

## Consequences

### Positive
- 视觉分组清晰，认知负担降低
- 不影响现有 CRUD 操作
- CSS Modules 隔离，无全局污染

### Risks
- **风险**: 现有 contextNode 数据无 domainType 字段 → **缓解**: canvasStore 初始化时自动推导（从 type 字段映射）
- **风险**: 空分组渲染空 DOM → **缓解**: 只渲染有节点的分组
- **风险**: 深色模式下白色 header 背景突兀 → **缓解**: 使用 `background: canvas` 变量自适应

## Testing Strategy

| 测试类型 | 工具 | 覆盖率目标 |
|----------|------|------------|
| 单元测试 | Vitest | domainType/groupId 字段推导逻辑 > 90% |
| 组件测试 | Testing Library | 分组渲染、空分组不渲染 > 85% |
| 样式测试 | CSS snapshot | 虚线框颜色/边框/圆角 > 80% |

```typescript
// canvasStore.spec.ts
it('should auto-derive domainType and groupId from type', () => {
  const node: ContextNode = { ...baseNode, type: 'core' };
  expect(node.domainType).toBe('core');
  expect(node.groupId).toBe('domain-core');
});

// BoundedContextTree.spec.tsx
it('should only render domain groups with nodes', () => {
  // 无 supporting 节点时，不渲染 supporting 分组
  const nodes = [createNode('core'), createNode('core')];
  render(<BoundedContextTree nodes={nodes} />);
  expect(screen.queryByTestId('domain-group-supporting')).not.toBeInTheDocument();
});
```
