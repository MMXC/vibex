/**
 * BoundedEdgeLayer — 限界上下文连线 SVG 渲染层
 *
 * Epic 3 F3.2
 *
 * 功能：
 * - 渲染 BoundedEdge[] 列表为 SVG 贝塞尔曲线
 * - 每种 BoundedEdgeType 对应不同颜色
 * - 使用 arrow marker 标记连线终点
 * - pointer-events: none 不阻挡节点交互
 * - 支持连线聚类（>20 条时自动聚类）
 *
 * 使用方式：
 *   <BoundedEdgeLayer
 *     edges={boundedEdges}
 *     nodeRects={boundedNodeRects}
 *     zoom={1}
 *     pan={{ x: 0, y: 0 }}
 *   />
 */
// @ts-nocheck


'use client';

import React, { memo, useMemo } from 'react';
import type { BoundedEdge, BoundedEdgeType, NodeRect } from '@/lib/canvas/types';
import { computeEdgePath } from '@/lib/canvas/utils/edgePath';
import { clusterBoundedEdges, type ClusteredItem } from '@/lib/canvas/utils/edgeCluster';
import styles from './BoundedEdgeLayer.module.css';

// Default node dimensions (matching CardTreeRenderer card size)
// NOTE: nodeRects are provided externally; these defaults are reserved for future use
const _DEFAULT_NODE_WIDTH = 240;
const _DEFAULT_NODE_HEIGHT = 200;

// =============================================================================
// Constants
// =============================================================================

const BOUNDED_EDGE_COLORS: Record<BoundedEdgeType, string> = {
  dependency: '#6366f1',  // indigo
  composition: '#8b5cf6', // violet
  association: '#94a3b8', // slate
};

// =============================================================================
// Arrow Marker
// =============================================================================

function ArrowMarker({ type }: { type: BoundedEdgeType }): React.ReactElement {
  const color = BOUNDED_EDGE_COLORS[type] ?? BOUNDED_EDGE_COLORS.dependency;
  const id = `bounded-arrow-${type}`;
  return (
    <marker
      id={id}
      markerWidth="8"
      markerHeight="8"
      refX="6"
      refY="3"
      orient="auto"
    >
      <path d="M0,0 L0,6 L8,3 z" fill={color} />
    </marker>
  );
}

// =============================================================================
// Path Computation
// =============================================================================

/** Compute bezier path between two node rects */
function computePath(from: NodeRect, to: NodeRect): string {
  return computeEdgePath(from, to);
}

// =============================================================================
// Single Edge Renderer
// =============================================================================

interface SingleBoundedEdgeProps {
  item: ClusteredItem<BoundedEdge> & { kind: 'edge' };
  nodeMap: Record<string, NodeRect>;
}

function SingleBoundedEdge({ item, nodeMap }: SingleBoundedEdgeProps): React.ReactElement | null {
  const { edge } = item;
  const fromRect = nodeMap[edge.from.groupId];
  const toRect = nodeMap[edge.to.groupId];
  if (!fromRect || !toRect) return null;

  const d = computePath(fromRect, toRect);
  const color = BOUNDED_EDGE_COLORS[edge.type] ?? BOUNDED_EDGE_COLORS.dependency;

  // Label midpoint
  const mx = (fromRect.x + fromRect.width / 2 + toRect.x + toRect.width / 2) / 2;
  const my = (fromRect.y + fromRect.height / 2 + toRect.y + toRect.height / 2) / 2;

  return (
    <g key={item.key} className={`${styles.edge} ${styles[edge.type]}`}>
      <path
        d={d}
        stroke={color}
        strokeWidth={2}
        fill="none"
        markerEnd={`url(#bounded-arrow-${edge.type})`}
      />
      {edge.label && (
        <g transform={`translate(${mx}, ${my - 8})`}>
          <rect
            x={-edge.label.length * 3.5 - 4}
            y={-8}
            width={edge.label.length * 7 + 8}
            height={16}
            fill="white"
            fillOpacity={0.85}
            rx={3}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize={10}
            fill={color}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight={500}
          >
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
}

// =============================================================================
// Cluster Edge Renderer
// =============================================================================

interface ClusterBoundedEdgeProps {
  item: ClusteredItem<BoundedEdge> & { kind: 'cluster' };
  nodeMap: Record<string, NodeRect>;
}

function ClusterBoundedEdge({ item, nodeMap }: ClusterBoundedEdgeProps): React.ReactElement | null {
  const { representative, label } = item;
  const fromRect = nodeMap[representative.from.groupId];
  const toRect = nodeMap[representative.to.groupId];
  if (!fromRect || !toRect) return null;

  const d = computePath(fromRect, toRect);
  const color = BOUNDED_EDGE_COLORS[representative.type] ?? BOUNDED_EDGE_COLORS.dependency;
  const mx = (fromRect.x + toRect.x) / 2;
  const my = (fromRect.y + toRect.y) / 2;

  return (
    <g key={`cluster-${item.groupKey}`} className={styles.cluster}>
      <path
        d={d}
        stroke={color}
        strokeWidth={3.5}
        fill="none"
        strokeOpacity={0.6}
        markerEnd={`url(#bounded-arrow-${representative.type})`}
      />
      <g transform={`translate(${mx}, ${my - 10})`}>
        <rect
          x={-label.length * 3 - 4}
          y={-8}
          width={label.length * 6 + 8}
          height={16}
          fill={color}
          fillOpacity={0.15}
          rx={3}
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.5}
        />
        <text
          x={0}
          y={4}
          textAnchor="middle"
          fontSize={10}
          fill={color}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight={600}
        >
          {label}
        </text>
      </g>
    </g>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface BoundedEdgeLayerProps {
  /** BoundedEdge 连线列表 */
  edges: BoundedEdge[];
  /** Node rectangles for positioning (nodeId → rect) */
  nodeRects: NodeRect[];
  /** Current zoom level */
  zoom?: number;
  /** Current pan offset */
  pan?: { x: number; y: number };
  /** CSS className */
  className?: string;
}

function BoundedEdgeLayerComponent({
  edges,
  nodeRects,
  zoom = 1,
  pan = { x: 0, y: 0 },
  className,
}: BoundedEdgeLayerProps): React.ReactElement | null {
  // Build node lookup map
  const nodeMap = useMemo(
    () => Object.fromEntries(nodeRects.map((n) => [n.id, n])),
    [nodeRects]
  );

  // Compute clustering
  const { items } = useMemo(() => clusterBoundedEdges(edges), [edges]);

  // SVG viewport dimensions
  const svgDimensions = useMemo(() => {
    if (nodeRects.length === 0) return { width: 2000, height: 2000 };
    let maxX = 0, maxY = 0;
    for (const rect of nodeRects) {
      maxX = Math.max(maxX, rect.x + rect.width + 100);
      maxY = Math.max(maxY, rect.y + rect.height + 100);
    }
    return { width: maxX, height: maxY };
  }, [nodeRects]);

  if (edges.length === 0) {
    return <></>;
  }

  return (
    <svg
      aria-hidden="true"
      className={`${styles.layer} ${className ?? ''}`}
      data-testid="connector-line"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 30,
      }}
    >
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        <defs>
          {/* Clip path */}
          <clipPath id="bounded-edge-clip">
            <rect
              x={-pan.x / zoom}
              y={-pan.y / zoom}
              width={svgDimensions.width / zoom + 200}
              height={svgDimensions.height / zoom + 200}
            />
          </clipPath>
          {/* Arrow markers per edge type */}
          {(Object.keys(BOUNDED_EDGE_COLORS) as BoundedEdgeType[]).map((type) => (
            <ArrowMarker key={type} type={type} />
          ))}
        </defs>

        <g clipPath="url(#bounded-edge-clip)">
          {items.map((item, _idx) => {
            if (item.kind === 'edge') {
              return <SingleBoundedEdge key={item.key} item={item} nodeMap={nodeMap} />;
            } else {
              return <ClusterBoundedEdge key={`cluster-${item.groupKey}`} item={item} nodeMap={nodeMap} />;
            }
          })}
        </g>
      </g>
    </svg>
  );
}

export const BoundedEdgeLayer = memo(BoundedEdgeLayerComponent);
