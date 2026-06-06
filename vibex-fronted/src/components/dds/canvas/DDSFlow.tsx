/**
 * DDSFlow — ReactFlow Canvas for DDS Chapters
 * Epic 2b: ReactFlow集成
 * S58-E2: 桌面文件拖拽导入
 * S58-E3: 协作者 Cursor 同步完善
 * S65-E3: 画布视图个性化设置 — Background 读取 settingsStore
 *
 * Renders cards as ReactFlow nodes with animated edges.
 * Uses useDDSCanvasFlow hook for store ↔ view sync.
 * E2: Integrates useFileDrop for drag-drop file import.
 * E3: Integrates useCollaboration.broadcastCursor for cursor sync.
 * S65-E3: Integrates settingsStore for dynamic background/grid/zoom.
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
import { CanvasThumbnail } from './CanvasThumbnail';
import type { ChapterType, DDSCard } from '@/types/dds';
import styles from './DDSFlow.module.css';

// E2: File drag-drop imports
import { useFileDrop } from './useFileDrop';
import { DropOverlay } from './DropOverlay';
import { FileImportDialog } from './FileImportDialog';
// E3: Collaboration cursor broadcast
import { useCollaboration } from '@/hooks/useCollaboration';
import { broadcastActivity } from '@/lib/collaboration/wsActivityHandler';
import { screenToFlowPosition } from '@xyflow/react';
// S65-E3: Canvas view settings
import { useSettingsStore } from '@/stores/dds/settingsStore';
import type { GridVariant } from '@/stores/dds/settingsStore';

// ==================== Node Component ====================

interface FlowNodeData {
  card: DDSCard;
  chapter: ChapterType;
  /** P002-E2: Set to true when confirmationStore has a conflict entry for this node */
  isConflicted?: boolean;
}

function FlowNode({ data }: { data: FlowNodeData }) {
  return (
    <div className={`${styles.flowNode}${data.isConflicted ? ' ' + styles.conflictedNode : ''}`}>
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

  // E2: File drag-drop state
  const {
    isDragging,
    pendingFiles,
    setDragging,
    processDrop,
    confirmImport,
    reset,
    removeFile,
  } = useFileDrop();

  const { fitView, getViewport } = useReactFlow();

  // E3: Collaboration cursor broadcast
  const { broadcastCursor } = useCollaboration();

  // E2: Wrap onNodesChange to broadcast activity events
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      // Broadcast activity for add/remove operations
      for (const change of changes) {
        if (change.type === 'add' && change.node) {
          broadcastActivity({
            userId: 'local-user',
            userName: '我',
            type: 'add',
            nodeId: change.node.id,
            timestamp: Date.now(),
          });
        } else if (change.type === 'remove' && change.id) {
          broadcastActivity({
            userId: 'local-user',
            userName: '我',
            type: 'delete',
            nodeId: change.id,
            timestamp: Date.now(),
          });
        }
      }
      // Call original handler
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  // S65-E3: Canvas view settings
  const backgroundColor = useSettingsStore((s) => s.backgroundColor);
  const gridSize = useSettingsStore((s) => s.gridSize);
  const gridVariant = useSettingsStore((s) => s.gridVariant);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const defaultZoom = useSettingsStore((s) => s.defaultZoom);

  // Map store variant string to @xyflow/react BackgroundVariant
  const bgVariant = (() => {
    if (gridVariant === 'lines') return BackgroundVariant.Lines;
    if (gridVariant === 'cross') return BackgroundVariant.Cross;
    return BackgroundVariant.Dots;
  })();

  // Node click → onSelectCard
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onSelectCard) {
        onSelectCard(node.id);
      }
    },
    [onSelectCard]
  );

  // E3: Cursor broadcast on node hover (throttled inside broadcastCursor, 100ms)
  const handleNodeMouseMove = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const viewport = getViewport();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY }, viewport);
      broadcastCursor(flowPos.x, flowPos.y, node.id);
    },
    [getViewport, broadcastCursor]
  );

  // E2: Drag event handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault(); // Allow drop
      e.stopPropagation();
      if (!isDragging) {
        setDragging(true);
      }
    },
    [isDragging, setDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only hide if leaving the canvas entirely (relatedTarget is outside)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setDragging(false);
      }
    },
    [setDragging]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        await processDrop(e.dataTransfer.files);
      }
    },
    [setDragging, processDrop]
  );

  // Fit view on mount using defaultZoom
  React.useEffect(() => {
    fitView({ zoom: defaultZoom, padding: 0.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className={`${styles.flowCanvas} ${className ?? ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onNodeMouseMove={handleNodeMouseMove}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={readOnly ? null : 'Delete'}
          snapToGrid={snapToGrid}
          snapGrid={[gridSize, gridSize]}
          proOptions={{ hideAttribution: true }}
          // S71-E3: Limit node positions to canvas bounds for large canvas performance
          nodeExtent={[[-10000, -10000], [10000, 10000]]}
        >
          <Background
            variant={bgVariant}
            gap={gridSize}
            size={1}
            color="#e5e7eb"
            style={{ backgroundColor }}
          />
          <Controls />
          <MiniMap
            nodeColor={() => '#6366f1'}
            maskColor="rgba(249, 250, 251, 0.8)"
            style={{ border: '1px solid #e5e7eb' }}
          />
        </ReactFlow>
        <CanvasThumbnail threshold={50} />
      </div>

      {/* E2: Drop overlay */}
      <DropOverlay visible={isDragging} />

      {/* E2: Import preview dialog */}
      {pendingFiles.length > 0 && (
        <FileImportDialog
          files={pendingFiles}
          onConfirm={confirmImport}
          onCancel={reset}
          onRemoveFile={removeFile}
        />
      )}
    </>
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
