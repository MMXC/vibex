/**
 * Tests for useFlowVisualization hook
 */

import { renderHook, act } from '@testing-library/react';
import { useFlowVisualization, useFlowVisualizationWithStore } from '@/hooks/useFlowVisualization';
import type { FlowVisualizationRaw } from '@/types/visualization';

describe('useFlowVisualization', () => {
  const emptyData: FlowVisualizationRaw = { nodes: [], edges: [] };

  describe('parseFlowData', () => {
    it('should return empty arrays for null data', () => {
      const { result } = renderHook(() => useFlowVisualization(null));
      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
      expect(result.current.isReady).toBe(true);
      expect(result.current.nodeCount).toBe(0);
      expect(result.current.edgeCount).toBe(0);
    });

    it('should return empty arrays for undefined data', () => {
      const { result } = renderHook(() => useFlowVisualization(undefined));
      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
    });

    it('should parse nodes with id, position, label', () => {
      const data: FlowVisualizationRaw = {
        nodes: [
          { id: 'node-1', position: { x: 100, y: 200 }, data: { label: 'Start' } },
          { id: 'node-2', position: { x: 300, y: 400 }, data: { label: 'End' } },
        ],
        edges: [],
      };

      const { result } = renderHook(() => useFlowVisualization(data));

      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.nodes[0].id).toBe('node-1');
      expect(result.current.nodes[0].position).toEqual({ x: 100, y: 200 });
      expect(result.current.nodes[0].data.label).toBe('Start');
      expect(result.current.nodes[1].data.label).toBe('End');
      expect(result.current.nodeCount).toBe(2);
    });

    it('should parse edges with source, target', () => {
      const data: FlowVisualizationRaw = {
        nodes: [
          { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'A' } },
          { id: 'n2', position: { x: 100, y: 100 }, data: { label: 'B' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', label: 'goes to' },
        ],
      };

      const { result } = renderHook(() => useFlowVisualization(data));

      expect(result.current.edges).toHaveLength(1);
      expect(result.current.edges[0].id).toBe('e1');
      expect(result.current.edges[0].source).toBe('n1');
      expect(result.current.edges[0].target).toBe('n2');
      expect(result.current.edges[0].label).toBe('goes to');
      expect(result.current.edgeCount).toBe(1);
    });

    it('should handle missing optional fields gracefully', () => {
      const data: FlowVisualizationRaw = {
        nodes: [{ id: 'n1', position: { x: 0, y: 0 } }],
        edges: [{ id: 'e1', source: 'n1', target: 'n1' }],
      };

      const { result } = renderHook(() => useFlowVisualization(data));

      expect(result.current.nodes[0].data).toEqual({ label: 'Node' });
      expect(result.current.edges[0].type).toBe('smoothstep');
    });

    it('should preserve ReactFlow-format nodes (id + position)', () => {
      const data: FlowVisualizationRaw = {
        nodes: [
          {
            id: 'rf-node',
            position: { x: 50, y: 50 },
            data: { label: 'RF Node' },
            type: 'input',
          },
        ],
        edges: [],
      };

      const { result } = renderHook(() => useFlowVisualization(data));

      expect(result.current.nodes[0].id).toBe('rf-node');
      expect(result.current.nodes[0].type).toBe('input');
    });
  });

  describe('getConnectedEdges', () => {
    it('should return edges connected to a node', () => {
      const data: FlowVisualizationRaw = {
        nodes: [
          { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'A' } },
          { id: 'n2', position: { x: 100, y: 100 }, data: { label: 'B' } },
          { id: 'n3', position: { x: 200, y: 200 }, data: { label: 'C' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n2', target: 'n3' },
          { id: 'e3', source: 'n1', target: 'n3' },
        ],
      };

      const { result } = renderHook(() => useFlowVisualization(data));

      const connectedToN1 = result.current.getConnectedEdges('n1');
      expect(connectedToN1).toHaveLength(2);
      expect(connectedToN1.map((e) => e.id)).toEqual(['e1', 'e3']);

      const connectedToN2 = result.current.getConnectedEdges('n2');
      expect(connectedToN2).toHaveLength(2);
      expect(connectedToN2.map((e) => e.id)).toEqual(['e1', 'e2']);
    });
  });

  describe('getConnectedNodes', () => {
    it('should return nodes connected to a given node', () => {
      const data: FlowVisualizationRaw = {
        nodes: [
          { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'A' } },
          { id: 'n2', position: { x: 100, y: 100 }, data: { label: 'B' } },
          { id: 'n3', position: { x: 200, y: 200 }, data: { label: 'C' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n2', target: 'n3' },
        ],
      };

      const { result } = renderHook(() => useFlowVisualization(data));

      const connected = result.current.getConnectedNodes('n2');
      expect(connected.map((n) => n.id)).toEqual(['n1', 'n3']);
    });

    it('should not include the node itself', () => {
      const data: FlowVisualizationRaw = {
        nodes: [
          { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'A' } },
          { id: 'n2', position: { x: 100, y: 100 }, data: { label: 'B' } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      };

      const { result } = renderHook(() => useFlowVisualization(data));

      const connected = result.current.getConnectedNodes('n1');
      expect(connected.some((n) => n.id === 'n1')).toBe(false);
    });
  });

  describe('getNode', () => {
    it('should return node by id', () => {
      const data: FlowVisualizationRaw = {
        nodes: [
          { id: 'found', position: { x: 0, y: 0 }, data: { label: 'Found' } },
          { id: 'other', position: { x: 100, y: 100 }, data: { label: 'Other' } },
        ],
        edges: [],
      };

      const { result } = renderHook(() => useFlowVisualization(data));

      expect(result.current.getNode('found')?.data.label).toBe('Found');
      expect(result.current.getNode('nonexistent')).toBeUndefined();
    });
  });

  describe('isReady', () => {
    it('should be true when data is provided', () => {
      const { result } = renderHook(() => useFlowVisualization(emptyData));
      expect(result.current.isReady).toBe(true);
    });

    it('should be true when data is null', () => {
      const { result } = renderHook(() => useFlowVisualization(null));
      expect(result.current.isReady).toBe(true);
    });
  });
});
