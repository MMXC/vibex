/**
 * FlowEdgeLayer.test.tsx — Tests for E3-F3.3: 流程节点连线
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FlowEdgeLayer } from './FlowEdgeLayer';
import type { FlowEdge, NodeRect } from '@/lib/canvas/types';

const makeNodeRect = (id: string, x = 0, y = 0, w = 240, h = 200): NodeRect => ({
  id,
  x,
  y,
  width: w,
  height: h,
});

const makeFlowEdge = (
  id: string,
  from: string,
  to: string,
  type: FlowEdge['type'] = 'sequence',
  label?: string
): FlowEdge => ({
  id,
  from,
  to,
  type,
  label,
});

describe('FlowEdgeLayer', () => {
  describe('basic rendering', () => {
    it('renders nothing when edges array is empty', () => {
      const { container } = render(
        <FlowEdgeLayer edges={[]} nodeRects={[]} />
      );
      expect(container.querySelector('.flow-edge-layer')).toBeNull();
    });

    it('renders SVG layer with pointer-events: none when edges present', () => {
      const nodeRects = [makeNodeRect('n1', 0, 0), makeNodeRect('n2', 300, 0)];
      const edges = [makeFlowEdge('e1', 'n1', 'n2')];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const svg = container.querySelector('.flow-edge-layer');
      expect(svg).not.toBeNull();
      expect((svg as SVGSVGElement).style.pointerEvents).toBe('none');
    });

    it('renders one path per edge', () => {
      const nodeRects = [
        makeNodeRect('n1', 0, 0),
        makeNodeRect('n2', 300, 0),
        makeNodeRect('n3', 600, 0),
      ];
      const edges = [
        makeFlowEdge('e1', 'n1', 'n2'),
        makeFlowEdge('e2', 'n2', 'n3'),
      ];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const paths = container.querySelectorAll('.flow-edge-path');
      expect(paths.length).toBe(2);
    });

    it('skips edges where source or target node is missing', () => {
      const nodeRects = [makeNodeRect('n1', 0, 0)]; // n2 missing
      const edges = [makeFlowEdge('e1', 'n1', 'n2')];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const paths = container.querySelectorAll('.flow-edge-path');
      expect(paths.length).toBe(0);
    });
  });

  describe('edge type styling', () => {
    it('renders sequence edge with blue solid stroke', () => {
      const nodeRects = [makeNodeRect('n1', 0, 0), makeNodeRect('n2', 300, 0)];
      const edges = [makeFlowEdge('e1', 'n1', 'n2', 'sequence')];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const path = container.querySelector('.flow-edge-path') as SVGPathElement;
      expect(path.getAttribute('stroke')).toBe('#3b82f6');
    });

    it('renders branch edge with amber dashed stroke', () => {
      const nodeRects = [makeNodeRect('n1', 0, 0), makeNodeRect('n2', 300, 0)];
      const edges = [makeFlowEdge('e1', 'n1', 'n2', 'branch')];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const path = container.querySelector('.flow-edge-path') as SVGPathElement;
      expect(path.getAttribute('stroke')).toBe('#f59e0b');
      expect(path.getAttribute('stroke-dasharray')).toBe('5,3');
    });

    it('renders loop edge with violet stroke', () => {
      const nodeRects = [makeNodeRect('n1', 0, 0), makeNodeRect('n2', 300, 0)];
      const edges = [makeFlowEdge('e1', 'n1', 'n2', 'loop')];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const path = container.querySelector('.flow-edge-path') as SVGPathElement;
      expect(path.getAttribute('stroke')).toBe('#8b5cf6');
    });
  });

  describe('edge labels', () => {
    it('renders label text when edge has label', () => {
      const nodeRects = [makeNodeRect('n1', 0, 0), makeNodeRect('n2', 300, 0)];
      const edges = [makeFlowEdge('e1', 'n1', 'n2', 'branch', 'if approved')];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const label = container.querySelector('.flow-edge-label');
      expect(label).not.toBeNull();
      expect(label!.textContent).toBe('if approved');
    });
  });

  describe('viewport transform', () => {
    it('applies zoom and pan to SVG group', () => {
      const nodeRects = [makeNodeRect('n1', 0, 0), makeNodeRect('n2', 300, 0)];
      const edges = [makeFlowEdge('e1', 'n1', 'n2')];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} zoom={2} pan={{ x: 50, y: 20 }} />
      );
      const g = container.querySelector('.flow-edge-layer g');
      expect(g!.getAttribute('transform')).toContain('translate(50, 20)');
      expect(g!.getAttribute('transform')).toContain('scale(2)');
    });
  });

  describe('z-index', () => {
    it('has z-index: 40', () => {
      const nodeRects = [makeNodeRect('n1', 0, 0), makeNodeRect('n2', 300, 0)];
      const edges = [makeFlowEdge('e1', 'n1', 'n2')];
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const svg = container.querySelector('.flow-edge-layer') as SVGSVGElement;
      expect(svg.style.zIndex).toBe('40');
    });
  });

  describe('clustering (MAX_EDGES_VISIBLE = 20)', () => {
    it('renders all edges individually when count ≤ 20', () => {
      const nodeRects = Array.from({ length: 21 }, (_, i) =>
        makeNodeRect(`n${i}`, i * 300, 0)
      );
      const edges = Array.from({ length: 20 }, (_, i) =>
        makeFlowEdge(`e${i}`, `n${i}`, `n${i + 1}`)
      );
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const paths = container.querySelectorAll('.flow-edge-path');
      // All 20 edges rendered individually
      expect(paths.length).toBe(20);
      // No cluster paths
      const clusterPaths = container.querySelectorAll('.flow-cluster-edge-path');
      expect(clusterPaths.length).toBe(0);
    });

    it('clusters edges when count > 20', () => {
      const nodeRects = Array.from({ length: 26 }, (_, i) =>
        makeNodeRect(`n${i}`, i * 300, 0)
      );
      const edges = Array.from({ length: 25 }, (_, i) =>
        makeFlowEdge(`e${i}`, `n${i}`, `n${i + 1}`)
      );
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      // Should have fewer items than 25
      const allPaths = container.querySelectorAll('path');
      expect(allPaths.length).toBeLessThan(25);
    });

    it('shows +N cluster label when edges are clustered', () => {
      // All edges from n0 to various nodes → cluster
      const nodeRects = [
        makeNodeRect('n0', 0, 0),
        ...Array.from({ length: 25 }, (_, i) => makeNodeRect(`t${i}`, 300 + i * 100, 0)),
      ];
      const edges = Array.from({ length: 25 }, (_, i) =>
        makeFlowEdge(`e${i}`, 'n0', `t${i}`)
      );
      const { container } = render(
        <FlowEdgeLayer edges={edges} nodeRects={nodeRects} />
      );
      const clusterLabel = container.querySelector('.flow-cluster-label');
      expect(clusterLabel).not.toBeNull();
      expect(clusterLabel!.textContent).toMatch(/^\+\d+$/);
    });
  });
});
