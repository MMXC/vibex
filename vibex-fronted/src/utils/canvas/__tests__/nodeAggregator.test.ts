/**
 * nodeAggregator.test.ts — S71-E3
 */
import { describe, it, expect } from 'vitest';
import { aggregateNodes, mockNodes } from '../nodeAggregator';
import type { Node } from '@xyflow/react';

const makeNode = (id: string, x: number, y: number): Node => ({
  id, position: { x, y }, data: { label: id }, type: 'card',
});

describe('aggregateNodes', () => {
  it('clusters nearby nodes into groups', () => {
    const nodes = [
      makeNode('n1', 0, 0),
      makeNode('n2', 10, 10),
      makeNode('n3', 300, 300),
    ];
    const clusters = aggregateNodes(nodes, { cellSize: 150 });
    expect(clusters.length).toBeLessThanOrEqual(3);
    const cluster = clusters.find(c => c.id === '0,0');
    expect(cluster).toBeDefined();
    expect(cluster!.count).toBe(2);
  });

  it('reduces 150 nodes to fewer than 50 clusters', () => {
    const nodes = mockNodes(150);
    const clusters = aggregateNodes(nodes, { cellSize: 100, maxClusters: 50 });
    expect(clusters.length).toBeLessThanOrEqual(50);
  });

  it('centroid is at cell center (cellSize=150, nodes at 0,0 and 100,100 → cell 0,0 center=75,75)', () => {
    const nodes = [
      makeNode('n1', 0, 0),
      makeNode('n2', 100, 100),
    ];
    const clusters = aggregateNodes(nodes, { cellSize: 150 });
    const cluster = clusters[0];
    // cell (0,0) center = 0*150 + 75 = 75, 75
    expect(cluster.centroidX).toBeCloseTo(75, 0);
    expect(cluster.centroidY).toBeCloseTo(75, 0);
  });

  it('sorts by count descending', () => {
    const nodes = [
      makeNode('a1', 0, 0), makeNode('a2', 10, 0),
      makeNode('b1', 3000, 0),
    ];
    const clusters = aggregateNodes(nodes, { cellSize: 200 });
    expect(clusters[0].count).toBeGreaterThanOrEqual(clusters[1].count);
  });
});
