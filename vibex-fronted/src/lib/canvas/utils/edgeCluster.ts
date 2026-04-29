/**
 * edgeCluster.ts — E3-F3.4: Edge density control with MAX_EDGES_VISIBLE clustering
 *
 * Generic edge clustering for both BoundedEdge (Epic F3.2) and FlowEdge (Epic F3.3).
 *
 * Clustering rules:
 * 1. Always group edges by source group
 * 2. Cluster groups with > CLUSTER_THRESHOLD (3) edges — regardless of total count
 * 3. Safety cap: if result still exceeds MAX_EDGES_VISIBLE (20), cluster smallest groups
 *
 * Usage:
 *   // BoundedEdge (uses from.groupId as groupKey)
 *   const result = clusterBoundedEdges(edges);
 *
 *   // FlowEdge (uses from as nodeId as groupKey)
 *   const result = clusterFlowEdges(edges);
 *
 *   // Generic (any edge type with custom key extractor)
 *   const result = clusterEdges(edges, (e) => e.from.groupId);
 */

import type { BoundedEdge, FlowEdge } from '@/lib/canvas/types';

// =============================================================================
// Constants
// =============================================================================

/** Maximum number of items (single + clusters) to render before safety cap */
export const MAX_EDGES_VISIBLE = 20;

/**
 * Minimum edges from a single source before clustering kicks in.
 * Cluster any group with > this many edges.
 */
const CLUSTER_THRESHOLD = 3;

// =============================================================================
// Clustering Types
// =============================================================================

/** A single edge item (for direct rendering) */
export interface SingleEdgeItem<E> {
  kind: 'edge';
  edge: E;
  /** Unique key for React list rendering */
  key: string;
}

/** A cluster bundle (multiple edges merged) */
export interface ClusterEdgeItem<E> {
  kind: 'cluster';
  representative: E;
  edges: E[];
  label: string;
  groupKey: string;
}

/** Union of renderable items */
export type ClusteredItem<E> = SingleEdgeItem<E> | ClusterEdgeItem<E>;

/** Clustering result */
export interface ClusterResult<E> {
  type: 'single' | 'cluster';
  items: ClusteredItem<E>[];
  totalCount: number;
  mergedCount: number;
}

// =============================================================================
// Core Generic Clustering Algorithm
// =============================================================================

/**
 * Always groups edges by source, clusters groups with > CLUSTER_THRESHOLD edges,
 * then applies a safety cap if result exceeds MAX_EDGES_VISIBLE.
 *
 * @param edges - Array of edges to cluster
 * @param getGroupKeyFn - Function to extract the group key from an edge
 */
function clusterEdgesImpl<E>(
  edges: E[],
  getGroupKeyFn: (edge: E) => string
): ClusterResult<E> {
  const totalCount = edges.length;
  if (totalCount === 0) {
    return { type: 'single', items: [], totalCount: 0, mergedCount: 0 };
  }

  // Step 1: Group edges by source group
  const groups: Record<string, E[]> = {};
  for (const edge of edges) {
    const key = getGroupKeyFn(edge);
    if (!groups[key]) groups[key] = [];
    groups[key].push(edge);
  }

  // Step 2: Cluster groups exceeding threshold (regardless of total count)
  const items: ClusteredItem<E>[] = [];
  let mergedCount = 0;

  for (const [groupKey, groupEdges] of Object.entries(groups)) {
    if (groupEdges.length > CLUSTER_THRESHOLD) {
      // Cluster this group
      const excess = groupEdges.length - 1;
      mergedCount += excess;
      items.push({
        kind: 'cluster',
        representative: groupEdges[0]!,
        edges: groupEdges,
        label: `+${excess}`,
        groupKey,
      });
    } else {
      // Keep individual edges for this group
      for (const edge of groupEdges) {
        const key = (edge as { id?: string }).id ?? groupKey;
        items.push({ kind: 'edge', edge, key } as SingleEdgeItem<E>);
      }
    }
  }

  // Step 3: Safety cap — if still over MAX_EDGES_VISIBLE, cluster smallest groups
  if (items.length > MAX_EDGES_VISIBLE) {
    return applySafetyCap(edges, items, mergedCount, getGroupKeyFn);
  }

  const type = mergedCount > 0 ? 'cluster' : 'single';
  return { type, items, totalCount, mergedCount };
}

/**
 * Apply safety cap: cluster smallest single-edge groups until under limit.
 */
function applySafetyCap<E>(
  edges: E[],
  items: ClusteredItem<E>[],
  mergedCount: number,
  getGroupKeyFn: (edge: E) => string
): ClusterResult<E> {
  const singleItems = items.filter((i): i is SingleEdgeItem<E> => i.kind === 'edge');
  const existingClusters = items.filter((i): i is ClusterEdgeItem<E> => i.kind === 'cluster');

  // Group single items by groupKey
  const byGroup: Record<string, E[]> = {};
  for (const item of singleItems) {
    const key = getGroupKeyFn(item.edge);
    if (!byGroup[key]) byGroup[key] = [];
    byGroup[key].push(item.edge);
  }

  // Sort groups by size ascending (cluster smallest first)
  const sortedGroups = Object.entries(byGroup).sort(([, a], [, b]) => a.length - b.length);

  const newClusters: ClusterEdgeItem<E>[] = [...existingClusters];
  let additionalMerged = 0;

  for (const [gk, ge] of sortedGroups) {
    if (newClusters.length + singleItems.length - ge.length <= MAX_EDGES_VISIBLE) {
      // Merge all remaining groups into one big cluster
      for (const [gk2, ge2] of sortedGroups) {
        if (gk2 === gk) continue;
        if (ge2.length > 0) {
          const excess = ge2.length - 1;
          additionalMerged += excess;
          newClusters.push({
            kind: 'cluster',
            representative: ge2[0]!,
            edges: ge2,
            label: `+${excess}`,
            groupKey: gk2,
          });
        }
      }
      break;
    }
    if (ge.length > 1) {
      const excess = ge.length - 1;
      additionalMerged += excess;
      newClusters.push({
        kind: 'cluster',
        representative: ge[0]!,
        edges: ge,
        label: `+${excess}`,
        groupKey: gk,
      });
    }
  }

  const resultItems = newClusters.length <= MAX_EDGES_VISIBLE
    ? newClusters
    : newClusters.slice(0, MAX_EDGES_VISIBLE);

  return {
    type: 'cluster',
    items: resultItems,
    totalCount: edges.length,
    mergedCount: mergedCount + additionalMerged,
  };
}

// =============================================================================
// Typed Public APIs
// =============================================================================

/** Cluster BoundedEdges by from.groupId */
export function clusterBoundedEdges(edges: BoundedEdge[]): ClusterResult<BoundedEdge> {
  return clusterEdgesImpl(edges, (e) => e.from.groupId) as ClusterResult<BoundedEdge>;
}

/** Cluster FlowEdges by from (nodeId) */
export function clusterFlowEdges(edges: FlowEdge[]): ClusterResult<FlowEdge> {
  return clusterEdgesImpl(edges, (e) => e.from) as ClusterResult<FlowEdge>;
}

/**
 * Generic clusterEdges — accepts any edge array with a key extractor.
 * Prefer the typed versions (clusterBoundedEdges / clusterFlowEdges).
 */
export function clusterEdges<T>(
  edges: T[],
  getGroupKeyFn: (edge: T) => string
): ClusterResult<T> {
  return clusterEdgesImpl(edges, getGroupKeyFn) as ClusterResult<T>;
}

// =============================================================================
// React Hooks for Memoized Clustering
// =============================================================================

import { useMemo } from 'react';

/** Memoized BoundedEdge clustering for use in React components */
export function useBoundedClusteredEdges(edges: BoundedEdge[]): ClusterResult<BoundedEdge> {
  return useMemo(() => clusterBoundedEdges(edges), [edges]);
}

/** Memoized FlowEdge clustering for use in React components */
export function useFlowClusteredEdges(edges: FlowEdge[]): ClusterResult<FlowEdge> {
  return useMemo(() => clusterFlowEdges(edges), [edges]);
}
