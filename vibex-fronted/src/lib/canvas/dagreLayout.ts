/**
 * dagreLayout — Dagre-based automatic layout for VibeX canvas nodes
 *
 * Computes hierarchical (top-to-bottom) layout for DDSCards using dagre.
 * Layout respects existing edges between nodes.
 *
 * S50-E2: 画布节点自动布局
 */

import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { DDSCard, DDSEdge } from '@/types/dds';

/** Default node/edge dimensions used by Dagre */
const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;

/** Layout direction */
export type LayoutDirection = 'TB' | 'LR';

/** Layout options */
export interface DagreLayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  rankSeparation?: number;
  nodeSeparation?: number;
}

const DEFAULT_OPTIONS: Required<DagreLayoutOptions> = {
  direction: 'TB',
  nodeWidth: NODE_WIDTH,
  nodeHeight: NODE_HEIGHT,
  rankSeparation: 80,
  nodeSeparation: 40,
};

/**
 * Build a Dagre graph from DDSCards and DDSEdges,
 * run layout, and return updated card positions.
 */
export function computeDagreLayout(
  cards: DDSCard[],
  edges: DDSEdge[],
  options: DagreLayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    direction: opts.direction,
    rankdir: opts.direction,
    ranksep: opts.rankSeparation,
    nodesep: opts.nodeSeparation,
    marginx: 40,
    marginy: 40,
  });

  // Add nodes
  for (const card of cards) {
    g.setNode(card.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  }

  // Add edges (only between cards that exist)
  const cardIds = new Set(cards.map((c) => c.id));
  for (const edge of edges) {
    if (cardIds.has(edge.source) && cardIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  // Run layout
  dagre.layout(g);

  // Extract positions
  const positions = new Map<string, { x: number; y: number }>();
  for (const card of cards) {
    const nodePos = g.node(card.id);
    if (nodePos) {
      // dagre center-aligns the box; use top-left corner
      positions.set(card.id, {
        x: nodePos.x - opts.nodeWidth / 2,
        y: nodePos.y - opts.nodeHeight / 2,
      });
    } else {
      // Fallback: keep original position
      positions.set(card.id, card.position);
    }
  }

  return positions;
}

/**
 * Convert DDSCards + DDSEdges to React Flow nodes + edges format
 * for use with computeDagreLayout.
 */
export function cardsToFlow(
  cards: DDSCard[],
  edges: DDSEdge[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = cards.map((card) => ({
    id: card.id,
    type: card.type,
    position: card.position,
    data: { ...card },
  }));

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type ?? 'smoothstep',
    animated: edge.animated ?? false,
  }));

  return { nodes, edges: flowEdges };
}

/**
 * Apply computed positions back to cards and return updated arrays.
 */
export function applyPositionsToCards(
  cards: DDSCard[],
  positions: Map<string, { x: number; y: number }>
): DDSCard[] {
  return cards.map((card) => {
    const pos = positions.get(card.id);
    if (!pos) return card;
    return { ...card, position: pos };
  });
}
