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
 * - S44-P003-E3: node locking UI — 🔒 overlay + locked state via presenceStore
 * - S66-E2: 协作者冲突检测与通知 — nodeLocks Map 读取，金色边框 + toast 警告
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
import { useTouchGestures } from '@/hooks/useTouchGestures';
import '@xyflow/react/dist/style.css';

import { useDDSCanvasStore } from '@/stores/dds/DDSCanvasStore';
import { useDDSCanvasFlow } from '@/hooks/dds/useDDSCanvasFlow';
import { CardRenderer } from '@/components/dds/cards';
import type { DDSCard, ChapterType } from '@/types/dds';
import { ConflictBubble } from '@/components/canvas/ConflictBubble';
import { useConflictStore } from '@/lib/canvas/stores/conflictStore';
import { useMiniMapPanelStore, useMiniMapStore } from '@/lib/canvas/stores/miniMapStore';
import { useViewportBoundsStore } from '@/lib/canvas/stores/viewportBoundsStore';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { useNodeFocus } from '@/lib/collaboration/useNodeFocus';
import { useNodeLockedToast } from '@/components/dds/notifications/NodeLockedToast';
import { RemoteCursorsLayer } from './canvas-dashboard/RemoteCursorsLayer';
import { MiniMapPanel } from '@/components/dds/MiniMapPanel';
import { CommentThread } from '@/components/dds/comments/CommentThread';
import styles from './DDSFlow.module.css';

// ==================== Node Type Wrappers ====================
// S65-E2: Moved inside DDSFlowInner so useNodeFocus hook can be called
// for node mouseEnter/mouseLeave focus broadcast

type RFNodeProps = {
  id: string;
  data: Record<string, unknown> & { selected?: boolean; conflict?: boolean; locked?: boolean; lockedBy?: string };
  dragHandle?: string;
  type?: string;
  onNodeFocus?: (nodeId: string) => void;
  onNodeBlur?: (nodeId: string) => void;
};

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
  /** E5: when true, canvas switches to touch-optimized mode */
  touchMode?: boolean;
  /** E5 (Sprint77): effective DPR from DDSCanvasPage DPR capping */
  effectiveDPR?: number;
  /** S63-E1: called on pane mouse move with flow-space coordinates */
  onCursorMove?: (x: number, y: number) => void;
}

// ==================== Inner component ====================

function DDSFlowInner({
  chapter,
  initialNodes,
  initialEdges,
  onSelectCard,
  selectedCardIds = [],
  touchMode = false,
  effectiveDPR = 1,
  onCursorMove,
}: DDSFlowProps) {
  const reactFlow = useReactFlow();
  const { getNodes } = reactFlow;

  // S65-E2: Node focus broadcast — use useNodeFocus to manage one-at-a-time focus
  const { onNodeFocus, onNodeBlur } = useNodeFocus();

  // S65-E2: Node type components (defined inside to use hooks)
  // S65-E2: Read current user info from useAuthStore for focus broadcast
  function UserStoryNode(props: RFNodeProps) {
    return (
      <div
        onMouseEnter={() => props.onNodeFocus?.(props.id)}
        onMouseLeave={() => props.onNodeBlur?.(props.id)}
      >
        <CardRenderer card={props.data as unknown as DDSCard} selected={props.data?.selected} locked={props.data?.locked} lockedBy={props.data?.lockedBy} />
      </div>
    );
  }

  function BoundedContextNode(props: RFNodeProps) {
    return (
      <div
        onMouseEnter={() => props.onNodeFocus?.(props.id)}
        onMouseLeave={() => props.onNodeBlur?.(props.id)}
      >
        <CardRenderer card={props.data as unknown as DDSCard} selected={props.data?.selected} locked={props.data?.locked} lockedBy={props.data?.lockedBy} />
      </div>
    );
  }

  function FlowStepNode(props: RFNodeProps) {
    return (
      <div
        onMouseEnter={() => props.onNodeFocus?.(props.id)}
        onMouseLeave={() => props.onNodeBlur?.(props.id)}
      >
        <CardRenderer card={props.data as unknown as DDSCard} selected={props.data?.selected} locked={props.data?.locked} lockedBy={props.data?.lockedBy} />
      </div>
    );
  }

  const nodeTypes: NodeTypes = {
    'user-story': UserStoryNode as unknown as NodeTypes[string],
    'bounded-context': BoundedContextNode as unknown as NodeTypes[string],
    'flow-step': FlowStepNode as unknown as NodeTypes[string],
  } as const;

  // E5: Touch gesture recognition — handles pinch-to-zoom, pan, double-tap
  // Uses reactFlow.setViewport (via useReactFlow) and getNodes for gesture math
  const touchGestures = useTouchGestures({
    setViewport: reactFlow.setViewport,
    getZoom: () => reactFlow.getViewport().zoom,
    getViewport: () => reactFlow.getViewport(),
    getNodes,
    onNodeSelect: onSelectCard,
  });

  // S63-E1: Handle pane mouse move — convert screen → flow coords, broadcast
  const handlePaneMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onCursorMove) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      const flowPos = reactFlow.screenToFlowPosition({ x: screenX, y: screenY });
      onCursorMove(flowPos.x, flowPos.y);
    },
    [onCursorMove, reactFlow]
  );

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

  // S69-E4: Comment thread overlay state
  const [commentThreadNodeId, setCommentThreadNodeId] = useState<string | null>(null);
  const [commentThreadPosition, setCommentThreadPosition] = useState({ x: 0, y: 0 });

  useOnViewportChange({
    onChange: (vp) => {
      setViewport(vp);
      // P005-E3: sync viewport to miniMapStore for border rectangle
      useMiniMapStore.getState().setViewport(vp);
      // S43-P003-E3: sync to viewportBoundsStore for virtualization culling
      useViewportBoundsStore.getState().updateViewportBounds(vp);
    },
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

  // S66-E2: Read nodeLocks Map from presenceStore (replaces legacy lockedNodes Record)
  const selectedSet = new Set(selectedCardIds);
  const nodeLocks = usePresenceStore.getState().nodeLocks;
  const currentUserId = usePresenceStore.getState().currentUser?.id;
  const remoteUsers = usePresenceStore.getState().remoteUsers;
  const flowNodes = visibleNodes.map((node: Node) => {
    const nodeId = node.id;
    // S66-E2: Check if this node is locked by a REMOTE user (not self)
    const lockInfo = nodeLocks.get(nodeId);
    const isLockedByOther = lockInfo != null && lockInfo.userId !== currentUserId;
    const remoteUser = lockInfo ? remoteUsers.get(lockInfo.userId) : undefined;
    return {
      ...node,
      data: {
        ...node.data,
        selected: selectedSet.has(nodeId),
        // E2-U3: add conflict flag
        conflict: node.id === conflictedCardId,
        // S66-E2: lock state from nodeLocks Map
        locked: isLockedByOther,
        lockedBy: remoteUser?.name ?? lockInfo?.userName ?? undefined,
      },
      // S65-E2: pass focus/blur handlers to custom node types
      onNodeFocus,
      onNodeBlur,
    };
  });

  // S66-E2: Guard —阻止用户在锁定节点上执行操作
  const { showNodeLockedToast } = useNodeLockedToast();

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // S66-E2: 如果节点被其他人锁定，阻止选择并显示 toast
      const lockInfo = nodeLocks.get(node.id);
      if (lockInfo != null && lockInfo.userId !== currentUserId) {
        showNodeLockedToast(lockInfo.userName);
        return;
      }
      if (onSelectCard) onSelectCard(node.id);
    },
    [onSelectCard, nodeLocks, currentUserId, showNodeLockedToast]
  );

  // E5 (Sprint77): Debounce onNodesChange to reduce excessive DPR re-renders
  const handleNodesChangeDebounced = useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (changes: Parameters<typeof onNodesChange>[0]) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        onNodesChange(changes);
        timer = null;
      }, 100);
    };
  }, [onNodesChange]);

  // S66-E2: Block drag on locked nodes — intercept position change events
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      const positionChanges = changes.filter(
        (c) => c.type === 'position' && c.dragging === false
      );
      for (const change of positionChanges) {
        if (change.type === 'position') {
          const lockInfo = nodeLocks.get(change.id);
          if (lockInfo != null && lockInfo.userId !== currentUserId) {
            showNodeLockedToast(lockInfo.userName);
            return; // block the position change
          }
        }
      }
      // E5 (Sprint77): Debounce 100ms — use debounced handler for all changes
      handleNodesChangeDebounced(changes);
    },
    [handleNodesChangeDebounced, nodeLocks, currentUserId, showNodeLockedToast]
  );

  const handleToggle = useCallback(
    (nodeId: string) => toggleCollapse(nodeId),
    [toggleCollapse]
  );

  // S69-E4: Right-click context menu → "查看评论" → open CommentThread
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setCommentThreadNodeId(node.id);
      setCommentThreadPosition({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const handleCommentThreadClose = useCallback(() => {
    setCommentThreadNodeId(null);
  }, []);

  return (
    <div className={styles.container}>
      {/* E2-U1: ConflictBubble — renders outside ReactFlow, shows dialog when conflict active */}
      <ConflictBubble />

      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={nodeTypes}
        /* E5: In touch mode, useTouchGestures hook handles ALL gestures — disable ReactFlow built-in */
        nodesDraggable={!touchMode}
        nodesConnectable={!touchMode}
        elementsSelectable={true}
        /* E5: zoomOnPinch=false; useTouchGestures handles pinch+pan via setViewport */
        zoomOnPinch={false}
        {/* E5: Wire touch gesture handlers directly to ReactFlow root element */}
        onTouchStart={touchGestures.onTouchStart}
        onPointerDown={touchGestures.onPointerDown}
        /* S63-E1: pane mouse move → flow coords → broadcast to collaborators */
        onPaneMouseMove={handlePaneMouseMove}
        /* S43-P003-E3: only render nodes visible in viewport for large canvas performance */
        onlyRenderVisibleElements={true}
        /* S49-E3: clamp node positions to configured extent — prevents infinite canvas drift */
        nodeExtent={useViewportBoundsStore((s) => s.nodeExtent)}
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
        {/* E5: Hide Controls on touch (mobile toolbar handles actions) */}
        {/*
        <Controls
          showInteractive={false}
          style={{ bottom: 16, right: 16 }}
        />
        */}
        {/* P005-E3: MiniMap — E5: default hidden on touch/mobile */}
        {!touchMode && <MiniMapPanel />}

        {/* E5 (Sprint77): DPR indicator — only shown when DPR is capped */}
        {effectiveDPR < (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1) && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(59,130,246,0.9)',
              color: '#fff',
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              zIndex: 10,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            DPR {effectiveDPR.toFixed(1)}
          </div>
        )}

        {/* E1-U2/U3: Group collapse overlay */}
        <GroupCollapseOverlay
          controls={groupControls}
          collapsedIds={collapsedGroups}
          onToggle={handleToggle}
        />

        {/* S63-E1: Remote cursors layer — renders all remote user cursors */}
        <RemoteCursorsLayer />
      </ReactFlow>

      {/* S69-E4: Comment thread overlay — right-click node → "查看评论" */}
      {commentThreadNodeId && (
        <CommentThread
          nodeId={commentThreadNodeId}
          position={commentThreadPosition}
          onClose={handleCommentThreadClose}
          currentUserId={currentUserId}
        />
      )}
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