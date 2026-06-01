/**
 * VibeX MiniMap utilities — S51-E3: MiniMap node coloring + sampling
 *
 * Responsibilities:
 * - Map node types to MiniMap colors (node type color differentiation)
 * - Sample nodes for large canvases (performance: ≤16ms for 100+ nodes)
 */
import type { Node } from '@xyflow/react';

// ==================== Node Type → Color ====================

/** Node type colors for MiniMap */
export const MINI_MAP_COLORS = {
  /** User story cards — blue */
  'user-story': '#3b82f6',
  /** Bounded context groups — purple */
  'bounded-context': '#8b5cf6',
  /** Flow step — start node — green */
  'flow-step:start': '#22c55e',
  /** Flow step — end node — red */
  'flow-step:end': '#ef4444',
  /** Flow step — process node — gray */
  'flow-step:process': '#6b7280',
  /** Default fallback — slate */
  default: '#64748b',
} as const;

export type MiniMapNodeColorKey = keyof typeof MINI_MAP_COLORS;

/**
 * Get the color key for a ReactFlow node in the MiniMap.
 * Checks data.nodeType (flow-step subtypes) or data.type (DDS node types).
 * Falls back to 'default' if no recognized type.
 */
export function getMiniMapNodeColorKey(node: Node): MiniMapNodeColorKey {
  const data = node.data as Record<string, unknown>;
  const nodeType = data?.nodeType as string | undefined;
  const type = (data?.type ?? node.type) as string | undefined;

  // Flow step subtypes
  if (type === 'flow-step' && (nodeType === 'start' || nodeType === 'end' || nodeType === 'process')) {
    return `flow-step:${nodeType}` as MiniMapNodeColorKey;
  }

  // DDS node types
  if (type === 'user-story') return 'user-story';
  if (type === 'bounded-context') return 'bounded-context';

  // Flow step without subtype → process
  if (type === 'flow-step') return 'flow-step:process';

  return 'default';
}

/**
 * Get the CSS color string for a ReactFlow node in the MiniMap.
 * Used as the `nodeColor` prop on the @xyflow/react MiniMap component.
 */
export function getMiniMapNodeColor(node: Node): string {
  return MINI_MAP_COLORS[getMiniMapNodeColorKey(node)] ?? MINI_MAP_COLORS.default;
}

// ==================== Node Sampling ====================

const SAMPLING_THRESHOLD = 100; // Sample when canvas has > 100 nodes
const SAMPLE_FRACTION = 0.05;  // Keep 5% of nodes when sampling

/**
 * Sample nodes for MiniMap rendering performance.
 * When canvas has > SAMPLING_THRESHOLD nodes, returns a representative subset
 * that preserves spatial distribution for navigation.
 *
 * Algorithm: stratified sampling — divide nodes into a 5×5 grid, keep up to
 * SAMPLE_FRACTION from each cell, ensuring corner nodes (for navigation anchors).
 */
export function sampleNodesForMiniMap(nodes: Node[]): Node[] {
  if (nodes.length <= SAMPLING_THRESHOLD) {
    return nodes;
  }

  // Compute bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    const w = (node.measured?.width ?? node.width ?? 200);
    const h = (node.measured?.height ?? node.height ?? 60);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  if (!isFinite(minX)) return nodes;

  const gridSize = 5;
  const cellW = (maxX - minX) / gridSize;
  const cellH = (maxY - minY) / gridSize;

  // Build grid cells
  const cells: Node[][] = Array.from({ length: gridSize * gridSize }, () => []);
  for (const node of nodes) {
    const w = (node.measured?.width ?? node.width ?? 200);
    const h = (node.measured?.height ?? node.height ?? 60);
    const cx = node.position.x + w / 2;
    const cy = node.position.y + h / 2;
    const col = Math.min(gridSize - 1, Math.floor((cx - minX) / cellW));
    const row = Math.min(gridSize - 1, Math.floor((cy - minY) / cellH));
    cells[row * gridSize + col].push(node);
  }

  const maxPerCell = Math.max(1, Math.floor(SAMPLING_THRESHOLD * SAMPLE_FRACTION / (gridSize * gridSize)));

  // Always include the four corner nodes (navigation anchors)
  const cornerNodes: Node[] = [];
  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: maxY },
  ];
  for (const node of nodes) {
    for (const corner of corners) {
      const dist =
        Math.abs(node.position.x - corner.x) < 1 &&
        Math.abs(node.position.y - corner.y) < 1;
      if (dist && !cornerNodes.includes(node)) {
        cornerNodes.push(node);
      }
    }
  }

  // Sample from each cell
  const sampled: Node[] = [...cornerNodes];
  for (const cell of cells) {
    if (cell.length <= maxPerCell) {
      sampled.push(...cell);
    } else {
      // Pick evenly spaced nodes from the cell
      const step = cell.length / maxPerCell;
      for (let i = 0; i < maxPerCell; i++) {
        sampled.push(cell[Math.round(i * step)]);
      }
    }
  }

  return sampled;
}
