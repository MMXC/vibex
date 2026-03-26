/**
 * CardTreeRenderer — ReactFlow-based CardTree visualization
 *
 * Renders cards in a vertical tree layout using ReactFlow:
 * - Each card is a ReactFlow custom node (CardTreeNode)
 * - Cards are vertically stacked with connecting edges
 * - Integrates with visualizationStore for state management
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { ReactFlow, 
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  BackgroundVariant,
  Position,
  EdgeTypes,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CardTreeNode } from '../CardTreeNode/CardTreeNode';
import type { CardTreeVisualizationRaw, CardTreeNodeData } from '@/types/visualization';
import type { FlowGateway, GatewayNodeData, LoopEdgeData } from '@/lib/canvas/types';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { BoundedGroupOverlay } from '@/components/canvas/groups/BoundedGroupOverlay';
import styles from './CardTreeRenderer.module.css';

// Re-export CardTreeNode type for external use
export type { CardTreeNodeData };

export interface CardTreeRendererProps {
  /** CardTree data to render */
  data: CardTreeVisualizationRaw | null | undefined;
  /** Extra edges to overlay (e.g., relationship edges) — Epic 1 */
  extraEdges?: Edge[];
  /** Custom edge types registry — Epic 1 */
  edgeTypes?: EdgeTypes;
  /** Flow gateways for branching/loop visualization — Epic 2 */
  flowGateways?: FlowGateway[];
  /** Override: show minimap */
  showMinimap?: boolean;
  /** Override: fit view on load */
  fitView?: boolean;
  /** Override: show controls */
  showControls?: boolean;
  /** Override: show background */
  showBackground?: boolean;
  /** Override: readonly mode */
  readonly?: boolean;
  /** Controlled expanded node IDs */
  expandedIds?: Set<string>;
  /** Toggle node expanded state */
  onToggleExpand?: (nodeId: string) => void;
  /** Callback: card checkbox toggled */
  onCheckboxToggle?: (cardId: string, childId: string, checked: boolean) => void;
  /** Callback: card clicked */
  onCardClick?: (cardId: string) => void;
  /** Callback: flow initialized */
  onInit?: () => void;
  /** Custom class name */
  className?: string;
}

// ==================== Node Types Registry ====================

// Lazy imports to avoid circular dependency
let _gatewayNodeTypes: NodeTypes | null = null;
let _loopEdgeTypes: EdgeTypes | null = null;

function getNodeTypes(): NodeTypes {
  if (!_gatewayNodeTypes) {
    const { GatewayNode } = require('@/components/canvas/nodes/GatewayNode');
    _gatewayNodeTypes = { cardTreeNode: CardTreeNode as any, gatewayNode: GatewayNode as any };
  }
  return _gatewayNodeTypes;
}

function getEdgeTypes(): EdgeTypes {
  if (!_loopEdgeTypes) {
    const { LoopEdge } = require('@/components/canvas/edges/LoopEdge');
    _loopEdgeTypes = { loopEdge: LoopEdge as any };
  }
  return _loopEdgeTypes;
}

// ==================== Layout Engine (Vertical) ====================

const CARD_HEIGHT = 200;
const CARD_MARGIN_Y = 60;
const CENTER_X = 400; // Center nodes horizontally in the viewport

/**
 * Convert CardTreeVisualizationRaw into ReactFlow nodes + edges
 * with automatic VERTICAL layout (cards stacked top-to-bottom).
 * Extra edges (e.g., relationship edges) are appended after the
 * default sequence edges — Epic 1.
 *
 * When flowGateways are provided (Epic 2), inserts gateway diamond nodes
 * at branch points and adds loop edges for cyclic flows.
 */
function buildFlowGraph(
  data: CardTreeVisualizationRaw | null,
  expandedIds?: Set<string>,
  extraEdges: Edge[] = [],
  flowGateways: FlowGateway[] = [],
  /** E3: User-dragged positions override auto layout */
  draggedPositions: Record<string, { x: number; y: number }> = {}
): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = data.nodes.map((card, index) => ({
    id: card.title,
    type: 'cardTreeNode',
    position: draggedPositions[card.title] ?? {
      x: CENTER_X,
      y: index * (CARD_HEIGHT + CARD_MARGIN_Y),
    },
    data: {
      ...card,
      isExpanded: expandedIds ? expandedIds.has(card.title) : card.isExpanded !== false,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e-${i}-${i + 1}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      label: '',
    });
  }

  // Append relationship / extra edges — Epic 1
  if (extraEdges.length > 0) {
    edges.push(...extraEdges);
  }

  // ─── Epic 2: Gateway nodes + loop edges ─────────────────────────────────
  if (flowGateways.length > 0) {
    // Insert gateway nodes between cards at gateway positions
    const gatewayNodeMap = new Map<string, Node>();
    for (const gw of flowGateways) {
      // Find the source card index
      const sourceCardIdx = nodes.findIndex(
        (n) => n.id === gw.sourceStepId || n.id.includes(gw.sourceStepId)
      );
      const targetCardIdx = nodes.findIndex(
        (n) => gw.targetStepIds.some(
          (tid) => n.id === tid || n.id.includes(tid)
        )
      );

      // Calculate Y position: between source and target cards
      const sourceY = sourceCardIdx >= 0
        ? sourceCardIdx * (CARD_HEIGHT + CARD_MARGIN_Y)
        : nodes.length * (CARD_HEIGHT + CARD_MARGIN_Y) / 2;
      const targetY = targetCardIdx >= 0
        ? targetCardIdx * (CARD_HEIGHT + CARD_MARGIN_Y)
        : sourceY + CARD_HEIGHT + CARD_MARGIN_Y;
      const gatewayY = (sourceY + targetY) / 2;

      // XOR gateways: offset left/right from center; OR: center
      const offsetX = gw.type === 'xor' ? 120 : 0;
      const gatewayNode: Node = {
        id: gw.gatewayId,
        type: 'gatewayNode',
        position: { x: CENTER_X + offsetX, y: gatewayY },
        data: {
          gatewayType: gw.type,
          label: gw.label,
          condition: gw.condition,
        } as GatewayNodeData,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      nodes.push(gatewayNode);
      gatewayNodeMap.set(gw.gatewayId, gatewayNode);

      // Connect source card → gateway
      const sourceNodeId = sourceCardIdx >= 0 ? nodes[sourceCardIdx].id : nodes[0].id;
      edges.push({
        id: `e-${sourceNodeId}-${gw.gatewayId}`,
        source: sourceNodeId,
        target: gw.gatewayId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: gw.type === 'xor' ? '#d97706' : '#2563eb', strokeWidth: 1.5 },
      });

      // Connect gateway → each target card
      for (const tid of gw.targetStepIds) {
        const targetNodeId = nodes.find(
          (n) => n.id === tid || n.id.includes(tid)
        )?.id ?? nodes[nodes.length - 1].id;
        edges.push({
          id: `e-${gw.gatewayId}-${tid}`,
          source: gw.gatewayId,
          target: targetNodeId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: gw.type === 'xor' ? '#d97706' : '#2563eb', strokeWidth: 1.5 },
          label: gw.condition,
          labelStyle: { fontSize: 10, fill: '#6b7280' },
          labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
        });
      }

      // Loop edge: if hasLoop, add dashed edge back to loop target
      if (gw.hasLoop && gw.loopTargetStepId) {
        const loopTargetNode = nodes.find(
          (n) => n.id === gw.loopTargetStepId || n.id.includes(gw.loopTargetStepId!)
        );
        if (loopTargetNode) {
          edges.push({
            id: `loop-${gw.gatewayId}-${gw.loopTargetStepId}`,
            source: gw.gatewayId,
            target: loopTargetNode.id,
            type: 'loopEdge',
            markerEnd: { type: MarkerType.ArrowClosed },
            data: { isLoop: true, loopLabel: '↩ 循环', condition: gw.condition } as LoopEdgeData,
          });
        }
      }
    }

    // Re-sort nodes by Y position for clean vertical layout
    nodes.sort((a, b) => a.position.y - b.position.y);
  }

  return { nodes, edges };
}

// ==================== toggle helper ====================

function toggleChildInData(
  children: CardTreeNodeData['children'],
  childId: string,
  checked: boolean
): CardTreeNodeData['children'] {
  if (!children) return [];
  return children.map((c) => {
    if (c.id === childId) return { ...c, checked };
    if (c.children && c.children.length > 0) {
      return { ...c, children: toggleChildInData(c.children, childId, checked) };
    }
    return c;
  });
}

// ==================== Internal Renderer (needs ReactFlow context) ====================

interface InternalRendererProps extends Omit<CardTreeRendererProps, 'className'> {
  className?: string;
}

function InternalRenderer({
  data,
  extraEdges = [],
  edgeTypes,
  flowGateways = [],
  showMinimap = true,
  fitView = true,
  showControls = true,
  showBackground = true,
  readonly = false,
  expandedIds,
  onToggleExpand,
  onCheckboxToggle,
  onCardClick,
  onInit,
  className,
}: InternalRendererProps) {
  // E3: Drag state from canvasStore
  const draggedPositions = useCanvasStore((s) => s.draggedPositions);
  const draggedNodeId = useCanvasStore((s) => s.draggedNodeId);
  const startDrag = useCanvasStore((s) => s.startDrag);
  const endDrag = useCanvasStore((s) => s.endDrag);
  const updateDraggedPosition = useCanvasStore((s) => s.updateDraggedPosition);

  // E4: Track ReactFlow viewport for BoundedGroupOverlay positioning
  const [viewport, setViewport] = React.useState({ x: 0, y: 0, zoom: 1 });

  // E4: Extract viewport from ReactFlow instance on init
  const handleInit = React.useCallback((rf: { getViewport?: () => { x: number; y: number; zoom: number } }) => {
    if (typeof rf?.getViewport === 'function') {
      const vp = rf.getViewport();
      setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
    }
    onInit?.();
  }, [onInit]);

  // E4: Track viewport on move
  const handleMoveEnd = React.useCallback((_event: unknown, vp: { x: number; y: number; zoom: number }) => {
    setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom });
  }, []);

  // Merge custom edgeTypes with built-in loop edge type
  const mergedEdgeTypes = useMemo(
    () => ({ ...getEdgeTypes(), ...edgeTypes }),
    [edgeTypes]
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowGraph(data ?? null, expandedIds, extraEdges, flowGateways, draggedPositions),
    [data, expandedIds, extraEdges, flowGateways, draggedPositions]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // E3: Sync data changes + dragged positions
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildFlowGraph(
      data ?? null,
      expandedIds,
      extraEdges,
      flowGateways,
      draggedPositions
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, expandedIds, extraEdges, flowGateways, draggedPositions, setNodes, setEdges]);

  // E3: Drag event handlers
  const handleNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (readonly) return;
      startDrag(node.id);
    },
    [readonly, startDrag]
  );

  const handleNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (readonly) return;
      updateDraggedPosition(node.id, node.position);
    },
    [readonly, updateDraggedPosition]
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (readonly) return;
      endDrag(node.id, node.position);
    },
    [readonly, endDrag]
  );

  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onToggleExpand?.(node.id);
    },
    [onToggleExpand]
  );

  // Handle checkbox toggle
  const _handleCheckboxToggle = useCallback(
    (nodeId: string, childId: string, checked: boolean) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const cardData = n.data as unknown as CardTreeNodeData;
          const updatedChildren = toggleChildInData(cardData.children, childId, checked);
          return {
            ...n,
            data: { ...cardData, children: updatedChildren } as Node['data'],
          };
        })
      );
      onCheckboxToggle?.(nodeId, childId, checked);
    },
    [setNodes, onCheckboxToggle]
  );

  // Handle node click (for expand/collapse)
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onToggleExpand?.(node.id);
      onCardClick?.(node.id);
    },
    [onToggleExpand, onCardClick]
  );

  // Empty state
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div
        className={`${styles.empty} ${className ? ` ${className}` : ''}`}
        data-testid="cardtree-empty"
      >
        <span className={styles.emptyIcon}>📋</span>
        <p className={styles.emptyText}>暂无卡片数据</p>
        <p className={styles.emptySubtext}>开始分析需求后会自动生成卡片</p>
      </div>
    );
  }

  // E3: Add dragging class when actively dragging
  const containerClassName = [
    styles.container,
    draggedNodeId ? styles.isDragging : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClassName}
      data-testid="cardtree-renderer"
      data-dragging={!!draggedNodeId}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={getNodeTypes()}
        edgeTypes={mergedEdgeTypes}
        onNodesChange={readonly ? undefined : onNodesChange}
        onEdgesChange={readonly ? undefined : onEdgesChange}
        fitView={fitView}
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleToggleExpand}
        onNodeDragStart={readonly ? undefined : handleNodeDragStart}
        onNodeDrag={readonly ? undefined : handleNodeDrag}
        onNodeDragStop={readonly ? undefined : handleNodeDragStop}
        onInit={handleInit}
        onMoveEnd={handleMoveEnd}
      >
        {/* E4: BoundedGroupOverlay — SVG dashed rects for domain groupings */}
        <BoundedGroupOverlay
          nodes={nodes}
          pan={{ x: viewport.x, y: viewport.y }}
          zoom={viewport.zoom}
        />
        {showControls && <Controls className={styles.controls} />}
        {showMinimap && <MiniMap className={styles.minimap} />}
        {showBackground && (
          <Background variant={BackgroundVariant.Dots} color="#e2e8f0" gap={20} />
        )}
      </ReactFlow>
    </div>
  );
}

// ==================== Public Component ====================

/**
 * CardTreeRenderer — Visualizes cards in a vertical tree layout
 * Wrapped in ReactFlowProvider to provide ReactFlow context
 */
export function CardTreeRenderer(props: CardTreeRendererProps) {
  return (
    <ReactFlowProvider>
      <InternalRenderer {...props} />
    </ReactFlowProvider>
  );
}
