/**
 * FlowEdgeLayer — SVG Layer for Flow Node Edges
 *
 * Epic 3 (Phase2b): F3.3 — 流程节点连线
 *
 * Renders edges between flow nodes with three visual styles:
 * - sequence: solid line with arrow
 * - branch: dashed line with arrow
 * - loop: curved loop path with ↩ arrow
 *
 * Supports clustering via MAX_EDGES_VISIBLE (20) — see edgeCluster.ts
 *
 * Architecture:
 * - Absolutely positioned SVG overlay (pointer-events: none)
 * - z-index: 40 (above BoundedEdgeLayer at z-index 30)
 * - Independent from ReactFlow's built-in edge rendering
 * - Used when flow edges need to be shown as a separate visualization layer
 *
 * Usage:
 *   <FlowEdgeLayer
 *     edges={flowEdges}
 *     nodeRects={flowNodeRects}
 *     zoom={viewport.zoom}
 *     pan={{ x: viewport.x, y: viewport.y }}
 *   />
 *
 * Constraint (AGENTS.md红线): pointer-events: none on SVG root
 */
// @ts-nocheck


'use client';

import React, { useMemo, memo } from 'react';
import type { FlowEdge, FlowEdgeType, NodeRect } from '@/lib/canvas/types';
import {
  clusterFlowEdges,
  type ClusterEdgeItem,
  type SingleEdgeItem,
} from '@/lib/canvas/utils/edgeCluster';

// =============================================================================
// Constants
// =============================================================================

const SEQUENCE_STROKE = '#3b82f6';   // blue — solid
const BRANCH_STROKE = '#f59e0b';     // amber — dashed
const LOOP_STROKE = '#8b5cf6';       // violet — loop
const DEFAULT_STROKE_WIDTH = 1.5;
const CLUSTER_STROKE_WIDTH = 3;
const ARROW_SIZE = 7;

// =============================================================================
// Style Mapping
// =============================================================================

const FLOW_EDGE_STYLES: Record<FlowEdgeType, { stroke: string; strokeDasharray: string; strokeWidth: number }> = {
  sequence: { stroke: SEQUENCE_STROKE, strokeDasharray: '0,0', strokeWidth: DEFAULT_STROKE_WIDTH },
  branch:   { stroke: BRANCH_STROKE,  strokeDasharray: '5,3', strokeWidth: DEFAULT_STROKE_WIDTH },
  loop:     { stroke: LOOP_STROKE,   strokeDasharray: '0,0', strokeWidth: DEFAULT_STROKE_WIDTH },
};

function getEdgeStyle(type: FlowEdgeType) {
  return FLOW_EDGE_STYLES[type] ?? FLOW_EDGE_STYLES.sequence;
}

// =============================================================================
// Path Computation
// =============================================================================

/** Standard bezier path between two node centers */
function computeStandardPath(from: NodeRect, to: NodeRect): string {
  const sx = from.x + from.width / 2;
  const sy = from.y + from.height / 2;
  const tx = to.x + to.width / 2;
  const ty = to.y + to.height / 2;

  const dx = Math.abs(tx - sx);
  const cp = Math.min(dx * 0.4, 60);

  return `M ${sx} ${sy} C ${sx + cp} ${sy}, ${tx - cp} ${ty}, ${tx} ${ty}`;
}

/**
 * Loop path — curves from bottom of source node back to top of target node.
 * Creates a visually distinct "loop back" look with a large bezier curve.
 */
function computeLoopPath(from: NodeRect, to: NodeRect): string {
  const sx = from.x + from.width / 2;
  const syBottom = from.y + from.height;
  const tx = to.x + to.width / 2;
  const tyTop = to.y;

  // Large control points to create a looping arc
  const cpOffsetY = Math.min(Math.abs(tyTop - syBottom) * 0.8, 80);

  return `M ${sx} ${syBottom} C ${sx + 50} ${syBottom + cpOffsetY}, ${tx - 50} ${tyTop - cpOffsetY}, ${tx} ${tyTop}`;
}

/**
 * Compute path based on edge type.
 */
function computeFlowEdgePath(from: NodeRect, to: NodeRect, type: FlowEdgeType): string {
  if (type === 'loop') {
    return computeLoopPath(from, to);
  }
  return computeStandardPath(from, to);
}

/**
 * Compute cluster bundle path (centroid to centroid).
 */
function computeClusterPath(from: NodeRect, to: NodeRect): string {
  const sx = from.x + from.width / 2;
  const sy = from.y + from.height / 2;
  const tx = to.x + to.width / 2;
  const ty = to.y + to.height / 2;

  const dx = Math.abs(tx - sx);
  const cp = Math.min(dx * 0.4, 60);

  return `M ${sx} ${sy} C ${sx + cp} ${sy}, ${tx - cp} ${ty}, ${tx} ${ty}`;
}

// =============================================================================
// Arrow Marker
// =============================================================================

function ArrowMarker({ stroke }: { stroke: string }): React.ReactElement {
  const id = `flow-arrow-${stroke.replace('#', '')}`;
  return (
    <marker
      id={id}
      markerWidth={ARROW_SIZE}
      markerHeight={ARROW_SIZE}
      refX={ARROW_SIZE - 1}
      refY={ARROW_SIZE / 2}
      orient="auto"
    >
      <path d={`M0,0 L0,${ARROW_SIZE} L${ARROW_SIZE},${ARROW_SIZE / 2} z`} fill={stroke} />
    </marker>
  );
}

// =============================================================================
// Single Edge Renderer
// =============================================================================

interface SingleFlowEdgeProps {
  item: SingleEdgeItem<FlowEdge>;
  nodeMap: Record<string, NodeRect>;
}

function SingleFlowEdge({ item, nodeMap }: SingleFlowEdgeProps): React.ReactElement | null {
  const { edge } = item;
  const from = nodeMap[edge.from];
  const to = nodeMap[edge.to];

  if (!from || !to) return null;

  const style = getEdgeStyle(edge.type);
  const d = computeFlowEdgePath(from, to, edge.type);

  return (
    <g key={edge.id} className={`flow-edge ${edge.type}`} data-edge-id={edge.id}>
      {/* Invisible wide hit area */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth={8}
        fill="none"
        style={{ pointerEvents: 'stroke' }}
      />
      {/* Visible edge */}
      <path
        d={d}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        fill="none"
        strokeLinecap="round"
        markerEnd={`url(#flow-arrow-${style.stroke.replace('#', '')})`}
        className="flow-edge-path"
      />
      {/* Branch/loop condition label */}
      {edge.label && (
        <text
          x={(from.x + from.width / 2 + to.x + to.width / 2) / 2}
          y={(from.y + from.height / 2 + to.y + to.height / 2) / 2 - 6}
          fill={style.stroke}
          fontSize={10}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          className="flow-edge-label"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

// =============================================================================
// Cluster Edge Renderer
// =============================================================================

interface ClusterFlowEdgeProps {
  item: ClusterEdgeItem<FlowEdge>;
  nodeMap: Record<string, NodeRect>;
}

function ClusterFlowEdge({ item, nodeMap }: ClusterFlowEdgeProps): React.ReactElement | null {
  const { representative, edges, label } = item;
  const from = nodeMap[representative.from];
  const to = nodeMap[representative.to];

  if (!from || !to) return null;

  const style = getEdgeStyle(representative.type);
  const d = computeClusterPath(from, to);

  const midX = (from.x + from.width / 2 + to.x + to.width / 2) / 2;
  const midY = (from.y + from.height / 2 + to.y + to.height / 2) / 2;

  return (
    <g key={`flow-cluster-${item.groupKey}`} className="flow-cluster-edge" data-edge-count={edges.length}>
      {/* Thick bundle path */}
      <path
        d={d}
        stroke={style.stroke}
        strokeWidth={CLUSTER_STROKE_WIDTH}
        fill="none"
        strokeLinecap="round"
        strokeOpacity={0.35}
        markerEnd={`url(#flow-arrow-${style.stroke.replace('#', '')})`}
        className="flow-cluster-edge-path"
      />
      {/* +N badge */}
      <g>
        <rect
          x={midX - 14}
          y={midY - 10}
          width={28}
          height={16}
          rx={8}
          fill={style.stroke}
          fillOpacity={0.15}
          stroke={style.stroke}
          strokeWidth={1}
          strokeOpacity={0.4}
        />
        <text
          x={midX}
          y={midY + 4}
          fill={style.stroke}
          fontSize={10}
          fontWeight={600}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          className="flow-cluster-label"
        >
          {label}
        </text>
      </g>
    </g>
  );
}

// =============================================================================
// Component Props
// =============================================================================

interface FlowEdgeLayerProps {
  /** Flow edges to render */
  edges: FlowEdge[];
  /** Node rectangles for positioning */
  nodeRects: NodeRect[];
  /** Current zoom level from ReactFlow viewport */
  zoom?: number;
  /** Current pan offset from ReactFlow viewport */
  pan?: { x: number; y: number };
}

// =============================================================================
// Component
// =============================================================================

function FlowEdgeLayerComponent({
  edges,
  nodeRects,
  zoom = 1,
  pan = { x: 0, y: 0 },
}: FlowEdgeLayerProps): React.ReactElement | null {
  if (edges.length === 0) {
    return <></>;
  }

  // Build lookup map
  const nodeMap = useMemo(
    () => Object.fromEntries(nodeRects.map((n) => [n.id, n])),
    [nodeRects]
  );

  // Cluster when > MAX_EDGES_VISIBLE
  const { items } = useMemo(() => clusterFlowEdges(edges), [edges]);

  // Unique arrow colors for defs
  const uniqueArrowColors = useMemo(
    () => [...new Set(Object.values(FLOW_EDGE_STYLES).map((s) => s.stroke))],
    []
  );

  // SVG viewport
  const svgWidth = useMemo(() => {
    if (nodeRects.length === 0) return 2000;
    return Math.max(...nodeRects.map((n) => n.x + n.width + 100)) * zoom + Math.abs(pan.x);
  }, [nodeRects, zoom, pan.x]);

  const svgHeight = useMemo(() => {
    if (nodeRects.length === 0) return 2000;
    return Math.max(...nodeRects.map((n) => n.y + n.height + 100)) * zoom + Math.abs(pan.y);
  }, [nodeRects, zoom, pan.y]);

  const svgOffsetX = pan.x;
  const svgOffsetY = pan.y;

  return (
    <svg
      aria-hidden="true"
      className="flow-edge-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 40,
      }}
    >
      <g transform={`translate(${svgOffsetX}, ${svgOffsetY}) scale(${zoom})`}>
        <defs>
          <clipPath id="flow-edge-clip">
            <rect
              x={-svgOffsetX / zoom}
              y={-svgOffsetY / zoom}
              width={svgWidth / zoom}
              height={svgHeight / zoom}
            />
          </clipPath>
          {uniqueArrowColors.map((color) => (
            <ArrowMarker key={color} stroke={color} />
          ))}
        </defs>

        <g clipPath="url(#flow-edge-clip)">
          {items.map((item, _idx) => {
            if (item.kind === 'edge') {
              return <SingleFlowEdge key={item.key} item={item} nodeMap={nodeMap} />;
            } else {
              return <ClusterFlowEdge key={`flow-cluster-${item.groupKey}`} item={item} nodeMap={nodeMap} />;
            }
          })}
        </g>
      </g>
    </svg>
  );
}

export const FlowEdgeLayer = memo(FlowEdgeLayerComponent);
