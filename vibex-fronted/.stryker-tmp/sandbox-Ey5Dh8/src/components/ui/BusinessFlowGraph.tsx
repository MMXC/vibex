// @ts-nocheck
'use client';

import { useCallback, useMemo, useState } from 'react';
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
  NodeTypes,
  BackgroundVariant,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export interface FlowState {
  id: string;
  name: string;
  type: 'initial' | 'intermediate' | 'final';
  description?: string;
}

export interface FlowTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  event: string;
  condition?: string;
}

export interface BusinessFlowNodeData extends Record<string, unknown> {
  label: string;
  stateType: 'initial' | 'intermediate' | 'final';
  description?: string;
}

const stateTypeStyles = {
  initial: { background: '#4ade80', border: '#22c55e', label: '初始' },
  intermediate: { background: '#60a5fa', border: '#3b82f6', label: '中间' },
  final: { background: '#f472b6', border: '#ec4899', label: '最终' },
};

function StateNode({
  data,
  selected,
}: {
  data: BusinessFlowNodeData;
  selected: boolean;
}) {
  const safeData = data ?? { label: '', stateType: 'intermediate' as const };
  const style = stateTypeStyles[safeData.stateType] ?? stateTypeStyles.intermediate;

  return (
    <div
      style={{
        padding: '16px 24px',
        borderRadius: safeData.stateType === 'final' ? '50%' : '12px',
        background: style.background,
        border: `3px solid ${selected ? '#fff' : style.border}`,
        color: '#1a1a2e',
        minWidth: '120px',
        textAlign: 'center',
        boxShadow: selected
          ? '0 0 0 3px #fff, 0 6px 20px rgba(0,0,0,0.4)'
          : '0 4px 12px rgba(0,0,0,0.3)',
        transform: selected ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
        {safeData.label}
      </div>
      {safeData.description && (
        <div style={{ fontSize: '11px', opacity: 0.8 }}>{safeData.description}</div>
      )}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: style.border,
          color: '#fff',
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '10px',
          fontWeight: 600,
        }}
      >
        {style.label}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  state: StateNode,
};

export interface BusinessFlowGraphProps {
  states: FlowState[];
  transitions: FlowTransition[];
  onStatesChange?: (states: FlowState[]) => void;
  onTransitionsChange?: (transitions: FlowTransition[]) => void;
  readOnly?: boolean;
}

export default function BusinessFlowGraph({
  states = [],
  transitions = [],
  onStatesChange,
  onTransitionsChange,
  readOnly = false,
}: BusinessFlowGraphProps) {
  // Add null protection for inputs
  const safeStates = states ?? [];
  const safeTransitions = transitions ?? [];
  
  // Layout states in a horizontal or vertical flow
  const initialNodes: Node[] = useMemo(() => {
    // Group by flow position
    const initialStates = safeStates.filter((s) => s.type === 'initial');
    const intermediateStates = safeStates.filter((s) => s.type === 'intermediate');
    const finalStates = safeStates.filter((s) => s.type === 'final');

    const nodes: Node[] = [];
    let yOffset = 0;

    // Initial states
    initialStates.forEach((state, idx) => {
      nodes.push({
        id: state.id,
        type: 'state',
        position: { x: 100, y: yOffset + idx * 120 },
        data: {
          label: state.name,
          stateType: state.type,
          description: state.description,
        },
      });
    });
    yOffset += Math.max(initialStates.length, 1) * 120 + 50;

    // Intermediate states
    intermediateStates.forEach((state, idx) => {
      nodes.push({
        id: state.id,
        type: 'state',
        position: { x: 300, y: yOffset + idx * 120 },
        data: {
          label: state.name,
          stateType: state.type,
          description: state.description,
        },
      });
    });
    yOffset += Math.max(intermediateStates.length, 1) * 120 + 50;

    // Final states
    finalStates.forEach((state, idx) => {
      nodes.push({
        id: state.id,
        type: 'state',
        position: { x: 500, y: yOffset + idx * 120 },
        data: {
          label: state.name,
          stateType: state.type,
          description: state.description,
        },
      });
    });

    return nodes;
  }, [safeStates]);

  const initialEdges: Edge[] = useMemo(() => {
    return safeTransitions.map((trans) => ({
      id: trans.id,
      source: trans.fromStateId,
      target: trans.toStateId,
      label: trans.event + (trans.condition ? `\n[${trans.condition}]` : ''),
      type: 'default',
      animated: true,
      style: { stroke: '#a78bfa', strokeWidth: 2 },
      labelStyle: { fill: '#fff', fontSize: 12 },
      labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.9, rx: 4 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#a78bfa',
      },
    }));
  }, [safeTransitions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#a78bfa', strokeWidth: 2 },
            label: 'event',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
          },
          eds
        )
      );
    },
    [setEdges, readOnly]
  );

  // Update when data changes
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
        height: '600px',
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
            const type = node.data?.stateType as keyof typeof stateTypeStyles;
            return stateTypeStyles[type]?.background || '#60a5fa';
          }}
        />
        {safeStates.length === 0 && (
          <Panel position="top-center">
            <div style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
              暂无流程状态，请先生成业务流程
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
