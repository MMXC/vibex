# SPEC-F3: BoundedGroupNode (虚线领域框)

## 1. 组件 API

```typescript
interface BoundedGroupNodeData {
  label: string;      // 领域名称
  color: string;      // 边框颜色，默认 #6366f1
  nodeIds: string[];  // 包裹的卡片 ID 列表
}

interface BoundedGroupNodeProps {
  id: string;
  data: BoundedGroupNodeData;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}
```

## 2. 样式规范

```css
.bounded-group-node {
  border: 2px dashed var(--group-color, #6366f1);
  border-radius: 8px;
  background: color-mix(in srgb, var(--group-color, #6366f1) 8%, transparent);
  padding: 8px;
  min-width: 200px;
  min-height: 100px;
  transition: border-color 0.2s, background-color 0.2s;
}

.bounded-group-node:hover {
  background: color-mix(in srgb, var(--group-color, #6366f1) 15%, transparent);
}
```

## 3. 右键菜单

```typescript
// 创建领域框
MenuItems: [
  { id: 'create-bounded-group', label: '创建领域框', enabled: selectedNodes.length >= 1 },
  { id: 'delete-bounded-group', label: '删除领域框', enabled: selectedNode.type === 'bounded-group' },
]

// 创建对话框
Dialog: {
  title: '创建领域框',
  fields: [
    { id: 'label', type: 'text', placeholder: '领域名称', required: true },
    { id: 'color', type: 'color', defaultValue: '#6366f1' },
  ],
  actions: ['取消', '确认创建'],
}
```

## 4. 跨框关系边打断

```typescript
// 当边连接不同 BoundedGroup 的节点时
// 在两框边界处插入断点
// 使用 RelationshipEdge + insertPathEdge 组合

interface CrossGroupEdge {
  sourceGroupId: string;
  targetGroupId: string;
  sourceNodeId: string;
  targetNodeId: string;
  breakpoints: Point[]; // 穿越边界时的断点
}
```
