/**
 * DDSFlow — React Flow Wrapper for DDS Canvas
 * Epic 5: F22
 *
 * Wraps @xyflow/react with:
 * - ReactFlowProvider (required for useDDSCanvasFlow which uses useReactFlow)
 * - useDDSCanvasFlow hook for store → view sync
 * - CardRenderer as nodeType (via wrapper components)
 * - Dark theme + minimap
 */

'use client';

import React, { memo, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  BackgroundVariant,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDDSCanvasFlow } from '@/hooks/dds/useDDSCanvasFlow';
import { CardRenderer } from '@/components/dds/cards';
import type { DDSCard, ChapterType } from '@/types/dds';

// ==================== Node Type Wrappers ====================
// React Flow passes a Node object as props; CardRenderer expects { card: DDSCard }.
// Wrap CardRenderer to extract card from node.data.

type RFNodeProps = {
  id: string;
  data: Record<string, unknown> & { selected?: boolean };
  dragHandle?: string;
};

function UserStoryNode(props: RFNodeProps) {
  return <CardRenderer card={props.data as unknown as DDSCard} selected={props.data?.selected} />;
}

function BoundedContextNode(props: RFNodeProps) {
  return <CardRenderer card={props.data as unknown as DDSCard} selected={props.data?.selected} />;
}

function FlowStepNode(props: RFNodeProps) {
  return <CardRenderer card={props.data as unknown as DDSCard} selected={props.data?.selected} />;
}

// nodeTypes cast: wrapper components receive Node props, extract data for CardRenderer
const nodeTypes: NodeTypes = {
  'user-story': UserStoryNode as unknown as NodeTypes[string],
  'bounded-context': BoundedContextNode as unknown as NodeTypes[string],
  'flow-step': FlowStepNode as unknown as NodeTypes[string],
} as const;

// ==================== Props ====================

export interface DDSFlowProps {
  /** Chapter to render */
  chapter: ChapterType;
  /** Initial nodes (for SSR/hydration) */
  initialNodes?: Node[];
  /** Initial edges (for SSR/hydration) */
  initialEdges?: Edge[];
  /** Called when user selects a card */
  onSelectCard?: (cardId: string) => void;
  /** IDs of currently selected cards */
  selectedCardIds?: string[];
}

// ==================== Inner component (uses useDDSCanvasFlow which needs ReactFlowProvider) ====================

function DDSFlowInner({
  chapter,
  initialNodes,
  initialEdges,
  onSelectCard,
  selectedCardIds = [],
}: DDSFlowProps) {
  useReactFlow();

  const {
    nodes: rawNodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useDDSCanvasFlow(chapter, initialNodes, initialEdges);

  // Inject selected state into node data
  const selectedSet = new Set(selectedCardIds);
  const nodes = rawNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      selected: selectedSet.has(node.id),
    },
  }));

  // Handle node click → select card
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onSelectCard) {
        onSelectCard(node.id);
      }
    },
    [onSelectCard]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      style={{ background: 'transparent' }}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="rgba(255,255,255,0.06)"
      />
      <Controls
        showInteractive={false}
        style={{ bottom: 16, right: 16 }}
      />
      <MiniMap
        nodeColor="rgba(59,130,246,0.6)"
        maskColor="rgba(0,0,0,0.4)"
        style={{ bottom: 16, left: 16 }}
      />
    </ReactFlow>
  );
}

// ==================== Public component (provides ReactFlowProvider) ====================

export const DDSFlow = memo(function DDSFlow(props: DDSFlowProps) {
  return (
    <ReactFlowProvider>
      <DDSFlowInner {...props} />
    </ReactFlowProvider>
  );
});

export default DDSFlow;
