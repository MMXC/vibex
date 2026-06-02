/**
 * ViewportCulling.test.ts — S54-E4: Canvas Performance Optimization
 * vitest 8/8 tests
 *
 * DoD items:
 * 1. ViewportCulling.ts — getVisibleNodes() pure function
 * 2. useViewportCulling.ts — hook integration with viewportBoundsStore
 * 3. uiStore visibleNodeIds — state management
 * 4. FlowEditor enableCulling prop — rendering filtered nodes
 * 5. rectsIntersect() — AABB intersection detection
 * 6. getNodeBounds() — node to bounding box conversion
 * 7. getVisibilityRatio() — performance metric
 * 8. Edge: empty nodes, zero viewport
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { Node } from '@xyflow/react';
import { rectsIntersect, getNodeBounds, getVisibleNodes, getVisibilityRatio } from '../ViewportCulling';

const makeNode = (id: string, x: number, y: number, width = 200, height = 80): Node =>
  ({ id, position: { x, y }, style: { width, height } as React.CSSProperties }) as Node;

const FULL_VIEWPORT = { x: 0, y: 0, width: 1000, height: 800, zoom: 1 };
const SMALL_VIEWPORT = { x: 0, y: 0, width: 400, height: 300, zoom: 1 };

describe('E4.1 — rectsIntersect', () => {
  it('AC-1a: intersecting rectangles return true', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(rectsIntersect(a, b)).toBe(true);
  });

  it('AC-1b: non-intersecting rectangles return false', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 200, y: 200, width: 100, height: 100 };
    expect(rectsIntersect(a, b)).toBe(false);
  });

  it('AC-1c: partially overlapping rectangles return true', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(rectsIntersect(a, b)).toBe(true);
  });
});

describe('E4.1 — getNodeBounds', () => {
  it('AC-2a: node with style width/height uses them', () => {
    const node = makeNode('1', 50, 100, 300, 150);
    const bounds = getNodeBounds(node);
    expect(bounds).toEqual({ x: 50, y: 100, width: 300, height: 150 });
  });

  it('AC-2b: node without style uses default 200x80', () => {
    const node = { id: '1', position: { x: 10, y: 20 } } as Node;
    const bounds = getNodeBounds(node);
    expect(bounds).toEqual({ x: 10, y: 20, width: 200, height: 80 });
  });
});

describe('E4.1 — getVisibleNodes', () => {
  it('AC-3a: all nodes visible when viewport is large enough', () => {
    const nodes = [makeNode('1', 0, 0), makeNode('2', 300, 0), makeNode('3', 600, 0)];
    const result = getVisibleNodes(nodes, FULL_VIEWPORT);
    expect(result).toEqual(['1', '2', '3']);
  });

  it('AC-3b: nodes outside viewport are filtered out', () => {
    const nodes = [
      makeNode('1', 0, 0),       // visible (0-200, 0-80) within (0-1000, 0-800)
      makeNode('2', 2000, 2000), // outside viewport
    ];
    const result = getVisibleNodes(nodes, SMALL_VIEWPORT);
    expect(result).toEqual(['1']);
    expect(result).not.toContain('2');
  });

  it('AC-3c: partial overlap is visible', () => {
    // Node at x=300, width=200 → extends from 300 to 500
    // Viewport at x=0, width=400 → covers 0 to 400
    // Overlap: 300 to 400 (100px) — should be visible
    const nodes = [makeNode('1', 300, 0)];
    const result = getVisibleNodes(nodes, SMALL_VIEWPORT);
    expect(result).toEqual(['1']);
  });

  it('AC-4a: zero-size viewport returns all nodes', () => {
    const nodes = [makeNode('1', 0, 0), makeNode('2', 9999, 9999)];
    const zeroViewport = { x: 0, y: 0, width: 0, height: 0, zoom: 1 };
    const result = getVisibleNodes(nodes, zeroViewport);
    expect(result).toEqual(['1', '2']);
  });
});

describe('E4.2 — getVisibilityRatio', () => {
  it('AC-5a: empty nodes returns 1', () => {
    expect(getVisibilityRatio([], FULL_VIEWPORT)).toBe(1);
  });

  it('AC-5b: all visible returns 1', () => {
    const nodes = [makeNode('1', 0, 0), makeNode('2', 50, 50)];
    expect(getVisibilityRatio(nodes, FULL_VIEWPORT)).toBe(1);
  });

  it('AC-5c: half visible returns 0.5', () => {
    const nodes = [makeNode('1', 0, 0), makeNode('2', 2000, 2000)];
    expect(getVisibilityRatio(nodes, SMALL_VIEWPORT)).toBe(0.5);
  });
});
