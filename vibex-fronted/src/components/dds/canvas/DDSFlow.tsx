/**
 * DDSFlow — ReactFlow Canvas for DDS Chapters
 * Epic 2b: ReactFlow集成
 *
 * Renders cards as ReactFlow nodes with animated edges.
 * Uses useDDSCanvasFlow hook for store ↔ view sync.
 *
 * @module components/dds/canvas/DDSFlow
 */

'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDDSCanvasFlow } from '@/hooks/dds/useDDSCanvasFlow';
import { CardRenderer } from '@/components/dds/cards/CardRenderer';
import type { ChapterType, DDSCard } from '@/types/dds';
import styles from './DDSFlow.module.css';

// ==================== Node Component ====================

interface FlowNodeData {
  card: DDSCard;
  chapter: ChapterType;
}

function FlowNode({ data }: { data: FlowNodeData }) {
  return (
    <div className={styles.flowNode}>
      <CardRenderer card={data.card} />
    </div>
  );
}

// ==================== Node Types ====================

const nodeTypes: NodeTypes = {
  requirement: FlowNode,
  context: FlowNode,
  flow: FlowNode,
};

// ==================== Props ====================

export interface DDSFlowProps {
  /** Chapter to render (requirement | context | flow) */
  chapter: ChapterType;
  /** Read-only mode (no editing) */
  readOnly?: boolean;
  /** Callback when a card is selected */
  onSelectCard?: (cardId: string) => void;
  /** Initial nodes (for SSR/hydration) */
  initialNodes?: Node[];
  /** Initial edges */
  initialEdges?: Edge[];
  className?: string;
}

// ==================== Inner Component (needs ReactFlowProvider) ====================

function DDSFlowInner({
  chapter,
  readOnly = false,
  onSelectCard,
  initialNodes,
  initialEdges,
  className,
}: DDSFlowProps) {
  // useDDSCanvasFlow manages nodes/edges state internally
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useDDSCanvasFlow(chapter, initialNodes, initialEdges);

  const { fitView } = useReactFlow();

  // Node click → onSelectCard
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onSelectCard) {
        onSelectCard(node.id);
      }
    },
    [onSelectCard]
  );

  // Fit view on mount
  React.useEffect(() => {
    fitView({ padding: 0.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`${styles.flowCanvas} ${className ?? ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={readOnly ? null : 'Delete'}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        <Controls />
        <MiniMap
          nodeColor={() => '#6366f1'}
          maskColor="rgba(249, 250, 251, 0.8)"
          style={{ border: '1px solid #e5e7eb' }}
        />
      </ReactFlow>
    </div>
  );
}

// ==================== Outer Component (provides ReactFlowProvider) ====================

export default function DDSFlow(props: DDSFlowProps) {
  return (
    <ReactFlowProvider>
      <DDSFlowInner {...props} />
    </ReactFlowProvider>
  );
}
