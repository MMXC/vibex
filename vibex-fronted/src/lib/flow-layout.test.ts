/**
 * Flow Layout Tests
 */

import { autoLayout, LayoutDirection, LayoutOptions } from '@/lib/flow-layout';
import type { Node, Edge } from '@xyflow/react';

describe('flow-layout', () => {
  const mockNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
    { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
  ];

  const mockEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ];

  describe('autoLayout', () => {
    it('should apply default layout', () => {
      const result = autoLayout(mockNodes, mockEdges);
      
      expect(result).toHaveLength(3);
      // Check that positions are set
      result.forEach(node => {
        expect(node.position.x).toBeDefined();
        expect(node.position.y).toBeDefined();
      });
    });

    it('should apply layout with custom direction TB', () => {
      const options: LayoutOptions = { direction: 'TB' as LayoutDirection };
      const result = autoLayout(mockNodes, mockEdges, options);
      
      expect(result).toHaveLength(3);
    });

    it('should apply layout with custom direction LR', () => {
      const options: LayoutOptions = { direction: 'LR' as LayoutDirection };
      const result = autoLayout(mockNodes, mockEdges, options);
      
      expect(result).toHaveLength(3);
    });

    it('should apply layout with custom node dimensions', () => {
      const options: LayoutOptions = { nodeWidth: 200, nodeHeight: 100 };
      const result = autoLayout(mockNodes, mockEdges, options);
      
      expect(result).toHaveLength(3);
    });

    it('should apply layout with custom spacing', () => {
      const options: LayoutOptions = { nodeSpacing: 100, layerSpacing: 200 };
      const result = autoLayout(mockNodes, mockEdges, options);
      
      expect(result).toHaveLength(3);
    });

    it('should handle empty nodes', () => {
      const result = autoLayout([], []);
      
      expect(result).toHaveLength(0);
    });

    it('should handle nodes without edges', () => {
      const result = autoLayout(mockNodes, []);
      
      expect(result).toHaveLength(3);
    });

    it('should handle disconnected nodes', () => {
      const disconnectedNodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
        { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
      ];
      
      const result = autoLayout(disconnectedNodes, []);
      
      expect(result).toHaveLength(2);
    });

    it('should apply different ranker options', () => {
      const rankers = ['longest-path', 'tight-tree', 'network-simplex'] as const;
      
      rankers.forEach(ranker => {
        const options: LayoutOptions = { ranker };
        const result = autoLayout(mockNodes, mockEdges, options);
        expect(result).toHaveLength(3);
      });
    });
  });
});