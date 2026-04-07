# SPEC-F2: Card Drag and Drop

## 1. ReactFlow v12 升级

### 升级命令
```bash
pnpm add @xyflow/react@latest
```

### API 变更点（v11 → v12）
| v11 | v12 | 说明 |
|------|------|------|
| `onNodeDrag` | `onNodesChange` (type: 'position') | 统一变更处理 |
| `NodeChangeType` | `NodeChange` | 类型重构 |

### 兼容处理
```typescript
// v12 onNodesChange 处理
const onNodesChange: OnNodesChange = (changes) => {
  changes.forEach(change => {
    if (change.type === 'position' && !change.dragging) {
      // 拖拽结束 → 保存位置
      debouncedSavePosition(change.id, change.position);
    }
  });
  applyNodeChanges(changes);
};
```

## 2. DraggableCardTreeRenderer 组件

```typescript
interface DraggableCardTreeRendererProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onNodeClick?: (event: MouseEvent, node: Node) => void;
  defaultViewport?: Viewport;
}
```

## 3. 位置持久化 Schema

```typescript
interface DraggedPositions {
  [nodeId: string]: { x: number; y: number };
}

// localStorage key
const DRAG_STORAGE_KEY = 'canvas-dragged-positions';

// 保存时序
// 1. 用户拖拽结束（!change.dragging）
// 2. debounce 200ms
// 3. 合并到现有 draggedPositions
// 4. 写入 localStorage
```

## 4. 关系边跟随

```typescript
// ReactFlow 自动处理
// 当 source/target 节点 position 变化时
// edges 自动更新路径（使用 smoothstep 或 bezier）
// 跨框边在 BoundedGroupNode 边界处打断
```
