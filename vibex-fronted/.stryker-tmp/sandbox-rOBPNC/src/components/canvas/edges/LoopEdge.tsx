/**
 * LoopEdge — ReactFlow custom edge for loop/cycle paths in business flows
 *
 * Epic 2: vibex-three-trees-enhancement
 * Visual: Dashed line with curved path + loop label
 */
// @ts-nocheck


'use client';

import React, { memo, useState, useCallback } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  type EdgeProps,
} from '@xyflow/react';
import type { LoopEdgeData } from '@/lib/canvas/types';
import type { LoopEdgeFull } from '@/lib/canvas/types';
import styles from './LoopEdge.module.css';

export const LoopEdge = memo(function LoopEdgeComponent(props: EdgeProps<LoopEdgeFull>) {
  const data = props.data as LoopEdgeData;
  const selected = props.selected;
  const markerEnd = props.markerEnd;

  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });

  const loopLabel = data?.loopLabel ?? '↩ 循环';
  const condition = data?.condition;
  const isHighlighted = selected || hovered;

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      console.debug('[LoopEdge] clicked:', props.id);
    },
    [props.id]
  );

  const isBackward = props.targetY < props.sourceY;
  const strokeColor = isBackward ? '#ef4444' : '#f97316';
  const strokeDasharray = '6,3';

  return (
    <>
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
      <BaseEdge
        id={props.id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: isHighlighted ? 2.5 : 2,
          strokeDasharray,
          filter: isHighlighted ? `drop-shadow(0 0 4px ${strokeColor})` : undefined,
          transition: 'filter 0.2s ease, stroke-width 0.2s ease',
        }}
      />
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
});

export default LoopEdge;
