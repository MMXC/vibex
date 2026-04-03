/**
 * RelationshipConnector.tsx — 领域关系 SVG 连线
 *
 * 在上下文树卡片列表上叠加 SVG 贝塞尔曲线，表示领域间关系。
 * ADR-002: 前端推算关系
 *
 * Epic 1: S1.1
 */
// @ts-nocheck

'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { inferRelationships, getRelationshipStyle, type InferredRelationship } from '@/lib/canvas/utils/inferRelationships';
import type { BoundedContextNode } from '@/lib/canvas/types';
import styles from '../canvas.module.css';

interface RelationshipConnectorProps {
  /** 上下文节点列表 */
  nodes: BoundedContextNode[];
  /** 容器 ref（用于相对定位） */
  containerRef: React.RefObject<HTMLElement | null>;
}

const ARROW_MARKERS = [
  { id: 'arrowdependency', color: '#94a3b8' },
  { id: 'arrowaggregate', color: '#6366f1' },
  { id: 'arrowcalls', color: '#f59e0b' },
] as const;

export const RelationshipConnector = memo(function RelationshipConnector({
  nodes,
  containerRef,
}: RelationshipConnectorProps) {
  const [relationships, setRelationships] = useState<InferredRelationship[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setRelationships(inferRelationships(nodes));
  }, [nodes]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  /* eslint-disable react-hooks/refs -- 需要在 render 阶段查询 DOM 位置，推迟会导致布局抖动 */
  const nodePositions = React.useMemo(() => {
    const positions = new Map<string, DOMRect>();
    if (!containerRef.current) return positions;
    for (const node of nodes) {
      const el = containerRef.current.querySelector(`[data-node-id="${node.nodeId}"]`) as HTMLElement | null;
      if (el) positions.set(node.nodeId, el.getBoundingClientRect());
    }
    return positions;
    /* eslint-enable react-hooks/refs */
  }, [nodes, containerSize, containerRef]);

  if (relationships.length === 0 || nodePositions.size === 0) return null;

  /* eslint-disable react-hooks/refs -- 需要在 render 阶段获取容器位置以计算 SVG 偏移 */
  const containerRect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
  /* eslint-enable react-hooks/refs */

  return (
    <svg ref={svgRef} className={styles.relationshipSvg} width={containerSize.width} height={containerSize.height} aria-hidden="true">
      <defs>
        {ARROW_MARKERS.map(({ id, color }) => (
          <marker key={id} id={id} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill={color} />
          </marker>
        ))}
      </defs>
      {relationships.map((rel, idx) => {
        const sourceRect = nodePositions.get(rel.sourceId);
        const targetRect = nodePositions.get(rel.targetId);
        if (!sourceRect || !targetRect) return null;
        const x1 = sourceRect.left + sourceRect.width / 2 - containerRect.left;
        const y1 = sourceRect.bottom - containerRect.top;
        const x2 = targetRect.left + targetRect.width / 2 - containerRect.left;
        const y2 = targetRect.top - containerRect.top;
        const midY = (y1 + y2) / 2;
        const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
        const style = getRelationshipStyle(rel.type);
        return (
          <g key={`${rel.sourceId}-${rel.targetId}-${idx}`} className={styles.relationshipEdge}>
            <path d={path} fill="none" stroke={style.stroke} strokeWidth={style.strokeWidth} strokeDasharray={style.strokeDasharray} markerEnd={`url(#arrow${rel.type})`} />
            {rel.label && (
              <text x={(x1 + x2) / 2} y={midY - 4} className={styles.relationshipLabel} textAnchor="middle" fill={style.stroke}>
                {rel.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
});
