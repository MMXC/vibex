/**
 * OverlapHighlightLayer.test.tsx — Tests for E3-F2.1: 虚线框交集高亮
 */
// @ts-nocheck


import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OverlapHighlightLayer, computeIntersections, getIntersectionRect, rectsIntersect } from './OverlapHighlightLayer';
import type { BoundedGroup, BoundedGroupBBox } from '@/lib/canvas/types';

// =============================================================================
// Rectangle Utility Tests
// =============================================================================

describe('rectsIntersect', () => {
  it('returns true for overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(rectsIntersect(a, b)).toBe(true);
  });

  it('returns false for non-overlapping rectangles (horizontal)', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 200, y: 0, width: 100, height: 100 };
    expect(rectsIntersect(a, b)).toBe(false);
  });

  it('returns false for non-overlapping rectangles (vertical)', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 0, y: 200, width: 100, height: 100 };
    expect(rectsIntersect(a, b)).toBe(false);
  });

  it('returns true for rectangles that just touch', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 100, y: 0, width: 100, height: 100 };
    // Touching edges should not be considered intersect
    expect(rectsIntersect(a, b)).toBe(false);
  });

  it('returns true when one rectangle is fully inside another', () => {
    const a = { x: 0, y: 0, width: 200, height: 200 };
    const b = { x: 50, y: 50, width: 50, height: 50 };
    expect(rectsIntersect(a, b)).toBe(true);
  });
});

describe('getIntersectionRect', () => {
  it('returns intersection rectangle for overlapping rects', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    const result = getIntersectionRect(a, b);
    expect(result).toEqual({ x: 50, y: 50, width: 50, height: 50 });
  });

  it('returns null for non-overlapping rects', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 200, y: 200, width: 100, height: 100 };
    expect(getIntersectionRect(a, b)).toBeNull();
  });

  it('returns null when intersection is just a line (width=0)', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 100, y: 0, width: 100, height: 100 };
    expect(getIntersectionRect(a, b)).toBeNull();
  });

  it('returns full intersection when b is fully inside a', () => {
    const a = { x: 0, y: 0, width: 200, height: 200 };
    const b = { x: 50, y: 50, width: 50, height: 50 };
    expect(getIntersectionRect(a, b)).toEqual({ x: 50, y: 50, width: 50, height: 50 });
  });
});

describe('computeIntersections', () => {
  it('returns empty array when no groups', () => {
    const result = computeIntersections([]);
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no intersections', () => {
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 100, height: 100, nodeIds: ['n1'] },
      { groupId: 'g2', x: 200, y: 200, width: 100, height: 100, nodeIds: ['n2'] },
    ];
    const result = computeIntersections(bboxes);
    expect(result).toHaveLength(0);
  });

  it('returns one intersection for two overlapping groups', () => {
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 200, height: 100, nodeIds: ['n1'] },
      { groupId: 'g2', x: 150, y: 50, width: 200, height: 100, nodeIds: ['n2'] },
    ];
    const result = computeIntersections(bboxes);
    expect(result).toHaveLength(1);
    expect(result[0].groupA).toBe('g1');
    expect(result[0].groupB).toBe('g2');
    expect(result[0].x).toBe(150);
    expect(result[0].y).toBe(50);
    expect(result[0].width).toBe(50);
    expect(result[0].height).toBe(50);
  });

  it('returns multiple intersections for 3+ overlapping groups', () => {
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 200, height: 200, nodeIds: ['n1'] },
      { groupId: 'g2', x: 100, y: 0, width: 200, height: 200, nodeIds: ['n2'] },
      { groupId: 'g3', x: 0, y: 100, width: 200, height: 200, nodeIds: ['n3'] },
    ];
    const result = computeIntersections(bboxes);
    // g1-g2, g1-g3, g2-g3 = 3 intersections
    expect(result).toHaveLength(3);
  });

  it('does not count self-intersection', () => {
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 100, height: 100, nodeIds: ['n1'] },
    ];
    const result = computeIntersections(bboxes);
    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// Component Tests
// =============================================================================

describe('OverlapHighlightLayer', () => {
  it('renders nothing when groups have no intersections', () => {
    // Pass bboxes directly to ensure positions don't overlap
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 100, height: 100, nodeIds: ['n1'] },
      { groupId: 'g2', x: 500, y: 500, width: 100, height: 100, nodeIds: ['n2'] }, // Far apart — no intersection
    ];
    const { container } = render(<OverlapHighlightLayer groups={[]} bboxes={bboxes} />);
    expect(container.querySelector('.overlap-highlight-layer')).toBeNull();
  });

  it('renders overlap highlights when groups intersect', () => {
    // Use bboxes directly to simulate intersecting groups
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 200, height: 200, nodeIds: ['n1'] },
      { groupId: 'g2', x: 150, y: 150, width: 200, height: 200, nodeIds: ['n2'] },
    ];
    const { container } = render(
      <OverlapHighlightLayer groups={[]} bboxes={bboxes} />
    );
    const svg = container.querySelector('.overlap-highlight-layer');
    expect(svg).not.toBeNull();
    const highlights = container.querySelectorAll('.overlap-highlight');
    expect(highlights.length).toBe(1);
  });

  it('SVG layer has pointer-events: none', () => {
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 200, height: 200, nodeIds: ['n1'] },
      { groupId: 'g2', x: 150, y: 150, width: 200, height: 200, nodeIds: ['n2'] },
    ];
    const { container } = render(
      <OverlapHighlightLayer groups={[]} bboxes={bboxes} />
    );
    const svg = container.querySelector('.overlap-highlight-layer') as SVGSVGElement;
    expect(svg.style.pointerEvents).toBe('none');
  });

  it('applies zoom and pan transforms to SVG group', () => {
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 200, height: 200, nodeIds: ['n1'] },
      { groupId: 'g2', x: 150, y: 150, width: 200, height: 200, nodeIds: ['n2'] },
    ];
    const { container } = render(
      <OverlapHighlightLayer groups={[]} bboxes={bboxes} zoom={1.5} pan={{ x: 100, y: 50 }} />
    );
    const g = container.querySelector('.overlap-highlight-layer g');
    expect(g).not.toBeNull();
    expect(g!.getAttribute('transform')).toContain('translate(100, 50)');
    expect(g!.getAttribute('transform')).toContain('scale(1.5)');
  });

  it('renders correct z-index (20)', () => {
    const bboxes: BoundedGroupBBox[] = [
      { groupId: 'g1', x: 0, y: 0, width: 200, height: 200, nodeIds: ['n1'] },
      { groupId: 'g2', x: 150, y: 150, width: 200, height: 200, nodeIds: ['n2'] },
    ];
    const { container } = render(
      <OverlapHighlightLayer groups={[]} bboxes={bboxes} />
    );
    const svg = container.querySelector('.overlap-highlight-layer') as SVGSVGElement;
    expect(svg.style.zIndex).toBe('20');
  });

  it('renders nothing when groups array is empty', () => {
    const { container } = render(<OverlapHighlightLayer groups={[]} />);
    expect(container.querySelector('.overlap-highlight-layer')).toBeNull();
  });
});
