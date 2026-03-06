'use client';

import { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

export interface BoundedContextNodeData {
  label: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
}

const contextTypeStyles = {
  core: { background: '#4ade80', border: '#22c55e', label: '核心' },
  supporting: { background: '#60a5fa', border: '#3b82f6', label: '支撑' },
  generic: { background: '#a78bfa', border: '#8b5cf6', label: '通用' },
  external: { background: '#f87171', border: '#ef4444', label: '外部' },
};

function ContextNode({
  data,
  selected,
}: {
  data: BoundedContextNodeData;
  selected: boolean;
}) {
  const style = contextTypeStyles[data.type] || contextTypeStyles.generic;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        background: style.background,
        border: `2px solid ${selected ? '#fff' : style.border}`,
        color: '#1a1a2e',
        minWidth: '150px',
        boxShadow: selected
          ? '0 0 0 2px #fff, 0 4px 12px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '12px', opacity: 0.8 }}>{data.description}</div>
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: style.border,
          color: '#fff',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
        }}
      >
        {style.label}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  context: ContextNode,
};

export interface BoundedContextGraphProps {
  contexts: Array<{
    id: string;
    name: string;
    description: string;
    type: 'core' | 'supporting' | 'generic' | 'external';
  }>;
  relationships: Array<{
    id: string;
    fromContextId: string;
    toContextId: string;
    type: 'upstream' | 'downstream' | 'symmetric';
    description: string;
  }>;
  onContextsChange?: (
    contexts: Array<{
      id: string;
      name: string;
      description: string;
      type: 'core' | 'supporting' | 'generic' | 'external';
      position: { x: number; y: number };
    }>
  ) => void;
  onRelationshipsChange?: (
    relationships: Array<{
      id: string;
      fromContextId: string;
      toContextId: string;
      type: 'upstream' | 'downstream' | 'symmetric';
      description: string;
    }>
  ) => void;
  readOnly?: boolean;
}

export default function BoundedContextGraph({
  contexts,
  relationships,
  onContextsChange,
  onRelationshipsChange,
  readOnly = false,
}: BoundedContextGraphProps) {
  // Convert contexts to nodes
  const initialNodes: Node[] = useMemo(() => {
    return contexts.map((ctx, index) => ({
      id: ctx.id,
      type: 'context',
      position: {
        x: (index % 3) * 250 + 50,
        y: Math.floor(index / 3) * 200 + 50,
      },
      data: {
        label: ctx.name,
        description: ctx.description,
        type: ctx.type,
      },
    }));
  }, [contexts]);

  // Convert relationships to edges
  const initialEdges: Edge[] = useMemo(() => {
    return relationships.map((rel) => ({
      id: rel.id,
      source: rel.fromContextId,
      target: rel.toContextId,
      label: rel.description,
      type: rel.type === 'symmetric' ? 'default' : 'default',
      animated: true,
      style: { stroke: '#60a5fa', strokeWidth: 2 },
      labelStyle: { fill: '#fff', fontSize: 12 },
      labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.8 },
    }));
  }, [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: '#60a5fa' } },
          eds
        )
      );
    },
    [setEdges, readOnly]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (readOnly || !onContextsChange) return;
      const updatedContexts = nodes.map((n) => ({
        id: n.id,
        name: n.data.label,
        description: n.data.description,
        type: n.data.type,
        position: n.position,
      }));
      onContextsChange(updatedContexts);
    },
    [nodes, onContextsChange, readOnly]
  );

  // Update nodes when contexts change
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div
      style={{
        width: '100%',
        height: '500px',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.1)"
        />
        <Controls style={{ background: '#1e1e2e', borderRadius: '8px' }} />
        <MiniMap
          style={{ background: '#1e1e2e', borderRadius: '8px' }}
          nodeColor={(node) => {
            const type = node.data?.type as keyof typeof contextTypeStyles;
            return contextTypeStyles[type]?.background || '#a78bfa';
          }}
        />
        {contexts.length === 0 && (
          <Panel position="top-center">
            <div style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
              暂无限界上下文，请先输入需求
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
