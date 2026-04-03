# E3 Spec: useCanvasRenderer

## 接口设计

```typescript
interface UseCanvasRendererReturn {
  // Node Rects
  contextNodeRects: NodeRect[];
  flowNodeRects: NodeRect[];
  componentNodeRects: NodeRect[];

  // Edges
  boundedEdges: BoundedEdge[];
  flowEdges: FlowEdge[];

  // Tree Nodes
  contextTreeNodes: TreeNode[];
  flowTreeNodes: TreeNode[];
  componentTreeNodes: TreeNode[];

  // Confirmation
  confirmation: {
    contextReady: boolean;
    flowReady: boolean;
    componentReady: boolean;
    allTreesConfirmed: boolean;
  };

  // Phase
  phaseLabel: string;
  phaseHint: string;
}
```

## 派生数据计算

```typescript
// 限界上下文节点矩形
const contextNodeRects = useMemo(() => {
  return contextNodes.map(node => ({
    id: node.nodeId,
    x: node.position?.x ?? 0,
    y: node.position?.y ?? 0,
    width: 200,
    height: 80,
  }));
}, [contextNodes]);

// 限界上下文关联边
const boundedEdges = useMemo(() => {
  const edges: BoundedEdge[] = [];
  contextNodes.forEach(ctx => {
    (ctx.dependencies ?? []).forEach(dep => {
      const sourceRect = contextNodeRects.find(r => r.id === ctx.nodeId);
      const targetRect = contextNodeRects.find(r => r.id === dep.nodeId);
      if (sourceRect && targetRect) {
        edges.push({ source: sourceRect, target: targetRect, type: 'dependency' });
      }
    });
  });
  return edges;
}, [contextNodes, contextNodeRects]);

// Confirmation
const allTreesConfirmed = contextNodes.every(n => n.status === 'confirmed')
  && flowNodes.every(n => n.status === 'confirmed')
  && componentNodes.every(n => n.status === 'confirmed');
```
