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
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  Position,
  EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CardTreeNode } from '../CardTreeNode/CardTreeNode';
import type { CardTreeVisualizationRaw, CardTreeNodeData } from '@/types/visualization';
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

const nodeTypes = {
  cardTreeNode: CardTreeNode,
};

// ==================== Layout Engine (Vertical) ====================

const CARD_HEIGHT = 200;
const CARD_MARGIN_Y = 60;
const CENTER_X = 400; // Center nodes horizontally in the viewport

/**
 * Convert CardTreeVisualizationRaw into ReactFlow nodes + edges
 * with automatic VERTICAL layout (cards stacked top-to-bottom).
 * Extra edges (e.g., relationship edges) are appended after the
 * default sequence edges — Epic 1.
 */
function buildFlowGraph(
  data: CardTreeVisualizationRaw | null,
  expandedIds?: Set<string>,
  extraEdges: Edge[] = []
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
    position: {
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
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowGraph(data ?? null, expandedIds, extraEdges),
    [data, expandedIds, extraEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync data changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildFlowGraph(data ?? null, expandedIds, extraEdges);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, expandedIds, extraEdges, setNodes, setEdges]);

  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onToggleExpand?.(node.id);
    },
    [onToggleExpand]
  );

  // Handle checkbox toggle
  const handleCheckboxToggle = useCallback(
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

  return (
    <div
      className={`${styles.container} ${className ? ` ${className}` : ''}`}
      data-testid="cardtree-renderer"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
        onInit={onInit}
      >
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
