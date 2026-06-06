/**
 * nodeAggregator.ts — S71-E3: 大型画布性能优化
 *
 * Aggregates nearby nodes into clusters using a simple grid-based approach.
 * Reduces the number of rendered elements for very large canvases (200+ nodes).
 */
import type { Node } from '@xyflow/react';

export interface Cluster {
  id: string;
  nodes: Node[];
  centroidX: number;
  centroidY: number;
  /** Count of nodes in cluster */
  count: number;
}

export interface AggregationOptions {
  /** Grid cell size (px). Default 150. */
  cellSize?: number;
  /** Max clusters to return. Default 50. */
  maxClusters?: number;
}

/**
 * Simple grid-based node clustering.
 * Groups nodes that fall within the same grid cell into one cluster.
 */
export function aggregateNodes(
  nodes: Node[],
  options: AggregationOptions = {}
): Cluster[] {
  const { cellSize = 150, maxClusters = 50 } = options;

  if (!nodes.length) return [];

  // Grid-based clustering
  const grid = new Map<string, Node[]>();

  for (const node of nodes) {
    const cellX = Math.floor(node.position.x / cellSize);
    const cellY = Math.floor(node.position.y / cellSize);
    const key = `${cellX},${cellY}`;

    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(node);
  }

  const clusters: Cluster[] = [];

  for (const [key, cellNodes] of grid.entries()) {
    const [cx, cy] = key.split(',').map(Number);
    const centroidX = cx * cellSize + cellSize / 2;
    const centroidY = cy * cellSize + cellSize / 2;

    clusters.push({
      id: key,
      nodes: cellNodes,
      centroidX,
      centroidY,
      count: cellNodes.length,
    });
  }

  // Sort by count descending, take top N
  clusters.sort((a, b) => b.count - a.count);
  return clusters.slice(0, maxClusters);
}

/**
 * Mock generator for testing: creates N mock nodes scattered on a grid.
 */
export function mockNodes(count: number): Node[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    position: { x: i * 20, y: Math.floor(i / 10) * 20 },
    data: { label: `Node ${i}` },
    type: 'card',
  }));
}
