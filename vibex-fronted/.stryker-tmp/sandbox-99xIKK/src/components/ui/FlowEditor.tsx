// @ts-nocheck
'use client';

import { useCallback, useState, useRef, ReactNode } from 'react';
import { ReactFlow, 
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Viewport,
  FitViewOptions,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styles from './FlowEditor.module.css';

export type FlowNode = Node;
export type FlowEdge = Edge;

export type FlowEditorProps = {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
  onNodesDragStop?: (node: Node) => void;
  onInit?: (instance: unknown) => void;
  fitView?: boolean;
  fitViewOptions?: { padding?: number; includeHiddenNodes?: boolean };
  minZoom?: number;
  maxZoom?: number;
  defaultViewport?: Viewport;
  readonly?: boolean;
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
  backgroundVariant?: BackgroundVariant;
  backgroundGap?: number;
  backgroundColor?: string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

function FlowEditorInner({
  initialNodes = [],
  initialEdges = [],
  nodeTypes,
  edgeTypes,
  onNodesChange: externalOnNodesChange,
  onEdgesChange: externalOnEdgesChange,
  onConnect: externalOnConnect,
  onNodeClick,
  onEdgeClick,
  onNodesDragStop,
  onInit,
  fitView = true,
  fitViewOptions,
  minZoom = 0.1,
  maxZoom = 2,
  defaultViewport,
  readonly = false,
  showControls = true,
  showMiniMap = false,
  showBackground = true,
  backgroundVariant = BackgroundVariant.Dots,
  backgroundGap = 20,
  backgroundColor = 'rgba(255,255,255,0.05)',
  children,
  className,
  style,
}: FlowEditorProps) {
  const [nodes, setNodes, internalOnNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, internalOnEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Internal node change handler that can be extended
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!readonly) {
        if (externalOnNodesChange) {
          externalOnNodesChange(changes);
        } else {
          internalOnNodesChange(changes);
        }
      }
    },
    [readonly, externalOnNodesChange, internalOnNodesChange]
  );

  // Internal edge change handler
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!readonly) {
        if (externalOnEdgesChange) {
          externalOnEdgesChange(changes);
        } else {
          internalOnEdgesChange(changes);
        }
      }
    },
    [readonly, externalOnEdgesChange, internalOnEdgesChange]
  );

  // Connection handler
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!readonly) {
        if (externalOnConnect) {
          externalOnConnect(connection);
        } else {
          setEdges((eds) =>
            addEdge(
              { ...connection, markerEnd: { type: MarkerType.ArrowClosed } },
              eds
            )
          );
        }
      }
    },
    [readonly, externalOnConnect, setEdges]
  );

  // Node click handler
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node);
      }
    },
    [onNodeClick]
  );

  // Edge click handler
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge);
      }
    },
    [onEdgeClick]
  );

  // Node drag stop handler
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodesDragStop) {
        onNodesDragStop(node);
      }
    },
    [onNodesDragStop]
  );

  // Initialize with fitView or default viewport
  const handleInit = useCallback(
    (instance: ReactFlowInstance) => {
      if (onInit) {
        onInit(instance);
      }
      if (defaultViewport) {
        instance.setViewport?.(defaultViewport);
      } else if (fitView) {
        setTimeout(() => instance.fitView?.(fitViewOptions), 100);
      }
    },
    [onInit, defaultViewport, fitView, fitViewOptions]
  );

  // Public methods exposed via ref
  const getNodes = useCallback(() => nodes, [nodes]);
  const getEdges = useCallback(() => edges, [edges]);
  const setNodesExternal = useCallback(
    (newNodes: Node[]) => setNodes(newNodes),
    [setNodes]
  );
  const setEdgesExternal = useCallback(
    (newEdges: Edge[]) => setEdges(newEdges),
    [setEdges]
  );

  return (
    <div
      ref={wrapperRef}
      className={`${styles.container} ${className || ''}`}
      style={style}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDragStop={handleNodeDragStop}
        onInit={handleInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={fitView}
        fitViewOptions={fitViewOptions}
        minZoom={minZoom}
        maxZoom={maxZoom}
        defaultViewport={defaultViewport}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable={!readonly}
        zoomOnScroll
        panOnScroll
        selectionOnDrag
        proOptions={{ hideAttribution: true }}
      >
        {showControls && <Controls className={styles.controls} />}
        {showMiniMap && (
          <MiniMap
            className={styles.miniMap}
            nodeColor={(node) => (node.style?.background as string) || '#999'}
            maskColor="rgba(0,0,0,0.3)"
          />
        )}
        {showBackground && (
          <Background
            variant={backgroundVariant}
            gap={backgroundGap}
            size={1}
            color={backgroundColor}
          />
        )}
        {children}
      </ReactFlow>
    </div>
  );
}

/**
 * FlowEditor - A flexible React Flow wrapper component
 *
 * Provides a ready-to-use flow editor with common features:
 * - Node and edge management
 * - Connection handling
 * - Minimap and controls
 * - Read-only mode
 * - Custom node and edge types
 *
 * @example
 * ```tsx
 * import { FlowEditor } from './components/ui'
 *
 * const nodes = [
 *   { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
 *   { id: '2', position: { x: 200, y: 0 }, data: { label: 'Node 2' } },
 * ]
 *
 * const edges = [
 *   { id: 'e1-2', source: '1', target: '2' },
 * ]
 *
 * <FlowEditor
 *   initialNodes={nodes}
 *   initialEdges={edges}
 *   onConnect={(connection) => console.log('Connected:', connection)}
 * />
 * ```
 */
export default function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}

// Utility functions for common operations
export const flowUtils = {
  /**
   * Create a new node with default styling
   */
  createNode: (
    id: string,
    position: { x: number; y: number },
    data: Record<string, any>,
    style?: React.CSSProperties
  ): Node => ({
    id,
    position,
    data,
    style: {
      background: '#3b82f6',
      color: '#fff',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '8px',
      padding: '10px 15px',
      fontSize: '14px',
      ...style,
    },
  }),

  /**
   * Create a new edge with default styling
   */
  createEdge: (
    id: string,
    source: string,
    target: string,
    label?: string,
    type?: string
  ): Edge => ({
    id,
    source,
    target,
    label,
    type: type || 'smoothstep',
    animated: type === 'step',
    style: { stroke: '#6b7280', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
  }),

  /**
   * Generate a unique ID
   */
  generateId: (prefix: string = 'node'): string =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Get connected edges for a node
   */
  getConnectedEdges: (nodeId: string, edges: Edge[]): Edge[] =>
    edges.filter((edge) => edge.source === nodeId || edge.target === nodeId),

  /**
   * Get node's connected nodes
   */
  getConnectedNodes: (nodeId: string, nodes: Node[], edges: Edge[]): Node[] => {
    const connectedEdgeIds = new Set(
      edges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .flatMap((edge) => [edge.source, edge.target])
    );
    return nodes.filter(
      (node) => connectedEdgeIds.has(node.id) && node.id !== nodeId
    );
  },
};
