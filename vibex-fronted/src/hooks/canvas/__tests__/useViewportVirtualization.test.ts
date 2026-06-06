/**
 * useViewportVirtualization.test.ts — S71-E3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useViewportVirtualization, filterNodesByViewport } from '../useViewportVirtualization';
import type { Node } from '@xyflow/react';

const makeNode = (id: string, x: number, y: number): Node => ({
  id, position: { x, y }, data: { label: id }, type: 'card',
});

describe('filterNodesByViewport', () => {
  it('returns only nodes within viewport bounds', () => {
    const nodes = [
      makeNode('n1', 100, 100),   // visible
      makeNode('n2', 2000, 2000), // far outside
      makeNode('n3', 50, 50),    // visible
    ];
    const viewport = { x: 0, y: 0, zoom: 1, width: 500, height: 500 };
    const result = filterNodesByViewport(nodes, viewport, 50);
    expect(result.map(n => n.id)).toEqual(['n1', 'n3']);
  });

  it('handles zoom correctly — zoomed out shows more nodes', () => {
    const nodes = [makeNode('n1', 100, 100), makeNode('n2', 800, 800)];
    const viewport = { x: 0, y: 0, zoom: 0.5, width: 500, height: 500 };
    // At zoom 0.5, 500px = 1000 flow coords, so n2 at 800 is visible
    const result = filterNodesByViewport(nodes, viewport, 0);
    expect(result.map(n => n.id)).toEqual(['n1', 'n2']);
  });

  it('filters nodes outside viewport — pan left', () => {
    const nodes = [makeNode('n1', 0, 0), makeNode('n2', 300, 300)];
    // Viewport at origin (0,0) shows flow coords [0,500] × [0,500]
    const viewport = { x: 0, y: 0, zoom: 1, width: 500, height: 500 };
    const result = filterNodesByViewport(nodes, viewport, 0);
    // n1 at (0,0) is on boundary — in range; n2 at (300,300) is in range
    expect(result.map(n => n.id)).toEqual(['n1', 'n2']);
  });

  it('node outside right edge is filtered', () => {
    const nodes = [makeNode('n1', 0, 0), makeNode('n2', 1000, 0)];
    const viewport = { x: 0, y: 0, zoom: 1, width: 500, height: 500 };
    const result = filterNodesByViewport(nodes, viewport, 0);
    expect(result.map(n => n.id)).toEqual(['n1']);
  });
});

describe('useViewportVirtualization', () => {
  const viewport = { x: 0, y: 0, zoom: 1, width: 500, height: 500 };

  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns filtered nodes via hook', () => {
    const allNodes = [
      makeNode('n1', 100, 100),
      makeNode('n2', 5000, 5000),
    ];
    const { result } = renderHook(() =>
      useViewportVirtualization(allNodes, viewport)
    );
    expect(result.current.map(n => n.id)).toEqual(['n1']);
  });

  it('respects maxVisible limit', () => {
    const allNodes = Array.from({ length: 300 }, (_, i) => makeNode(`n${i}`, i * 10, 0));
    const { result } = renderHook(() =>
      useViewportVirtualization(allNodes, viewport, { maxVisible: 50 })
    );
    expect(result.current.length).toBeLessThanOrEqual(50);
  });
});
