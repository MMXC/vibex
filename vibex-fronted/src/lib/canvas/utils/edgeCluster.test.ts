/**
 * edgeCluster.test.ts — Tests for E3-F3.4: Edge density control clustering
 */

import {
  clusterBoundedEdges,
  MAX_EDGES_VISIBLE,
  type ClusterResult,
} from './edgeCluster';
import type { BoundedEdge } from '@/lib/canvas/types';

// =============================================================================
// Test Helpers
// =============================================================================

function makeEdge(
  id: string,
  fromGroup: string,
  toGroup: string,
  type: BoundedEdge['type'] = 'dependency'
): BoundedEdge {
  return {
    id,
    from: { groupId: fromGroup },
    to: { groupId: toGroup },
    type,
  };
}

// =============================================================================
// F3.4: Clustering Tests
// =============================================================================

describe('clusterEdges', () => {
  describe('≤ MAX_EDGES_VISIBLE edges', () => {
    it('returns all edges as single items when count is 0', () => {
      const result = clusterBoundedEdges([]);
      expect(result.type).toBe('single');
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.mergedCount).toBe(0);
    });

    it('returns all edges as single items when count < MAX_EDGES_VISIBLE and no group exceeds threshold', () => {
      // 12 edges from 12 different groups (1 per group) — no group > 3 → all single
      const edges = Array.from({ length: 12 }, (_, i) =>
        makeEdge(`e${i}`, `g${i}`, `g${i + 100}`)
      );
      const result = clusterBoundedEdges(edges);
      expect(result.type).toBe('single');
      expect(result.items).toHaveLength(12);
      expect(result.mergedCount).toBe(0);
      expect(result.totalCount).toBe(12);
    });

    it('returns all edges as single items at exactly MAX_EDGES_VISIBLE with no group exceeding threshold', () => {
      // 20 edges from 20 different groups (1 each) — no group > 3 → all single
      const edges = Array.from({ length: MAX_EDGES_VISIBLE }, (_, i) =>
        makeEdge(`e${i}`, `g${i}`, `g${i + 100}`)
      );
      const result = clusterBoundedEdges(edges);
      expect(result.type).toBe('single');
      expect(result.items).toHaveLength(MAX_EDGES_VISIBLE);
      expect(result.mergedCount).toBe(0);
    });
  });

  describe('> MAX_EDGES_VISIBLE edges — clustering kicks in', () => {
    it('clusters edges from same source group when group has > 3 edges', () => {
      // 5 edges from g1 → various targets (g1 group > 3 → clusters: 5 edges → 2 items)
      // 2 edges from g2 → different targets (g2 group ≤ 3 → kept as singles: 2 items)
      const edges = [
        ...Array.from({ length: 5 }, (_, i) => makeEdge(`e-g1-${i}`, 'g1', `g${10 + i}`)),
        ...Array.from({ length: 2 }, (_, i) => makeEdge(`e-g2-${i}`, 'g2', `g${20 + i}`)),
      ];
      const result = clusterBoundedEdges(edges);
      expect(result.type).toBe('cluster');
      expect(result.totalCount).toBe(7);
      // g1: 5 > threshold → cluster, 5-1=4 excess merged
      expect(result.mergedCount).toBeGreaterThanOrEqual(4);
      // g2: 2 ≤ threshold → 2 single edges
      const g2Items = result.items.filter(
        (i) => i.kind === 'edge' && i.edge.from.groupId === 'g2'
      );
      expect(g2Items).toHaveLength(2);
    });

    it('multiple clusters when multiple groups exceed threshold', () => {
      const edges = [
        ...Array.from({ length: 10 }, (_, i) => makeEdge(`e-g1-${i}`, 'g1', `g${i + 100}`)),
        ...Array.from({ length: 10 }, (_, i) => makeEdge(`e-g2-${i}`, 'g2', `g${i + 200}`)),
        ...Array.from({ length: 5 }, (_, i) => makeEdge(`e-g3-${i}`, 'g3', `g${i + 300}`)),
      ];
      const result = clusterBoundedEdges(edges);
      expect(result.type).toBe('cluster');
      // g1 and g2 both exceed threshold (3) → each cluster merges
      const clusters = result.items.filter((i) => i.kind === 'cluster');
      expect(clusters.length).toBeGreaterThanOrEqual(2);
    });

    it('result item count is less than input when clustering', () => {
      const edges = Array.from({ length: 30 }, (_, i) =>
        makeEdge(`e${i}`, `g${i % 4}`, `g${(i + 1) % 4}`)
      );
      const result = clusterBoundedEdges(edges);
      expect(result.type).toBe('cluster');
      expect(result.items.length).toBeLessThan(30);
      expect(result.items.length).toBeLessThanOrEqual(MAX_EDGES_VISIBLE);
    });

    it('cluster label format is "+N"', () => {
      const edges = Array.from({ length: 25 }, (_, i) =>
        makeEdge(`e${i}`, 'g1', `g${i + 100}`)
      );
      const result = clusterBoundedEdges(edges);
      const clusters = result.items.filter((i): i is Extract<typeof result.items[number], { kind: 'cluster' }> => i.kind === 'cluster');
      expect(clusters.length).toBeGreaterThan(0);
      clusters.forEach((c) => {
        expect(c.label).toMatch(/^\+\d+$/);
        // Label should reflect merged count (excess over 1)
        const expectedLabel = `+${c.edges.length - 1}`;
        expect(c.label).toBe(expectedLabel);
      });
    });

    it('cluster item contains representative edge and all grouped edges', () => {
      const edges = Array.from({ length: 8 }, (_, i) =>
        makeEdge(`e${i}`, 'src', `tgt${i}`)
      );
      const result = clusterBoundedEdges(edges);
      // All 8 edges from 'src' exceed threshold → cluster
      const clusterItems = result.items.filter((i) => i.kind === 'cluster');
      const cluster = clusterItems.find(
        (i) => i.groupKey === 'src'
      ) as typeof clusterItems[number] | undefined;
      expect(cluster).toBeDefined();
      expect(cluster!.edges).toHaveLength(8);
      expect(cluster!.representative).toBeDefined();
      expect(cluster!.label).toBe('+7');
    });
  });

  describe('safety cap: always returns ≤ MAX_EDGES_VISIBLE items', () => {
    it('caps result even with pathological input (all edges same source)', () => {
      const edges = Array.from({ length: 100 }, (_, i) =>
        makeEdge(`e${i}`, 'all-same-source', `g${i + 100}`)
      );
      const result = clusterBoundedEdges(edges);
      expect(result.type).toBe('cluster');
      expect(result.items.length).toBeLessThanOrEqual(MAX_EDGES_VISIBLE);
    });

    it('caps result with many small groups all just above threshold', () => {
      // 7 groups × 4 edges = 28 edges, each group exceeds threshold of 3
      const edges: BoundedEdge[] = [];
      for (let g = 0; g < 7; g++) {
        for (let e = 0; e < 4; e++) {
          edges.push(makeEdge(`e-g${g}-${e}`, `g${g}`, `tgt${g}-${e}`));
        }
      }
      const result = clusterBoundedEdges(edges);
      expect(result.items.length).toBeLessThanOrEqual(MAX_EDGES_VISIBLE);
    });
  });

  describe('edge type preserved in clustering', () => {
    it('cluster keeps representative edge type intact', () => {
      const edges: BoundedEdge[] = [
        { id: 'e1', from: { groupId: 'g1' }, to: { groupId: 'g2' }, type: 'composition' },
        { id: 'e2', from: { groupId: 'g1' }, to: { groupId: 'g3' }, type: 'dependency' },
        { id: 'e3', from: { groupId: 'g1' }, to: { groupId: 'g4' }, type: 'association' },
        { id: 'e4', from: { groupId: 'g1' }, to: { groupId: 'g5' }, type: 'composition' },
      ];
      // All g1 edges trigger cluster (4 > threshold of 3)
      const result = clusterBoundedEdges(edges);
      const clusterItems = result.items.filter((i) => i.kind === 'cluster');
      const cluster = clusterItems.find((i) => i.groupKey === 'g1') as typeof clusterItems[number] | undefined;
      expect(cluster).toBeDefined();
      // Representative is the first edge
      expect(cluster!.representative.type).toBe('composition');
    });
  });
});

describe('MAX_EDGES_VISIBLE constant', () => {
  it('is set to 20 as per PRD', () => {
    expect(MAX_EDGES_VISIBLE).toBe(20);
  });
});
