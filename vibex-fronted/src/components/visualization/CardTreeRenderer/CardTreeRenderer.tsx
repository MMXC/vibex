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

// ==================== Layout Engine ====================

const CARD_WIDTH = 280;
const CARD_MARGIN_X = 60;

/**
 * Convert CardTreeVisualizationRaw into ReactFlow nodes + edges
 * with automatic vertical layout
 */
function buildFlowGraph(data: CardTreeVisualizationRaw | null): {
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
      x: index * (CARD_WIDTH + CARD_MARGIN_X),
      y: 0,
    },
    data: card,
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

// ==================== Public Component ====================

/**
 * CardTreeRenderer — Visualizes cards in a vertical tree layout
 */
export function CardTreeRenderer({
  data,
  showMinimap = true,
  fitView = true,
  showControls = true,
  showBackground = true,
  readonly = false,
  onCheckboxToggle,
  onCardClick,
  onInit,
  className,
}: CardTreeRendererProps) {
  // Build flow graph from data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowGraph(data ?? null),
    [data]
  );

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Sync data changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildFlowGraph(data ?? null);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, setNodes, setEdges]);

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

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onCardClick?.(node.id);
    },
    [onCardClick]
  );

  // Empty state
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className={`${styles.empty} ${className || ''}`} data-testid="cardtree-empty">
        <span className={styles.emptyIcon}>📋</span>
        <p className={styles.emptyText}>暂无卡片数据</p>
        <p className={styles.emptySubtext}>开始分析需求后会自动生成卡片</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`} data-testid="cardtree-renderer">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView={fitView}
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        onNodeClick={handleNodeClick}
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
