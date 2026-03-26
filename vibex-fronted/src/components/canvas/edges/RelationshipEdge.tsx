/**
 * RelationshipEdge — 自定义 ReactFlow 边组件
 *
 * Epic 1: vibex-three-trees-enhancement
 * Spec: docs/vibex-three-trees-enhancement-20260326/specs/context-tree-relationships.md
 *
 * 边的样式规则：
 * - dependency: 实线箭头 (#666, strokeWidth: 1)
 * - aggregate:  粗实线蓝色箭头 (#1976d2, strokeWidth: 2.5)
 * - calls:      虚线箭头 (stroke-dasharray: 5,3, #888)
 *
 * 交互：
 * - Hover: 高亮 + tooltip 显示关系类型
 * - Click: 触发 onRelationshipClick 回调（用于展开关系详情面板）
 */

'use client';

import React, { useState, useCallback } from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge, type EdgeProps, Position } from '@xyflow/react';
import type { ContextRelationship } from '@/lib/canvas/types';
import type { RelationshipEdgeFull } from '@/lib/canvas/types';
import styles from './RelationshipEdge.module.css';

export interface RelationshipEdgeData extends Record<string, unknown> {
  relationshipType: ContextRelationship['type'];
  label?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RelationshipEdge(props: EdgeProps<RelationshipEdgeFull>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, markerEnd } = props as any as {
    id: string; sourceX: number; sourceY: number; targetX: number; targetY: number;
    sourcePosition: Position; targetPosition: Position;
    data: RelationshipEdgeData; selected: boolean; markerEnd: string;
  };
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relType = data?.relationshipType ?? 'dependency';
  const label = data?.label;

  const isHighlighted = selected || hovered;

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      console.debug('[RelationshipEdge] clicked:', id, relType);
    },
    [id, relType]
  );

  const typeConfig: Record<string, { stroke: string; strokeWidth: number; dashArray?: string; markerColor: string; label: string }> = {
    dependency: { stroke: '#666', strokeWidth: 1, dashArray: undefined, markerColor: '#666', label: '依赖' },
    aggregate: { stroke: '#1976d2', strokeWidth: 2.5, dashArray: undefined, markerColor: '#1976d2', label: '聚合' },
    calls: { stroke: '#888', strokeWidth: 1.5, dashArray: '5,3', markerColor: '#888', label: '调用' },
  };

  const config = typeConfig[relType] ?? typeConfig.dependency;

  return (
    <>
      {/* Invisible wider path for easier click/hover targets */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
        className={styles.hitArea}
      />

      {/* Visible edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isHighlighted ? config.stroke : config.stroke,
          strokeWidth: isHighlighted ? config.strokeWidth + 1 : config.strokeWidth,
          strokeDasharray: config.dashArray,
          filter: isHighlighted ? `drop-shadow(0 0 4px ${config.stroke})` : undefined,
          transition: 'filter 0.2s ease, stroke-width 0.2s ease',
        }}
      />

      {/* Hover tooltip */}
      {hovered && !selected && (
        <g transform={`translate(${labelX}, ${labelY - 12})`}>
          <rect x={-32} y={-10} width={64} height={20} rx={4} className={styles.tooltipBg} />
          <text x={0} y={3} textAnchor="middle" className={styles.tooltipText}>
            {config.label}
          </text>
        </g>
      )}

      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className={styles.edgeLabel}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <span
              className={styles.edgeLabelBadge}
              style={{ borderColor: config.stroke, color: config.stroke }}
            >
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default RelationshipEdge;
