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
 *     nodes={reactFlowNodes}
 *     zoom={1}
 *     pan={{ x: 0, y: 0 }}
 *   />
 */

'use client';

import React, { memo, useMemo } from 'react';
import type { BoundedEdge, NodeRect } from '@/lib/canvas/types';
import type { Node } from '@xyflow/react';
import { computeEdgePath, BOUNDED_EDGE_COLORS } from '@/lib/canvas/utils/edgePath';
import { clusterBoundedEdges } from '@/lib/canvas/utils/edgeCluster';
import styles from './BoundedEdgeLayer.module.css';

// Default node dimensions (matching CardTreeRenderer card size)
const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 200;

/** 从 ReactFlow Node[] 提取 NodeRect[] */
export function nodesToNodeRects(nodes: Node[]): NodeRect[] {
  return nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    width: (n.measured?.width as number | undefined) ?? DEFAULT_NODE_WIDTH,
    height: (n.measured?.height as number | undefined) ?? DEFAULT_NODE_HEIGHT,
  }));
}

interface BoundedEdgeLayerProps {
  /** BoundedEdge 连线列表 */
  edges: BoundedEdge[];
  /** ReactFlow Node[] 用于定位 */
  nodes: Node[];
  /** 当前 zoom 级别 */
  zoom?: number;
  /** 当前 pan 偏移 */
  pan?: { x: number; y: number };
  /** CSS className */
  className?: string;
}

function BoundedEdgeLayerComponent({
  edges,
  nodes,
  zoom = 1,
  pan = { x: 0, y: 0 },
  className,
}: BoundedEdgeLayerProps) {
  // 构建 nodeMap 用于快速查找
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
  const { clusterResult, hasCluster } = useMemo(() => {
    const result = clusterBoundedEdges(edges);
    return { clusterResult: result, hasCluster: result.type === 'cluster' };
  }, [edges]);

  // 计算 SVG 视口大小
  const { svgWidth, svgHeight } = useMemo(() => {
    if (nodes.length === 0) return { svgWidth: 2000, svgHeight: 2000 };
    let maxX = 0, maxY = 0;
    for (const n of nodes) {
      const rect = nodeMap[n.id];
      if (!rect) continue;
      maxX = Math.max(maxX, rect.x + rect.width + 100);
      maxY = Math.max(maxY, rect.y + rect.height + 100);
    }
    return { svgWidth: maxX, svgHeight: maxY };
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
        zIndex: 30,
      }}
    >
      {/* 转换组以匹配 ReactFlow viewport */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        <defs>
          {/* 每种类型一个 marker */}
          {(Object.entries(BOUNDED_EDGE_COLORS) as [BoundedEdge['type'], string][]).map(
            ([type, color]) => (
              <marker
                key={type}
                id={`bounded-arrow-${type}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={color} />
              </marker>
            )
          )}
          <clipPath id="bounded-edge-clip">
            <rect
              x={-pan.x / zoom}
              y={-pan.y / zoom}
              width={svgWidth / zoom + 200}
              height={svgHeight / zoom + 200}
            />
          </clipPath>
        </defs>

        <g clipPath="url(#bounded-edge-clip)">
          {clusterResult.type === 'single' &&
            (clusterResult.edges as BoundedEdge[]).map((edge) => {
              const fromRect = nodeMap[edge.from.groupId];
              const toRect = nodeMap[edge.to.groupId];
              if (!fromRect || !toRect) return null;

              const d = computeEdgePath(fromRect, toRect);
              const color = BOUNDED_EDGE_COLORS[edge.type] ?? BOUNDED_EDGE_COLORS.dependency;

              // 计算 label 中点
              const mx = (fromRect.x + fromRect.width / 2 + toRect.x + toRect.width / 2) / 2;
              const my = (fromRect.y + fromRect.height / 2 + toRect.y + toRect.height / 2) / 2;

              return (
                <g key={edge.id} className={`${styles.edge} ${styles[edge.type]}`}>
                  {/* 主路径 */}
                  <path
                    d={d}
                    stroke={color}
                    strokeWidth={2}
                    fill="none"
                    markerEnd={`url(#bounded-arrow-${edge.type})`}
                  />
                  {/* Label */}
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
            })}

          {/* 聚类渲染 */}
          {clusterResult.type === 'cluster' && hasCluster && (
            <g className={styles.cluster}>
              {(() => {
                // 从 edges 中提取聚类信息
                const clusterEdges = clusterResult.edges as unknown as Array<{ type: 'cluster'; label: string; count: number; edges: BoundedEdge[] }>;
                const singleEdges = clusterEdges.filter((e) => e.type === 'single') as unknown as BoundedEdge[];
                const clusters = clusterEdges.filter((e) => e.type === 'cluster') as unknown as Array<{ type: 'cluster'; label: string; count: number; edges: BoundedEdge[] }>;

                const elements: React.ReactNode[] = [];

                // 渲染单个边
                for (const edge of singleEdges) {
                  const fromRect = nodeMap[edge.from.groupId];
                  const toRect = nodeMap[edge.to.groupId];
                  if (!fromRect || !toRect) continue;
                  const d = computeEdgePath(fromRect, toRect);
                  const color = BOUNDED_EDGE_COLORS[edge.type];
                  elements.push(
                    <path
                      key={edge.id}
                      d={d}
                      stroke={color}
                      strokeWidth={2}
                      fill="none"
                      markerEnd={`url(#bounded-arrow-${edge.type})`}
                    />
                  );
                }

                // 渲染聚类边（用一条粗线代表）
                for (const cluster of clusters) {
                  const firstEdge = cluster.edges[0];
                  if (!firstEdge) continue;
                  const fromRect = nodeMap[firstEdge.from.groupId];
                  const toRect = nodeMap[firstEdge.to.groupId];
                  if (!fromRect || !toRect) continue;
                  const d = computeEdgePath(fromRect, toRect);
                  const mx = (fromRect.x + toRect.x) / 2;
                  const my = (fromRect.y + toRect.y) / 2;
                  elements.push(
                    <g key={`cluster-${firstEdge.id}`}>
                      <path
                        d={d}
                        stroke="#6366f1"
                        strokeWidth={3.5}
                        fill="none"
                        markerEnd="url(#bounded-arrow-dependency)"
                        strokeOpacity={0.7}
                      />
                      <g transform={`translate(${mx}, ${my - 10})`}>
                        <rect
                          x={-cluster.label.length * 3 - 4}
                          y={-8}
                          width={cluster.label.length * 6 + 8}
                          height={16}
                          fill="#6366f1"
                          fillOpacity={0.15}
                          rx={3}
                          stroke="#6366f1"
                          strokeWidth={1}
                          strokeOpacity={0.5}
                        />
                        <text
                          x={0}
                          y={4}
                          textAnchor="middle"
                          fontSize={10}
                          fill="#6366f1"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontWeight={600}
                        >
                          {cluster.label}
                        </text>
                      </g>
                    </g>
                  );
                }

                return elements;
              })()}
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

export const BoundedEdgeLayer = memo(BoundedEdgeLayerComponent);
