/**
 * GatewayNode — ReactFlow custom node for XOR/OR branching gateways
 *
 * Epic 2: vibex-three-trees-enhancement
 * Visual: Diamond shape (rotated square)
 * - XOR: golden yellow border + ✕ symbol
 * - OR:  blue border + + symbol
 */
// @ts-nocheck


'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { GatewayNodeData, GatewayNodeFull } from '@/lib/canvas/types';
import styles from './GatewayNode.module.css';

const GATEWAY_SIZE = 60;

/** Gateway symbol for each type */
function GatewaySymbol({ type }: { type: GatewayNodeData['gatewayType'] }) {
  if (type === 'xor') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" className={styles.symbol} aria-label="XOR gateway">
        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
        <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className={styles.symbol} aria-label="OR gateway">
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function GatewayNodeComponent(props: NodeProps<GatewayNodeFull>) {
  const data = props.data as GatewayNodeData;
  const selected = props.selected;

  const gatewayType = data.gatewayType ?? 'xor';
  const label = data.label;
  const condition = data.condition;

  const isXor = gatewayType === 'xor';
  const colorClass = isXor ? styles.gatewayXor : styles.gatewayOr;
  const borderColor = isXor ? '#d97706' : '#2563eb';
  const bgColor = isXor ? '#fef3c7' : '#dbeafe';

  const s = GATEWAY_SIZE / 2;
  const diamondPath = `M 0 ${-s} L ${s} 0 L 0 ${s} L ${-s} 0 Z`;

  return (
    <div
      className={`${styles.gatewayNode} ${colorClass} ${selected ? styles.selected : ''}`}
      data-gateway-type={gatewayType}
      data-selected={selected}
      title={condition ?? label ?? gatewayType.toUpperCase()}
    >
      <svg
        width={GATEWAY_SIZE}
        height={GATEWAY_SIZE}
        viewBox={`${-s} ${-s} ${GATEWAY_SIZE} ${GATEWAY_SIZE}`}
        className={styles.diamondSvg}
      >
        <path
          d={diamondPath}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={selected ? 2.5 : 1.5}
        />
        <foreignObject x={-9} y={-9} width={18} height={18}>
          <GatewaySymbol type={gatewayType} />
        </foreignObject>
      </svg>

      {label && <div className={styles.gatewayLabel}>{label}</div>}

      {condition && (
        <div className={styles.conditionBadge} title={condition}>
          {condition.length > 30 ? condition.slice(0, 30) + '…' : condition}
        </div>
      )}

      <Handle type="target" position={Position.Top} className={styles.handle} style={{ background: borderColor }} />
      <Handle type="source" position={Position.Bottom} className={styles.handle} style={{ background: borderColor }} />
      <Handle type="target" position={Position.Left} className={styles.handle} style={{ background: borderColor }} />
      <Handle type="source" position={Position.Right} className={styles.handle} style={{ background: borderColor }} />
    </div>
  );
}

export const GatewayNode = memo(GatewayNodeComponent);
export default GatewayNode;
