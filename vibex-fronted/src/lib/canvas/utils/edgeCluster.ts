/**
 * edgeCluster.ts — 连线密度控制
 *
 * Epic 3 F3.4
 *
 * 当连线数量超过 MAX_EDGES_VISIBLE 时，按源节点 groupId 分组聚类。
 * 聚类后的边显示为一条粗线 + "+N more" 标签。
 */

import type { BoundedEdge, FlowEdge } from '@/lib/canvas/types';

// =============================================================================
// Constants
// =============================================================================

/** 最大可见连线数量（超过此值触发聚类） */
export const MAX_EDGES_VISIBLE = 20;

/** 聚类边超过此阈值时合并为一条 */
const CLUSTER_THRESHOLD = 3;

// =============================================================================
// Types
// =============================================================================

/** 单条边 */
export interface SingleEdge<T> {
  type: 'single';
  edges: T[];
}

/** 聚类边 */
export interface ClusterEdge<T> {
  type: 'cluster';
  /** 聚类内原始边列表 */
  edges: T[];
  /** 显示 label（如 "+5 more"） */
  label: string;
  /** 聚类包含的边数量 */
  count: number;
}

/** 聚类结果 */
export type ClusterResult<T> = SingleEdge<T> | ClusterEdge<T>;

// =============================================================================
// BoundedEdge clustering
// =============================================================================

/**
 * 对 BoundedEdge 列表进行聚类
 *
 * 策略：按源 groupId 分组，组内边数 > CLUSTER_THRESHOLD 时合并
 * 如果合并后仍超阈值，优先保留小组，合并大组
 */
export function clusterBoundedEdges(edges: BoundedEdge[]): ClusterResult<BoundedEdge> {
  if (edges.length <= MAX_EDGES_VISIBLE) {
    return { type: 'single', edges };
  }

  // 按源 groupId 分组
  const groups: Record<string, BoundedEdge[]> = {};
  for (const edge of edges) {
    const key = edge.from.groupId;
    (groups[key] = groups[key] || []).push(edge);
  }

  const singles: BoundedEdge[] = [];
  const clusters: { edges: BoundedEdge[]; label: string; count: number }[] = [];

  for (const [groupId, groupEdges] of Object.entries(groups)) {
    if (groupEdges.length > CLUSTER_THRESHOLD) {
      clusters.push({
        edges: groupEdges,
        label: `+${groupEdges.length - 1} more`,
        count: groupEdges.length,
      });
    } else {
      singles.push(...groupEdges);
    }
  }

  // 如果 single + cluster 数量仍超阈值，合并最大的聚类
  if (singles.length + clusters.length > MAX_EDGES_VISIBLE) {
    // 按 count 升序排列，合并最大的聚类直到满足阈值
    clusters.sort((a, b) => b.count - a.count);

    while (clusters.length > 0 && singles.length + clusters.length > MAX_EDGES_VISIBLE) {
      const largest = clusters.shift()!;
      const newLabel = `+${largest.count} more`;
      // 合并到现有的单个聚类中（第一个）
      if (clusters.length > 0) {
        const target = clusters[0];
        clusters[0] = {
          edges: [...target.edges, ...largest.edges],
          label: `+${target.count + largest.count} more`,
          count: target.count + largest.count,
        };
      } else {
        // 没有其他聚类，创建一个合并的聚类
        clusters.push({
          edges: largest.edges,
          label: newLabel,
          count: largest.count,
        });
      }
    }
  }

  // 转换为 ClusterResult
  const allClusters: ClusterEdge<BoundedEdge>[] = clusters.map((c) => ({
    type: 'cluster',
    edges: c.edges,
    label: c.label,
    count: c.count,
  }));

  const total = singles.length + allClusters.length;
  if (total <= MAX_EDGES_VISIBLE) {
    return { type: 'single', edges: [...singles, ...allClusters.flatMap((c) => c.edges)] };
  }

  return {
    type: 'cluster',
    edges: [...singles, ...allClusters] as unknown as BoundedEdge[],
    label: `+${edges.length - MAX_EDGES_VISIBLE} edges`,
    count: edges.length,
  };
}

// =============================================================================
// FlowEdge clustering
// =============================================================================

/**
 * 对 FlowEdge 列表进行聚类
 *
 * 策略：按源 nodeId 分组，组内边数 > CLUSTER_THRESHOLD 时合并
 */
export function clusterFlowEdges(edges: FlowEdge[]): ClusterResult<FlowEdge> {
  if (edges.length <= MAX_EDGES_VISIBLE) {
    return { type: 'single', edges };
  }

  const groups: Record<string, FlowEdge[]> = {};
  for (const edge of edges) {
    const key = edge.from;
    (groups[key] = groups[key] || []).push(edge);
  }

  const singles: FlowEdge[] = [];
  const clusters: { edges: FlowEdge[]; label: string; count: number }[] = [];

  for (const [nodeId, groupEdges] of Object.entries(groups)) {
    if (groupEdges.length > CLUSTER_THRESHOLD) {
      clusters.push({
        edges: groupEdges,
        label: `+${groupEdges.length - 1} more from ${nodeId}`,
        count: groupEdges.length,
      });
    } else {
      singles.push(...groupEdges);
    }
  }

  clusters.sort((a, b) => b.count - a.count);

  while (clusters.length > 0 && singles.length + clusters.length > MAX_EDGES_VISIBLE) {
    const largest = clusters.shift()!;
    if (clusters.length > 0) {
      const target = clusters[0];
      clusters[0] = {
        edges: [...target.edges, ...largest.edges],
        label: `+${target.count + largest.count} more`,
        count: target.count + largest.count,
      };
    } else {
      clusters.push({ edges: largest.edges, label: `+${largest.count} more`, count: largest.count });
    }
  }

  const allClusters: ClusterEdge<FlowEdge>[] = clusters.map((c) => ({
    type: 'cluster',
    edges: c.edges,
    label: c.label,
    count: c.count,
  }));

  const total = singles.length + allClusters.length;
  if (total <= MAX_EDGES_VISIBLE) {
    return { type: 'single', edges: [...singles, ...allClusters.flatMap((c) => c.edges)] };
  }

  return {
    type: 'cluster',
    edges: [...singles, ...allClusters] as unknown as FlowEdge[],
    label: `+${edges.length - MAX_EDGES_VISIBLE} edges`,
    count: edges.length,
  };
}
