/**
 * Flow Layout - DAGree Auto Layout Algorithm
 * 
 * This module provides automatic layout algorithms for flow charts and DAGs.
 * The DAGree algorithm computes node ordering positions based on topological
 * and layer-based layout.
 * 
 * @module lib/flow-layout
 */

import type { Node, Edge } from '@xyflow/react';

/**
 * Layout direction
 */
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

/**
 * Layout options
 */
export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  nodeSpacing?: number;
  layerSpacing?: number;
  marginX?: number;
  marginY?: number;
  ranker?: 'longest-path' | 'tight-tree' | 'network-simplex';
}

/**
 * Default layout options
 */
const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  direction: 'TB',
  nodeWidth: 180,
  nodeHeight: 50,
  nodeSpacing: 50,
  layerSpacing: 100,
  marginX: 50,
  marginY: 50,
  ranker: 'longest-path',
};

/**
 * Node with layout information
 */
interface LayoutNode {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rank: number;
  layerIndex: number;
  positionInLayer: number;
}

/**
 * Layer of nodes
 */
interface NodeLayer {
  rank: number;
  nodes: LayoutNode[];
}

/**
 * Build adjacency list from edges
 */
function buildAdjacencyList(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();
  
  // Initialize all nodes
  nodes.forEach(node => {
    if (!adjacencyList.has(node.id)) {
      adjacencyList.set(node.id, []);
    }
  });
  
  // Add edges (from source to target)
  edges.forEach(edge => {
    const sources = adjacencyList.get(edge.source) || [];
    sources.push(edge.target);
    adjacencyList.set(edge.source, sources);
  });
  
  return adjacencyList;
}

/**
 * Build reverse adjacency list (incoming edges)
 */
function buildReverseAdjacencyList(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const reverseList = new Map<string, string[]>();
  
  // Initialize all nodes
  nodes.forEach(node => {
    if (!reverseList.has(node.id)) {
      reverseList.set(node.id, []);
    }
  });
  
  // Add reverse edges
  edges.forEach(edge => {
    const targets = reverseList.get(edge.target) || [];
    targets.push(edge.source);
    reverseList.set(edge.target, targets);
  });
  
  return reverseList;
}

/**
 * Compute node ranks using longest-path algorithm
 */
function computeRanks(nodes: Node[], edges: Edge[]): Map<string, number> {
  const ranks = new Map<string, number>();
  const reverseAdjacency = buildReverseAdjacencyList(nodes, edges);
  
  // Find root nodes (nodes with no incoming edges)
  const rootNodes = nodes.filter(node => {
    const incoming = reverseAdjacency.get(node.id) || [];
    return incoming.length === 0;
  });
  
  // If no root nodes, pick the first node
  const startNodes = rootNodes.length > 0 ? rootNodes : [nodes[0]];
  
  // Initialize all nodes with rank 0
  nodes.forEach(node => ranks.set(node.id, 0));
  
  // BFS to compute longest path ranks
  const visited = new Set<string>();
  const queue: { id: string; rank: number }[] = startNodes.map(n => ({ id: n.id, rank: 0 }));
  
  while (queue.length > 0) {
    const { id, rank } = queue.shift()!;
    
    if (visited.has(id)) continue;
    visited.add(id);
    
    const currentRank = ranks.get(id) || 0;
    const newRank = Math.max(currentRank, rank);
    ranks.set(id, newRank);
    
    // Get outgoing edges
    const adjacencyList = buildAdjacencyList(nodes, edges);
    const outgoing = adjacencyList.get(id) || [];
    
    outgoing.forEach(targetId => {
      if (!visited.has(targetId)) {
        queue.push({ id: targetId, rank: newRank + 1 });
      }
    });
  }
  
  // Handle disconnected nodes
  nodes.forEach(node => {
    if (!ranks.has(node.id)) {
      ranks.set(node.id, 0);
    }
  });
  
  return ranks;
}

/**
 * Group nodes by rank (layer)
 */
function groupNodesByRank(nodes: Node[], ranks: Map<string, number>): NodeLayer[] {
  const rankMap = new Map<number, LayoutNode[]>();
  
  nodes.forEach(node => {
    const rank = ranks.get(node.id) || 0;
    if (!rankMap.has(rank)) {
      rankMap.set(rank, []);
    }
    
    const nodeWidth = node.style?.width as number || DEFAULT_OPTIONS.nodeWidth;
    const nodeHeight = node.style?.height as number || DEFAULT_OPTIONS.nodeHeight;
    
    rankMap.get(rank)!.push({
      id: node.id,
      width: typeof nodeWidth === 'number' ? nodeWidth : DEFAULT_OPTIONS.nodeWidth,
      height: typeof nodeHeight === 'number' ? nodeHeight : DEFAULT_OPTIONS.nodeHeight,
      x: node.position.x,
      y: node.position.y,
      rank,
      layerIndex: 0,
      positionInLayer: 0,
    });
  });
  
  // Convert to layers
  const sortedRanks = Array.from(rankMap.keys()).sort((a, b) => a - b);
  
  return sortedRanks.map((rank, index) => ({
    rank,
    nodes: rankMap.get(rank)!,
  }));
}

/**
 * Calculate optimal node positions within a layer
 */
function layoutLayer(
  layer: NodeLayer,
  direction: LayoutDirection,
  nodeSpacing: number,
  layerSpacing: number,
  marginX: number,
  marginY: number
): LayoutNode[] {
  const { rank, nodes } = layer;
  
  // Sort nodes to minimize edge crossings (simple heuristic: by number of connections)
  const sortedNodes = [...nodes].sort((a, b) => {
    // Keep original order as fallback
    return 0;
  });
  
  const totalHeight = sortedNodes.reduce((sum, n) => sum + n.height, 0);
  const totalSpacing = (sortedNodes.length - 1) * nodeSpacing;
  const layerHeight = totalHeight + totalSpacing;
  
  let startY: number;
  if (direction === 'TB' || direction === 'LR') {
    startY = rank * (layerSpacing + DEFAULT_OPTIONS.nodeHeight);
  } else {
    startY = marginY;
  }
  
  let currentY = startY + rank * layerSpacing;
  
  return sortedNodes.map((node, index) => {
    const x = marginX + rank * layerSpacing;
    const y = currentY;
    
    currentY += node.height + nodeSpacing;
    
    return {
      ...node,
      x: direction === 'LR' || direction === 'RL' ? y : x,
      y: direction === 'LR' || direction === 'RL' ? x : y,
      layerIndex: rank,
      positionInLayer: index,
    };
  });
}

/**
 * Apply DAGree layout algorithm
 */
function dagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): Node[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Compute ranks
  const ranks = computeRanks(nodes, edges);
  
  // Group nodes by rank
  const layers = groupNodesByRank(nodes, ranks);
  
  // Layout each layer
  let layoutedNodes: LayoutNode[] = [];
  
  layers.forEach(layer => {
    const layoutedLayer = layoutLayer(
      layer,
      opts.direction,
      opts.nodeSpacing,
      opts.layerSpacing,
      opts.marginX,
      opts.marginY
    );
    layoutedNodes = [...layoutedNodes, ...layoutedLayer];
  });
  
  // Handle horizontal directions
  if (opts.direction === 'LR' || opts.direction === 'RL') {
    const maxRank = Math.max(...layoutedNodes.map(n => n.rank));
    layoutedNodes = layoutedNodes.map(node => ({
      ...node,
      x: node.rank * (opts.layerSpacing + opts.nodeWidth),
      y: node.positionInLayer * (opts.nodeSpacing + node.height),
    }));
  }
  
  // Convert back to Node format
  return nodes.map(node => {
    const layoutNode = layoutedNodes.find(n => n.id === node.id);
    if (!layoutNode) return node;
    
    return {
      ...node,
      position: {
        x: layoutNode.x,
        y: layoutNode.y,
      },
    };
  });
}

/**
 * Auto layout function - main entry point
 * 
 * @param nodes - Array of ReactFlow nodes
 * @param edges - Array of ReactFlow edges  
 * @param options - Layout options
 * @returns Nodes with updated positions
 */
export function autoLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  if (!nodes || nodes.length === 0) {
    return [];
  }
  
  // Validate inputs
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    console.warn('[flow-layout] Invalid nodes or edges array');
    return nodes;
  }
  
  // Apply DAGree layout
  return dagreLayout(nodes, edges, options);
}

/**
 * Compact layout - more tightly packed
 */
export function compactLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const compactOptions: LayoutOptions = {
    ...options,
    nodeSpacing: 30,
    layerSpacing: 80,
    marginX: 30,
    marginY: 30,
  };
  
  return autoLayout(nodes, edges, compactOptions);
}

/**
 * Wide layout - more spread out
 */
export function wideLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const wideOptions: LayoutOptions = {
    ...options,
    nodeSpacing: 80,
    layerSpacing: 150,
    marginX: 80,
    marginY: 80,
  };
  
  return autoLayout(nodes, edges, wideOptions);
}

/**
 * Center layout - centers the graph in the viewport
 */
export function centerLayout(
  nodes: Node[],
  _edges: Edge[] = [],
  _options: LayoutOptions = {}
): Node[] {
  if (!nodes || nodes.length === 0) return [];
  
  // Find bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = (node.style?.width as number) || DEFAULT_OPTIONS.nodeWidth;
    const height = (node.style?.height as number) || DEFAULT_OPTIONS.nodeHeight;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });
  
  // Calculate center offset
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Offset to center at origin
  return nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x - centerX + 400, // Offset to visible area
      y: node.position.y - centerY + 300,
    },
  }));
}

/**
 * Layout with animation - returns nodes with smooth transition
 */
export function animatedLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const layoutedNodes = autoLayout(nodes, edges, options);
  
  // Add slight randomization for visual interest during animation
  return layoutedNodes.map(node => ({
    ...node,
    position: {
      x: node.position.x + (Math.random() - 0.5) * 5,
      y: node.position.y + (Math.random() - 0.5) * 5,
    },
    selected: false,
  }));
}

/**
 * Calculate bounding box of nodes
 */
export function getNodesBounds(nodes: Node[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (!nodes || nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = (node.style?.width as number) || DEFAULT_OPTIONS.nodeWidth;
    const height = (node.style?.height as number) || DEFAULT_OPTIONS.nodeHeight;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Fit nodes to viewport
 */
export function fitToViewport(
  nodes: Node[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): Node[] {
  const bounds = getNodesBounds(nodes);
  
  if (bounds.width === 0 || bounds.height === 0) {
    return nodes;
  }
  
  const scaleX = (viewportWidth - padding * 2) / bounds.width;
  const scaleY = (viewportHeight - padding * 2) / bounds.height;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
  
  const offsetX = (viewportWidth - bounds.width * scale) / 2 - bounds.x * scale;
  const offsetY = (viewportHeight - bounds.height * scale) / 2 - bounds.y * scale;
  
  return nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x * scale + offsetX,
      y: node.position.y * scale + offsetY,
    },
  }));
}

export default autoLayout;
