/**
 * DDSFlow — React Flow Wrapper for DDS Canvas
 *
 * Wraps @xyflow/react with:
 * - ReactFlowProvider (required for useDDSCanvasFlow which uses useReactFlow)
 * - useDDSCanvasFlow hook for store → view sync
 * - CardRenderer as nodeType (via wrapper components)
 * - E1-U2: Group collapse toggle buttons
 * - E1-U3: Collapsed visual (dashed border + badge)
 * - E1-U4: Expand animation CSS
 * - E2-U1: ConflictBubble integration
 */

'use client';

import React, { memo, useCallback, useRef, useState } from 'react';
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
import styles from './DDSFlow.module.css';

// ==================== Node Type Wrappers ====================
// React Flow passes a Node object as props; CardRenderer expects { card: DDSCard }.
// Wrap CardRenderer to extract card from node.data.

type RFNodeProps = {
  id: string;
  data: Record<string, unknown> & { selected?: boolean };
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

// nodeTypes cast: wrapper components receive Node props, extract data for CardRenderer
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
  // Group = 有子节点的父级卡片（BC 或有 children 的 user-story）
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

interface GroupCollapseOverlayProps {
  controls: CollapseControl[];
  collapsedIds: Set<string>;
  onToggle: (nodeId: string) => void;
}

function GroupCollapseOverlay({ controls, collapsedIds, onToggle }: GroupCollapseOverlayProps) {
  if (controls.length === 0) return null;
  return (
    <>
      {controls.map((ctrl) => {
        const collapsed = collapsedIds.has(ctrl.nodeId);
        return (
          <React.Fragment key={ctrl.nodeId}>
            {/* Collapse toggle button — top-left */}
            <button
              data-testid="collapse-toggle"
              className={styles.collapseToggle}
              style={{ left: ctrl.x + 4, top: ctrl.y + 4 }}
              onClick={() => onToggle(ctrl.nodeId)}
              aria-label={collapsed ? '展开' : '折叠'}
              title={collapsed ? '展开' : '折叠'}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {collapsed ? (
                  <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>

            {/* Collapsed badge — top-right */}
            {collapsed && (
              <div
                data-testid="collapsed-badge"
                className={styles.collapsedBadge}
                style={{ left: ctrl.x + ctrl.width - 16, top: ctrl.y + 4 }}
              >
                {ctrl.childCount}
              </div>
            )}

            {/* Collapsed overlay — dashed border mask */}
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
  const { getNodes } = useReactFlow();

  const {
    rawNodes,
    nodes: visibleNodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useDDSCanvasFlow(chapter, initialNodes, initialEdges);

  // E1-U1: 获取 collapsedGroups 状态
  const collapsedGroups = useDDSCanvasStore((s) => s.collapsedGroups);
  const toggleCollapse = useDDSCanvasStore((s) => s.toggleCollapse);

  // 跟踪 viewport 变化
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  useOnViewportChange({
    onChange: (vp) => setViewport(vp),
  });

  // 计算 Group 节点的屏幕坐标 + 尺寸（用于渲染 overlay）
  const groupControls = React.useMemo((): CollapseControl[] => {
    if (!viewport) return [];
    const allNodes = getNodes();
    const visIds = new Set(visibleNodes.map((n: Node) => n.id));

    return allNodes
      .filter((n: Node) => isGroupNode(n) && visIds.has(n.id))
      .map((n: Node) => {
        const card = n.data as { children?: string[] };
        // 屏幕坐标 = 节点 position * zoom + viewport offset
        // React Flow 默认节点宽度约 220px，高度约 80px
        const nodeWidth = (n.width ?? 220);
        const nodeHeight = (n.height ?? 80);
        const screenX = n.position.x * viewport.zoom + viewport.x;
        const screenY = n.position.y * viewport.zoom + viewport.y;
        const screenW = nodeWidth * viewport.zoom;
        const screenH = nodeHeight * viewport.zoom;

        // 被折叠时，统计实际存在的子节点数
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

  // Inject selected state into node data
  const selectedSet = new Set(selectedCardIds);
  const flowNodes = visibleNodes.map((node: Node) => ({
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

  const handleToggle = useCallback(
    (nodeId: string) => {
      toggleCollapse(nodeId);
    },
    [toggleCollapse]
  );

  return (
    <div className={styles.container}>
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

        {/* E1-U2/U3: Group collapse overlay（渲染在 ReactFlow 内部，使用相对坐标） */}
        <GroupCollapseOverlay
          controls={groupControls}
          collapsedIds={collapsedGroups}
          onToggle={handleToggle}
        />
      </ReactFlow>
    </div>
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