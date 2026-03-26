/**
 * LoopEdge — ReactFlow custom edge for loop/cycle paths in business flows
 *
 * Epic 2: vibex-three-trees-enhancement
 * Visual: Dashed line with curved path + loop label
 * - stroke-dasharray: "6,3" (dashed)
 * - stroke: #ef4444 (red to indicate loop)
 * - label: "循环" or custom condition text
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  type EdgeProps,
  Position,
} from '@xyflow/react';
import type { LoopEdgeData } from '@/lib/canvas/types';
import styles from './LoopEdge.module.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LoopEdge(props: EdgeProps<any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, markerEnd } = props as any as {
    id: string; sourceX: number; sourceY: number; targetX: number; targetY: number;
    sourcePosition: Position; targetPosition: Position;
    data: LoopEdgeData; selected: boolean; markerEnd: string;
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

  const loopLabel = data?.loopLabel ?? '↩ 循环';
  const condition = data?.condition;
  const isHighlighted = selected || hovered;

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      console.debug('[LoopEdge] clicked:', id);
    },
    [id]
  );

  // Curved path for loop back (go upward — source below target)
  const isBackward = targetY < sourceY;
  const strokeColor = isBackward ? '#ef4444' : '#f97316';
  const strokeDasharray = '6,3';

  return (
    <>
      {/* Invisible hit area for hover/click */}
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

      {/* Visible dashed loop edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isHighlighted ? strokeColor : strokeColor,
          strokeWidth: isHighlighted ? 2.5 : 2,
          strokeDasharray,
          filter: isHighlighted ? `drop-shadow(0 0 4px ${strokeColor})` : undefined,
          transition: 'filter 0.2s ease, stroke-width 0.2s ease',
        }}
      />

      {/* Loop label */}
      <EdgeLabelRenderer>
        <div
          className={styles.edgeLabel}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <span
            className={`${styles.loopBadge} ${isBackward ? styles.backward : styles.forward}`}
            title={condition ?? loopLabel}
          >
            {loopLabel}
          </span>
          {condition && (
            <span className={styles.conditionText}>{condition}</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default LoopEdge;
