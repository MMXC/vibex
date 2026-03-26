/**
 * ComponentNode - 组件节点
 * 绿色样式，表示组件级别的节点
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface ComponentNodeData extends Record<string, unknown> {
  label: string;
  icon: string;
  nodeType: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ComponentNodeComponent(props: NodeProps<any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, selected } = props as any as { data: ComponentNodeData; selected: boolean };
  return (
    <div className="component-node" style={{
      padding: '8px 14px',
      borderRadius: '6px',
      backgroundColor: '#e8f5e9',
      border: selected ? '2px solid #388e3c' : '1px solid #388e3c',
      minWidth: '60px',
      textAlign: 'center',
      boxShadow: selected ? '0 4px 12px rgba(56, 142, 60, 0.3)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#388e3c' }} />
      <div style={{ fontSize: '14px', marginBottom: '2px' }}>{data.icon}</div>
      <div style={{ fontSize: '11px', fontWeight: 500, color: '#2e7d32' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#388e3c' }} />
    </div>
  );
}

export const ComponentNode = memo(ComponentNodeComponent);
