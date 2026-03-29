/**
 * FlowEdgeLayer — 流程节点连线 SVG 渲染层
 *
 * Epic 3 F3.3
 *
 * 功能：
 * - 渲染 FlowEdge[] 列表为 SVG 连线
 * - 三种样式：sequence=实线, branch=虚线, loop=回环曲线
 * - pointer-events: none 不阻挡节点交互
 * - 支持聚类（>20 条时自动聚类）
 *
 * 使用方式：
 *   <FlowEdgeLayer
 *     edges={flowEdges}
 *     nodes={reactFlowNodes}
 *     zoom={1}
 *     pan={{ x: 0, y: 0 }}
 *   />
 */

'use client';

import React, { memo, useMemo } from 'react';
import type { FlowEdge, NodeRect } from '@/lib/canvas/types';
import type { Node } from '@xyflow/react';
import { computeFlowEdgePath, FLOW_EDGE_STYLES } from '@/lib/canvas/utils/edgePath';
import { clusterFlowEdges } from '@/lib/canvas/utils/edgeCluster';
import styles from './FlowEdgeLayer.module.css';

// Default node dimensions
const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 200;

/** 从 ReactFlow Node[] 提取 NodeRect[] */
export function flowNodesToNodeRects(nodes: Node[]): NodeRect[] {
  return nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    width: (n.measured?.width as number | undefined) ?? DEFAULT_NODE_WIDTH,
    height: (n.measured?.height as number | undefined) ?? DEFAULT_NODE_HEIGHT,
  }));
}

interface FlowEdgeLayerProps {
  /** FlowEdge 连线列表 */
  edges: FlowEdge[];
  /** ReactFlow Node[] 用于定位 */
  nodes: Node[];
  /** 当前 zoom 级别 */
  zoom?: number;
  /** 当前 pan 偏移 */
  pan?: { x: number; y: number };
  /** CSS className */
  className?: string;
}

function FlowEdgeLayerComponent({
  edges,
  nodes,
  zoom = 1,
  pan = { x: 0, y: 0 },
  className,
}: FlowEdgeLayerProps) {
  // 构建 nodeMap
  const nodeMap = useMemo(() => {
    const map: Record<string, NodeRect> = {};
    for (const node of nodes) {
      map[node.id] = {
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        width: (node.measured?.width as number | undefined) ?? DEFAULT_NODE_WIDTH,
        height: (node.measured?.height as number | undefined) ?? DEFAULT_NODE_HEIGHT,
      };
    }
    return map;
  }, [nodes]);

  // 聚类处理
  const clusterResult = useMemo(() => clusterFlowEdges(edges), [edges]);

  // 计算 SVG 视口大小
  const svgDimensions = useMemo(() => {
    if (nodes.length === 0) return { width: 2000, height: 2000 };
    let maxX = 0, maxY = 0;
    for (const n of nodes) {
      const rect = nodeMap[n.id];
      if (!rect) continue;
      maxX = Math.max(maxX, rect.x + rect.width + 100);
      maxY = Math.max(maxY, rect.y + rect.height + 100);
    }
    return { width: maxX, height: maxY };
  }, [nodes, nodeMap]);

  if (edges.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className={`${styles.layer} ${className ?? ''}`}
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
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        <defs>
          {/* Arrow markers per edge type */}
          {(Object.entries(FLOW_EDGE_STYLES) as [FlowEdge['type'], { stroke: string; strokeWidth: number; dashArray?: string }][]).map(
            ([type, config]) => (
              <marker
                key={type}
                id={`flow-arrow-${type}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={config.stroke} />
              </marker>
            )
          )}
          <clipPath id="flow-edge-clip">
            <rect
              x={-pan.x / zoom}
              y={-pan.y / zoom}
              width={svgDimensions.width / zoom + 200}
              height={svgDimensions.height / zoom + 200}
            />
          </clipPath>
        </defs>

        <g clipPath="url(#flow-edge-clip)">
          {/* 渲染所有边 */}
          {edges.map((edge) => {
            const fromRect = nodeMap[edge.from];
            const toRect = nodeMap[edge.to];
            if (!fromRect || !toRect) return null;

            const d = computeFlowEdgePath(fromRect, toRect, edge.type);
            const config = FLOW_EDGE_STYLES[edge.type];

            // 计算中点
            const mx = (fromRect.x + fromRect.width / 2 + toRect.x + toRect.width / 2) / 2;
            const my = (fromRect.y + fromRect.height / 2 + toRect.y + toRect.height / 2) / 2;

            return (
              <g key={edge.id} className={`${styles.edge} ${styles[edge.type]}`}>
                {/* 主路径 */}
                <path
                  d={d}
                  stroke={config.stroke}
                  strokeWidth={config.strokeWidth}
                  fill="none"
                  strokeDasharray={config.dashArray}
                  markerEnd={`url(#flow-arrow-${edge.type})`}
                />
                {/* Loop: 添加回环标注 */}
                {edge.type === 'loop' && (
                  <g transform={`translate(${mx + 20}, ${my})`}>
                    <rect
                      x={-20}
                      y={-8}
                      width={40}
                      height={16}
                      fill="#8b5cf6"
                      fillOpacity={0.15}
                      rx={3}
                      stroke="#8b5cf6"
                      strokeWidth={1}
                      strokeOpacity={0.5}
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#8b5cf6"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontWeight={600}
                    >
                      LOOP
                    </text>
                  </g>
                )}
                {/* Label */}
                {edge.label && (
                  <g transform={`translate(${mx}, ${my - 8})`}>
                    <rect
                      x={-edge.label.length * 3 - 4}
                      y={-8}
                      width={edge.label.length * 6 + 8}
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
                      fill={config.stroke}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontWeight={500}
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 聚类信息提示 */}
          {clusterResult.type === 'cluster' && edges.length > 20 && (
            <g transform={`translate(20, 20)`}>
              <rect
                x={0}
                y={0}
                width={140}
                height={28}
                fill="#fef3c7"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeOpacity={0.5}
                rx={4}
              />
              <text
                x={70}
                y={18}
                textAnchor="middle"
                fontSize={11}
                fill="#92400e"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={500}
              >
                {clusterResult.label}
              </text>
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

export const FlowEdgeLayer = memo(FlowEdgeLayerComponent);
