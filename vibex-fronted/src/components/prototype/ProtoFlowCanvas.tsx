/**
 * ProtoFlowCanvas — React Flow Canvas for Drag-and-Drop Layout Editor
 *
 * Wraps @xyflow/react with:
 * - HTML5 drag-and-drop from ComponentPanel (onDragOver + onDrop)
 * - ProtoNode as the custom nodeType
 * - Zustand store integration for nodes / selection
 * - Node position persistence (onNodeDragStop)
 *
 * Epic1: E1-U2
 *
 * E01 ProtoPreview Realtime (2026-05-08):
 * - ProtoPreviewPanel overlay: shows selected node preview
 * - useShallow subscription to selectedNodeId
 * - 200ms debounced props update (debounce.ts)
 * - data-rebuild="false" on successful hot-update
 * - Unselected state shows placeholder
 */

'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { usePrototypeStore } from '@/stores/prototypeStore';
import { ProtoNode } from './ProtoNode';
import type { UIComponent } from '@/lib/prototypes/ui-schema';
import { ProtoPreviewPanel } from './ProtoPreviewPanel';
import styles from './ProtoFlowCanvas.module.css';

// ==================== Node Types ====================

const nodeTypes: NodeTypes = {
  protoNode: ProtoNode as unknown as NodeTypes[string],
};

// ==================== Props ====================

export interface ProtoFlowCanvasProps {
  className?: string;
}

// ==================== Inner component ====================

function ProtoFlowCanvasInner({ className = '' }: ProtoFlowCanvasProps) {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    addNode,
    addEdge,
    removeEdge,
    updateNodePosition,
    selectNode,
  } = usePrototypeStore();

  // Cast store nodes to Node for React Flow
  const storeNodesCasted = storeNodes as unknown as Node[];
  const storeEdgesCasted = storeEdges as unknown as import('@xyflow/react').Edge[];

  const [nodes, setNodes] = useNodesState(storeNodesCasted);
  const [edges, setEdges] = useEdgesState(storeEdgesCasted as import('@xyflow/react').Edge[]);

  // Sync store → local state for React Flow
  React.useEffect(() => {
    setNodes(storeNodesCasted);
  }, [storeNodes, setNodes, storeNodesCasted]);

  // E1-U3: Sync store edges → local state
  React.useEffect(() => {
    setEdges(storeEdgesCasted);
  }, [storeEdges, setEdges, storeEdgesCasted]);

  // ---- React Flow change handlers ----
  const onNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      // E1-U3: Sync deletions to store
      changes.forEach((change) => {
        if (change.type === 'remove') {
          removeEdge(change.id);
        }
      });
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges, removeEdge]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      addEdge(connection.source, connection.target);
    },
    [addEdge]
  );

  // ---- Position persistence ----
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  // ---- Node selection ----
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length === 1) {
        selectNode(selectedNodes[0]!.id);
      } else if (selectedNodes.length === 0) {
        selectNode(null);
      }
    },
    [selectNode]
  );

  // E2-AC1: Double-click to select node
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // E3-U3: Responsive container — apply width style based on breakpoint
  const breakpoint = usePrototypeStore((s) => s.breakpoint);
  const containerStyle: React.CSSProperties = {
    width: breakpoint,
    maxWidth: '100%',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
  };

  // ---- Drag-and-Drop from ComponentPanel ----
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const raw = event.dataTransfer.getData('application/json');
      if (!raw) return;

      let component: UIComponent;
      try {
        component = JSON.parse(raw) as UIComponent;
      } catch {
        return;
      }

      // Get drop position relative to the canvas viewport
      const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      addNode(component, position);
    },
    [addNode]
  );

  // ---- MiniMap node color ----
  const miniMapNodeColor = useCallback(() => '#6366f1', []);

  return (
    <div className={`${styles.canvasWrap} ${className}`} style={containerStyle}>
      {/* E01: ProtoPreview overlay panel */}
      <ProtoPreviewPanel />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        panOnDrag={[1, 2]}
        selectionOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        selectNodesOnDrag
        className={styles.reactFlow}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls
          className={styles.controls}
          showInteractive={false}
        />
        <MiniMap
          className={styles.miniMap}
          nodeColor={miniMapNodeColor}
          maskColor="rgba(0,0,0,0.6)"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Empty state hint */}
      {nodes.length === 0 && (
        <div className={styles.emptyHint} aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
            <path d="M12 8v4l3 3" />
          </svg>
          <p>从左侧拖拽组件到画布</p>
        </div>
      )}
    </div>
  );
}

// ==================== Export ====================

export function ProtoFlowCanvas(props: ProtoFlowCanvasProps) {
  return <ProtoFlowCanvasInner {...props} />;
}
