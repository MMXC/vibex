/**
 * SectionNode - 区块节点
 * 黄色样式，表示区块级别的节点
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface SectionNodeData {
  label: string;
  icon: string;
  nodeType: string;
}

function SectionNodeComponent({ data, selected }: NodeProps<SectionNodeData>) {
  const { label, icon } = data;
  
  return (
    <div className="section-node" style={{
      padding: '6px 12px',
      borderRadius: '4px',
      backgroundColor: '#fff3e0',
      border: selected ? '2px solid #f57c00' : '1px solid #f57c00',
      minWidth: '50px',
      textAlign: 'center',
      boxShadow: selected ? '0 4px 12px rgba(245, 124, 0, 0.3)' : 'none',
      transition: 'all 0.2s ease',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#f57c00' }} />
      <div style={{ fontSize: '12px', marginBottom: '2px' }}>{icon}</div>
      <div style={{ fontSize: '10px', fontWeight: 500, color: '#e65100' }}>{label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#f57c00' }} />
    </div>
  );
}

export const SectionNode = memo(SectionNodeComponent);
