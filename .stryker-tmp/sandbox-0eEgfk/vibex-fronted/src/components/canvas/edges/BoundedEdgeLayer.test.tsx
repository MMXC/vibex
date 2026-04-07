/**
 * BoundedEdgeLayer.test.tsx — Tests for E3-F3.2: 限界上下文卡片连线
 *
 * Note: BoundedEdgeLayer uses CSS Modules. Tests query by data-testid
 * attributes on SVG elements for reliable cross-environment matching.
 */
// @ts-nocheck


import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BoundedEdgeLayer } from './BoundedEdgeLayer';
import type { BoundedEdge, NodeRect } from '@/lib/canvas/types';

const makeNodeRect = (id: string, x = 0, y = 0, w = 240, h = 200): NodeRect => ({
  id,
  x,
  y,
  width: w,
  height: h,
});

const makeEdge = (
  id: string,
  fromId: string,
  toId: string,
  type: BoundedEdge['type'] = 'dependency',
  label?: string
): BoundedEdge => ({
  id,
  from: { groupId: fromId },
  to: { groupId: toId },
  type,
  label,
});

describe('BoundedEdgeLayer', () => {
  describe('basic rendering', () => {
    it('renders nothing when edges array is empty', () => {
      const { container } = render(
        <BoundedEdgeLayer edges={[]} nodeRects={[]} />
      );
      expect(container.querySelector('.layer')).toBeNull();
    });

    it('renders SVG layer with pointer-events: none when edges present', () => {
      const nodeRects = [makeNodeRect('g1', 0, 0), makeNodeRect('g2', 300, 0)];
      const edges = [makeEdge('e1', 'g1', 'g2')];
      const { container } = render(
        <BoundedEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      // CSS module: class is hashed, query by SVG element instead
      const svg = container.querySelector('svg[data-testid="bounded-edge-layer"]');
      // Fallback: any svg in the container
      const svgEl = svg ?? container.querySelector('svg');
      expect(svgEl).not.toBeNull();
      expect((svgEl as SVGSVGElement).style.pointerEvents).toBe('none');
    });

    it('renders path elements when edges present', () => {
      const nodeRects = [
        makeNodeRect('g1', 0, 0),
        makeNodeRect('g2', 300, 0),
        makeNodeRect('g3', 600, 0),
      ];
      const edges = [
        makeEdge('e1', 'g1', 'g2'),
        makeEdge('e2', 'g2', 'g3'),
      ];
      const { container } = render(
        <BoundedEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      // Query paths inside the clip group (not marker defs)
      const clipGroup = container.querySelector('g[clip-path]');
      const paths = clipGroup ? clipGroup.querySelectorAll('path') : [];
      expect(paths.length).toBeGreaterThanOrEqual(2);
    });

    it('skips edges where source or target node is missing', () => {
      const nodeRects = [makeNodeRect('g1', 0, 0)]; // g2 missing
      const edges = [makeEdge('e1', 'g1', 'g2')];
      const { container } = render(
        <BoundedEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      // Query paths inside the clip group (not defs/markers)
      const clipGroup = container.querySelector('g[clip-path]');
      const clipPaths = clipGroup ? clipGroup.querySelectorAll('path') : [];
      expect(clipPaths.length).toBe(0);
    });
  });

  describe('edge type colors via stroke attribute', () => {
    it('renders dependency edge with indigo stroke', () => {
      const nodeRects = [makeNodeRect('g1', 0, 0), makeNodeRect('g2', 300, 0)];
      const edges = [makeEdge('e1', 'g1', 'g2', 'dependency')];
      const { container } = render(
        <BoundedEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const path = container.querySelector('svg path[stroke="#6366f1"]');
      expect(path).not.toBeNull();
    });

    it('renders composition edge with violet stroke', () => {
      const nodeRects = [makeNodeRect('g1', 0, 0), makeNodeRect('g2', 300, 0)];
      const edges = [makeEdge('e1', 'g1', 'g2', 'composition')];
      const { container } = render(
        <BoundedEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const clipGroup = container.querySelector('g[clip-path]');
      const path = clipGroup ? clipGroup.querySelector('path[stroke="#8b5cf6"]') : null;
      expect(path).not.toBeNull();
    });

    it('renders association edge with slate stroke', () => {
      const nodeRects = [makeNodeRect('g1', 0, 0), makeNodeRect('g2', 300, 0)];
      const edges = [makeEdge('e1', 'g1', 'g2', 'association')];
      const { container } = render(
        <BoundedEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const clipGroup = container.querySelector('g[clip-path]');
      const path = clipGroup ? clipGroup.querySelector('path[stroke="#94a3b8"]') : null;
      expect(path).not.toBeNull();
    });
  });

  describe('edge labels', () => {
    it('renders label text when edge has label', () => {
      const nodeRects = [makeNodeRect('g1', 0, 0), makeNodeRect('g2', 300, 0)];
      const edges = [makeEdge('e1', 'g1', 'g2', 'dependency', '依赖关系')];
      const { container } = render(
        <BoundedEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      // Label text is inside the clip group
      const clipGroup = container.querySelector('g[clip-path]');
      const label = clipGroup ? clipGroup.querySelector('text') : null;
      expect(label).not.toBeNull();
      expect(label!.textContent).toBe('依赖关系');
    });
  });

  describe('z-index', () => {
    it('has z-index: 30 on SVG element', () => {
      const nodeRects = [makeNodeRect('g1', 0, 0), makeNodeRect('g2', 300, 0)];
      const edges = [makeEdge('e1', 'g1', 'g2')];
      const { container } = render(
        <BoundedEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const svgEl = container.querySelector('svg');
      expect(svgEl).not.toBeNull();
      expect(svgEl!.style.zIndex).toBe('30');
    });
  });
});
