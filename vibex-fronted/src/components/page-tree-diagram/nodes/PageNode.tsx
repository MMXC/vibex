/**
 * PageNode - 页面节点
 * 蓝色样式，表示页面级别的节点
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';

interface PageNodeData extends Record<string, unknown> {
  label: string;
  icon: string;
  nodeType: string;
}

type PageNodeType = Node<PageNodeData, 'page'>;

 
function PageNodeComponent(props: NodeProps<PageNodeType>) {
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ReactFlow NodeProps generic limitation
  const { data, selected } = props as any as { data: PageNodeData; selected: boolean };
  return (
    <div className="page-node" style={{
      padding: '10px 16px',
      borderRadius: '8px',
      backgroundColor: '#e3f2fd',
      border: selected ? '2px solid #1976d2' : '1px solid #1976d2',
      minWidth: '80px',
      textAlign: 'center',
      boxShadow: selected ? '0 4px 12px rgba(25, 118, 210, 0.3)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#1976d2' }} />
      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{data.icon}</div>
      <div style={{ fontSize: '12px', fontWeight: 500, color: '#1565c0' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#1976d2' }} />
    </div>
  );
}

export const PageNode = memo(PageNodeComponent);
