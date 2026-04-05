import { memo } from 'react';
import styles from './FlowNodes.module.css';
import type { NodeProps, Position } from '@xyflow/react';
import dynamic from 'next/dynamic';

// Handle 是组件，动态导入
const Handle = dynamic(
  () => import('@xyflow/react').then((mod) => mod.Handle),
  { ssr: false }
);
/**
 * Node data structure
 */
export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  status?: 'success' | 'error' | 'running' | 'pending';
  condition?: string;
  branches?: { id: string; label: string }[];
  [key: string]: unknown;
}

/**
 * Node type definitions
 */
export type FlowNodeType = 'start' | 'end' | 'process' | 'decision';

/** Helper to get data from props */
function getFlowData(props: NodeProps<any>) {
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ReactFlow NodeProps generic limitation
  const { data, selected } = props as any as { data: FlowNodeData; selected: boolean };
  return { data, selected };
}

/**
 * Start Node - Entry point of the flow
 * Has one output handle, no input handle
 */
export const StartNode = memo(function StartNode(props: NodeProps<any>) {
  const { data, selected } = getFlowData(props);
  return (
    <div className={`${styles.node} ${styles.startNode} ${selected ? styles.selected : ''}`}>
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>▶</span>
        <span className={styles.nodeLabel}>{data.label}</span>
      </div>
      {data.description && <div className={styles.nodeDescription}>{data.description}</div>}
      <Handle type="source" position={"bottom" as Position} className={styles.handle} />
    </div>
  );
});

/**
 * End Node - Exit point of the flow
 * Has one input handle, no output handle
 */
export const EndNode = memo(function EndNode(props: NodeProps<any>) {
  const { data, selected } = getFlowData(props);
  return (
    <div className={`${styles.node} ${styles.endNode} ${selected ? styles.selected : ''}`}>
      <Handle type="target" position={"top" as Position} className={styles.handle} />
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>■</span>
        <span className={styles.nodeLabel}>{data.label}</span>
      </div>
      {data.description && <div className={styles.nodeDescription}>{data.description}</div>}
      {data.status && <div className={`${styles.statusBadge} ${styles[data.status]}`}>{data.status}</div>}
    </div>
  );
});

/**
 * Process Node - Standard processing node
 * Has one input and one output handle
 */
export const ProcessNode = memo(function ProcessNode(props: NodeProps<any>) {
  const { data, selected } = getFlowData(props);
  return (
    <div className={`${styles.node} ${styles.processNode} ${selected ? styles.selected : ''}`}>
      <Handle type="target" position={"top" as Position} className={styles.handle} />
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>⚙</span>
        <span className={styles.nodeLabel}>{data.label}</span>
      </div>
      {data.description && <div className={styles.nodeDescription}>{data.description}</div>}
      <Handle type="source" position={"bottom" as Position} className={styles.handle} />
    </div>
  );
});

/**
 * Decision Node - Branching node with multiple outputs
 * Has one input and multiple output handles (for branches)
 */
export const DecisionNode = memo(function DecisionNode(props: NodeProps<any>) {
  const { data, selected } = getFlowData(props);
  const branches = data.branches || [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
  ];

  return (
    <div className={`${styles.node} ${styles.decisionNode} ${selected ? styles.selected : ''}`}>
      <Handle type="target" position={"top" as Position} className={styles.handle} />
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>◇</span>
        <span className={styles.nodeLabel}>{data.label}</span>
      </div>
      {data.description && <div className={styles.nodeDescription}>{data.description}</div>}
      {data.condition && <div className={styles.conditionBadge}>{data.condition}</div>}
      <div className={styles.branchHandles}>
        {branches.map((branch: { id: string; label: string }, index: number) => (
          <Handle
            key={branch.id}
            type="source"
            position={"bottom" as Position}
            id={branch.id}
            className={`${styles.handle} ${styles.branchHandle}`}
            style={{ left: `${((index + 1) / (branches.length + 1)) * 100}%` }}
          />
        ))}
      </div>
      {branches.length > 0 && (
        <div className={styles.branchLabels}>
          {branches.map((branch: { id: string; label: string }, index: number) => (
            <span key={branch.id} className={styles.branchLabel} style={{ left: `${((index + 1) / (branches.length + 1)) * 100}%` }}>
              {branch.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * Node type map for React Flow
 */
export const nodeTypes: Record<FlowNodeType, any> = {
  start: StartNode,
  end: EndNode,
  process: ProcessNode,
  decision: DecisionNode,
};

/**
 * Create a flow node with specified type
 */
export function createFlowNode(
  id: string,
  type: FlowNodeType,
  position: { x: number; y: number },
  data: Partial<FlowNodeData> = {}
): {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
} {
  const baseData: FlowNodeData = {
    label: data.label || `Node ${id}`,
    description: data.description,
    status: data.status,
    condition: data.condition,
    branches: data.branches,
  };

  return {
    id,
    type,
    position,
    data: baseData,
  };
}

/**
 * Node type colors for styling
 */
export const nodeTypeColors: Record<FlowNodeType, string> = {
  start: '#22c55e', // Green
  end: '#ef4444', // Red
  process: '#3b82f6', // Blue
  decision: '#f59e0b', // Amber
};

/**
 * Default node configurations
 */
export const defaultNodeConfigs: Record<FlowNodeType, Partial<FlowNodeData>> = {
  start: {
    label: 'Start',
    description: 'Flow entry point',
  },
  end: {
    label: 'End',
    description: 'Flow exit point',
    status: 'pending',
  },
  process: {
    label: 'Process',
    description: 'Processing step',
  },
  decision: {
    label: 'Decision',
    description: 'Conditional branch',
    condition: '',
    branches: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
  },
};

/**
 * Default export for FlowNodes module
 */
export default {
  StartNode,
  EndNode,
  ProcessNode,
  DecisionNode,
  nodeTypes,
  createFlowNode,
  nodeTypeColors,
  defaultNodeConfigs,
};
