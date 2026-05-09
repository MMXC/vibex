/**
 * DDSFlow — React Flow Wrapper for DDS Canvas
 *
 * Wraps @xyflow/react with:
 * - ReactFlowProvider (required for useDDSCanvasFlow which uses useReactFlow)
 * - useDDSCanvasFlow hook for store → view sync
 * - CardRenderer as nodeType (via wrapper components)
 * - E1-U2/U3/U4: Group collapse toggle + badge + animation
 * - E2-U1: ConflictBubble integration
 * - E2-U3: data-conflict attribute on conflicted nodes
 */

'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  useOnViewportChange,
  type Node,
  type Edge,
  type Viewport,
  BackgroundVariant,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import { useDDSCanvasFlow } from '@/hooks/dds/useDDSCanvasFlow';
import { CardRenderer } from '@/components/dds/cards';
import type { DDSCard, ChapterType } from '@/types/dds';
import { ConflictBubble } from '@/components/canvas/ConflictBubble';
import { useConflictStore } from '@/lib/canvas/stores/conflictStore';
import styles from './DDSFlow.module.css';

// ==================== Node Type Wrappers ====================

type RFNodeProps = {
  id: string;
  data: Record<string, unknown> & { selected?: boolean; conflict?: boolean };
  dragHandle?: string;
  type?: string;
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

const nodeTypes: NodeTypes = {
  'user-story': UserStoryNode as unknown as NodeTypes[string],
  'bounded-context': BoundedContextNode as unknown as NodeTypes[string],
  'flow-step': FlowStepNode as unknown as NodeTypes[string],
} as const;

// ==================== Group Node Helpers ====================

/** 判断节点是否为 Group（可折叠的父节点） */
function isGroupNode(node: Node): boolean {
  const card = node.data as { type?: string; parentId?: string; children?: string[] };
  const type = card.type ?? node.type;
  return (
    (type === 'bounded-context' || type === 'user-story') &&
    !card.parentId &&
    (card.children?.length ?? 0) > 0
  );
}

// ==================== Collapse Overlay ====================

interface CollapseControl {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  childCount: number;
}

function GroupCollapseOverlay({
  controls,
  collapsedIds,
  onToggle,
}: {
  controls: CollapseControl[];
  collapsedIds: Set<string>;
  onToggle: (nodeId: string) => void;
}) {
  if (controls.length === 0) return null;
  return (
    <>
      {controls.map((ctrl) => {
        const collapsed = collapsedIds.has(ctrl.nodeId);
        return (
          <React.Fragment key={ctrl.nodeId}>
            <button
              data-testid="collapse-toggle"
              className={styles.collapseToggle}
              style={{ left: ctrl.x + 4, top: ctrl.y + 4 }}
              onClick={() => onToggle(ctrl.nodeId)}
              aria-label={collapsed ? '展开' : '折叠'}
              title={collapsed ? '展开' : '折叠'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {collapsed ? (
                  <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>

            {collapsed && (
              <div
                data-testid="collapsed-badge"
                className={styles.collapsedBadge}
                style={{ left: ctrl.x + ctrl.width - 16, top: ctrl.y + 4 }}
              >
                {ctrl.childCount}
              </div>
            )}

            {collapsed && (
              <div
                className={styles.collapsedOverlay}
                style={{
                  left: ctrl.x,
                  top: ctrl.y,
                  width: ctrl.width,
                  height: ctrl.height,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

// ==================== Props ====================

export interface DDSFlowProps {
  chapter: ChapterType;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSelectCard?: (cardId: string) => void;
  selectedCardIds?: string[];
}

// ==================== Inner component ====================

function DDSFlowInner({
  chapter,
  initialNodes,
  initialEdges,
  onSelectCard,
  selectedCardIds = [],
}: DDSFlowProps) {
  const { getNodes } = useReactFlow();

  const {
    rawNodes,
    nodes: visibleNodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useDDSCanvasFlow(chapter, initialNodes, initialEdges);

  // E1: collapse state
  const collapsedGroups = useDDSCanvasStore((s) => s.collapsedGroups);
  const toggleCollapse = useDDSCanvasStore((s) => s.toggleCollapse);

  // E2: conflict state — subscribe to conflictStore
  const activeConflict = useConflictStore((s) => s.activeConflict);
  const conflictedCardId = activeConflict?.nodeId ?? null;

  // Sync conflictedCardId to DDSCanvasStore (for E2-U2 integration with existing store)
  const syncConflict = useCallback(() => {
    useDDSCanvasStore.setState({ conflictedCardId });
  }, [conflictedCardId]);

  useEffect(() => {
    syncConflict();
  }, [syncConflict]);

  // Track viewport for overlay positioning
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  useOnViewportChange({
    onChange: (vp) => setViewport(vp),
  });

  // Compute Group node screen coordinates
  const groupControls = React.useMemo((): CollapseControl[] => {
    if (!viewport) return [];
    const allNodes = getNodes();
    const visIds = new Set(visibleNodes.map((n: Node) => n.id));

    return allNodes
      .filter((n: Node) => isGroupNode(n) && visIds.has(n.id))
      .map((n: Node) => {
        const card = n.data as { children?: string[] };
        const nodeWidth = n.width ?? 220;
        const nodeHeight = n.height ?? 80;
        const screenX = n.position.x * viewport.zoom + viewport.x;
        const screenY = n.position.y * viewport.zoom + viewport.y;
        const screenW = nodeWidth * viewport.zoom;
        const screenH = nodeHeight * viewport.zoom;
        const childCount = (card.children ?? []).length;

        return {
          nodeId: n.id,
          x: screenX,
          y: screenY,
          width: screenW,
          height: screenH,
          childCount,
        };
      });
  }, [getNodes, visibleNodes, viewport]);

  // Build flow nodes with selected + conflict state
  const selectedSet = new Set(selectedCardIds);
  const flowNodes = visibleNodes.map((node: Node) => ({
    ...node,
    data: {
      ...node.data,
      selected: selectedSet.has(node.id),
      // E2-U3: add conflict flag
      conflict: node.id === conflictedCardId,
    },
  }));

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onSelectCard) onSelectCard(node.id);
    },
    [onSelectCard]
  );

  const handleToggle = useCallback(
    (nodeId: string) => toggleCollapse(nodeId),
    [toggleCollapse]
  );

  return (
    <div className={styles.container}>
      {/* E2-U1: ConflictBubble — renders outside ReactFlow, shows dialog when conflict active */}
      <ConflictBubble />

      <ReactFlow
        nodes={flowNodes}
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

        {/* E1-U2/U3: Group collapse overlay */}
        <GroupCollapseOverlay
          controls={groupControls}
          collapsedIds={collapsedGroups}
          onToggle={handleToggle}
        />
      </ReactFlow>
    </div>
  );
}

// ==================== Public component ====================

export const DDSFlow = memo(function DDSFlow(props: DDSFlowProps) {
  return (
    <ReactFlowProvider>
      <DDSFlowInner {...props} />
    </ReactFlowProvider>
  );
});

export default DDSFlow;