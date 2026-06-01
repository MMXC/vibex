/**
 * dagreLayout.test.ts — S50-E2: Dagre-based canvas auto-layout
 *
 * Tests the Dagre layout algorithm for hierarchical node positioning.
 */

import { describe, it, expect } from 'vitest';
import {
  computeDagreLayout,
  cardsToFlow,
  applyPositionsToCards,
} from '../dagreLayout';
import type { DDSCard, DDSEdge } from '@/types/dds';

// Helper: create a mock card with position
function mockCard(id: string, x: number, y: number): DDSCard {
  return {
    id,
    type: 'user-story',
    title: `Card ${id}`,
    position: { x, y },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('computeDagreLayout', () => {
  it('returns a Map with positions for all cards', () => {
    const cards: DDSCard[] = [
      mockCard('c1', 0, 0),
      mockCard('c2', 100, 0),
    ];
    const edges: DDSEdge[] = [];

    const positions = computeDagreLayout(cards, edges, { direction: 'TB' });

    expect(positions.size).toBe(2);
    expect(positions.has('c1')).toBe(true);
    expect(positions.has('c2')).toBe(true);
  });

  it('handles empty cards array', () => {
    const positions = computeDagreLayout([], [], { direction: 'TB' });
    expect(positions.size).toBe(0);
  });

  it('TB layout: parent node y < child node y', () => {
    // Node c1 → c2 (c2 is child of c1)
    const cards: DDSCard[] = [
      mockCard('c1', 100, 100),
      mockCard('c2', 300, 100),
    ];
    const edges: DDSEdge[] = [
      { id: 'e1', source: 'c1', target: 'c2', type: 'smoothstep' },
    ];

    const positions = computeDagreLayout(cards, edges, { direction: 'TB' });
    const pos1 = positions.get('c1')!;
    const pos2 = positions.get('c2')!;

    expect(pos1.y).toBeLessThan(pos2.y);
  });

  it('TB layout: sibling nodes have same rank (similar y)', () => {
    // c1 → c2, c1 → c3 (c2 and c3 are siblings)
    const cards: DDSCard[] = [
      mockCard('c1', 0, 0),
      mockCard('c2', 0, 0),
      mockCard('c3', 0, 0),
    ];
    const edges: DDSEdge[] = [
      { id: 'e1', source: 'c1', target: 'c2', type: 'smoothstep' },
      { id: 'e2', source: 'c1', target: 'c3', type: 'smoothstep' },
    ];

    const positions = computeDagreLayout(cards, edges, { direction: 'TB' });
    const pos2 = positions.get('c2')!;
    const pos3 = positions.get('c3')!;

    // Siblings should have same y (same rank)
    expect(Math.abs(pos2.y - pos3.y)).toBeLessThan(200);
  });

  it('LR layout: parent node x < child node x', () => {
    const cards: DDSCard[] = [
      mockCard('c1', 0, 0),
      mockCard('c2', 0, 100),
    ];
    const edges: DDSEdge[] = [
      { id: 'e1', source: 'c1', target: 'c2', type: 'smoothstep' },
    ];

    const positions = computeDagreLayout(cards, edges, { direction: 'LR' });
    const pos1 = positions.get('c1')!;
    const pos2 = positions.get('c2')!;

    expect(pos1.x).toBeLessThan(pos2.x);
  });

  it('ignores edges with non-existent source/target', () => {
    const cards: DDSCard[] = [mockCard('c1', 0, 0)];
    const edges: DDSEdge[] = [
      { id: 'e1', source: 'c1', target: 'nonexistent', type: 'smoothstep' },
    ];

    // Should not throw
    const positions = computeDagreLayout(cards, edges, { direction: 'TB' });
    expect(positions.size).toBe(1);
  });

  it('falls back to original position for unknown card ids', () => {
    const cards: DDSCard[] = [mockCard('c1', 50, 75)];
    // Edge references a card not in the cards array
    const edges: DDSEdge[] = [
      { id: 'e1', source: 'unknown', target: 'c1', type: 'smoothstep' },
    ];

    const positions = computeDagreLayout(cards, edges, { direction: 'TB' });
    const pos1 = positions.get('c1')!;

    // Should fall back to original position
    expect(pos1.x).toBe(50);
    expect(pos1.y).toBe(75);
  });
});

describe('cardsToFlow', () => {
  it('converts cards to React Flow nodes', () => {
    const cards: DDSCard[] = [mockCard('c1', 10, 20)];
    const edges: DDSEdge[] = [];

    const { nodes, edges: flowEdges } = cardsToFlow(cards, edges);

    expect(nodes.length).toBe(1);
    expect(nodes[0].id).toBe('c1');
    expect(nodes[0].position).toEqual({ x: 10, y: 20 });
  });

  it('converts edges to React Flow edges', () => {
    const cards: DDSCard[] = [mockCard('c1', 0, 0), mockCard('c2', 0, 0)];
    const edges: DDSEdge[] = [
      { id: 'e1', source: 'c1', target: 'c2', type: 'smoothstep', animated: true },
    ];

    const { edges: flowEdges } = cardsToFlow(cards, edges);

    expect(flowEdges.length).toBe(1);
    expect(flowEdges[0].id).toBe('e1');
    expect(flowEdges[0].source).toBe('c1');
    expect(flowEdges[0].target).toBe('c2');
  });
});

describe('applyPositionsToCards', () => {
  it('updates card positions from computed layout', () => {
    const cards: DDSCard[] = [
      mockCard('c1', 0, 0),
      mockCard('c2', 0, 0),
    ];
    const positions = new Map([
      ['c1', { x: 100, y: 200 }],
      ['c2', { x: 300, y: 400 }],
    ]);

    const updated = applyPositionsToCards(cards, positions);

    expect(updated[0].position).toEqual({ x: 100, y: 200 });
    expect(updated[1].position).toEqual({ x: 300, y: 400 });
  });

  it('keeps cards not in positions map unchanged', () => {
    const cards: DDSCard[] = [mockCard('c1', 50, 75)];
    const positions = new Map<string, { x: number; y: number }>([]);

    const updated = applyPositionsToCards(cards, positions);

    expect(updated[0].position).toEqual({ x: 50, y: 75 });
  });
});
