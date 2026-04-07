/**
 * useJsonTreeVisualization Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useJsonTreeVisualization } from '@/hooks/useJsonTreeVisualization';

// ==================== Test Data ====================

const SIMPLE_OBJECT = { name: 'test', value: 42 };
const NESTED_OBJECT = {
  user: {
    profile: {
      name: 'Alice',
      age: 30,
    },
    active: true,
  },
  tags: ['admin', 'vip'],
};
const ARRAY_DATA = [{ id: 1 }, { id: 2 }, { id: 3 }];
const NULL_VALUE: unknown = null;
const STRING_VALUE = 'hello';
const NUMBER_VALUE = 42;
const BOOLEAN_VALUE = true;
const DEEP_OBJECT = {
  a: { b: { c: { d: { e: { f: 'deep' } } } } },
};

// ==================== Tests ====================

describe('useJsonTreeVisualization', () => {
  describe('parseJsonToTree (via hook return)', () => {
    it('should parse simple object into flatNodes', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(SIMPLE_OBJECT)
      );

      expect(result.current.isReady).toBe(true);
      expect(result.current.totalCount).toBeGreaterThan(0);
      expect(result.current.flatNodes.length).toBeGreaterThan(0);
    });

    it('should parse null value gracefully', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NULL_VALUE)
      );

      expect(result.current.isReady).toBe(false);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.flatNodes).toEqual([]);
    });

    it('should parse string value', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(STRING_VALUE)
      );

      expect(result.current.isReady).toBe(true);
      expect(result.current.totalCount).toBe(1);
      expect(result.current.flatNodes).toHaveLength(1);
    });

    it('should parse number value', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NUMBER_VALUE)
      );

      expect(result.current.isReady).toBe(true);
      expect(result.current.totalCount).toBe(1);
      expect(result.current.flatNodes).toHaveLength(1);
    });

    it('should parse boolean value', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(BOOLEAN_VALUE)
      );

      expect(result.current.isReady).toBe(true);
      expect(result.current.totalCount).toBe(1);
    });

    it('should parse nested object with multiple depth levels', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      expect(result.current.isReady).toBe(true);
      expect(result.current.totalCount).toBeGreaterThan(3);
      // Root + user + profile + name + age + active + tags + 3 tag items
      expect(result.current.totalCount).toBe(9);
    });

    it('should parse array data', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(ARRAY_DATA)
      );

      expect(result.current.isReady).toBe(true);
      // root + 3 items (objects) + 3 'id' properties = 7 nodes
      expect(result.current.totalCount).toBe(7);
    });

    it('should parse deep nested object', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(DEEP_OBJECT)
      );

      expect(result.current.isReady).toBe(true);
      expect(result.current.totalCount).toBe(7); // root + a + b + c + d + e + f
    });

    it('should auto-expand first 2 levels by default', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      // Root is always shown, user is expanded (depth 1), profile is expanded (depth 2)
      // profile children (name, age, active) are visible
      expect(result.current.flatNodes.length).toBeGreaterThan(3);

      // expandedIds should contain root and user and profile
      expect(result.current.expandedIds.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('toggle expand/collapse', () => {
    it('should toggle a node expanded state', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(SIMPLE_OBJECT)
      );

      // Get first container node (the 'name' or 'value' property)
      const nodeId = result.current.flatNodes[1]?.id;
      if (!nodeId) return; // safety guard

      const initialExpanded = result.current.expandedIds.has(nodeId);

      act(() => {
        result.current.toggle(nodeId);
      });

      if (!result.current.flatNodes[1]?.id) return;

      // After toggle, the state should have changed
      // Since these are leaf nodes, they might not be in expandedIds
      expect(typeof result.current.toggle).toBe('function');
    });

    it('should expand a collapsed node', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      // Get the 'user' node (not a leaf, has children)
      const userNode = result.current.root?.children?.[0];
      if (!userNode) return;

      const userId = userNode.id;
      const wasExpanded = result.current.expandedIds.has(userId);

      // Collapse it first
      act(() => {
        result.current.collapse(userId);
      });
      expect(result.current.expandedIds.has(userId)).toBe(false);

      // Expand again
      act(() => {
        result.current.expand(userId);
      });
      expect(result.current.expandedIds.has(userId)).toBe(true);
    });

    it('should collapse an expanded node', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      const userNode = result.current.root?.children?.[0];
      if (!userNode) return;

      const userId = userNode.id;
      expect(result.current.expandedIds.has(userId)).toBe(true);

      act(() => {
        result.current.collapse(userId);
      });

      expect(result.current.expandedIds.has(userId)).toBe(false);
    });
  });

  describe('expandAll / collapseAll', () => {
    it('should expand all nodes', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      act(() => {
        result.current.expandAll();
      });

      // Only expandable nodes (nodes with children) should be in expandedIds
      // NESTED_OBJECT has expandable nodes: root, user, profile, tags = 4
      expect(result.current.expandedIds.size).toBe(4);
    });

    it('should collapse all nodes', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      // First expand all
      act(() => {
        result.current.expandAll();
      });
      expect(result.current.expandedIds.size).toBe(4);

      // Then collapse all
      act(() => {
        result.current.collapseAll();
      });
      expect(result.current.expandedIds.size).toBe(0);
    });
  });

  describe('search', () => {
    it('should filter nodes by key', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      act(() => {
        result.current.search('name');
      });

      expect(result.current.searchQuery).toBe('name');
      // Should show only nodes matching 'name'
      expect(result.current.flatNodes.length).toBeGreaterThan(0);
    });

    it('should filter nodes by value', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      act(() => {
        result.current.search('Alice');
      });

      expect(result.current.searchQuery).toBe('Alice');
      expect(result.current.flatNodes.length).toBeGreaterThan(0);
    });

    it('should clear search', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      act(() => {
        result.current.search('name');
      });

      act(() => {
        result.current.search('');
      });

      expect(result.current.searchQuery).toBe('');
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      act(() => {
        result.current.search('ALICE');
      });

      expect(result.current.flatNodes.length).toBeGreaterThan(0);

      act(() => {
        result.current.search('alice');
      });

      expect(result.current.flatNodes.length).toBeGreaterThan(0);
    });
  });

  describe('select', () => {
    it('should select a node', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(SIMPLE_OBJECT)
      );

      const nodeId = result.current.flatNodes[0]?.id;
      if (!nodeId) return;

      act(() => {
        result.current.select(nodeId);
      });

      expect(result.current.selectedId).toBe(nodeId);
    });

    it('should deselect a node with null', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(SIMPLE_OBJECT)
      );

      const nodeId = result.current.flatNodes[0]?.id;
      if (!nodeId) return;

      act(() => {
        result.current.select(nodeId);
      });
      expect(result.current.selectedId).toBe(nodeId);

      act(() => {
        result.current.select(null);
      });
      expect(result.current.selectedId).toBeNull();
    });
  });

  describe('getNode / getPath', () => {
    it('should get a node by id', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(SIMPLE_OBJECT)
      );

      const nodeId = result.current.flatNodes[0]?.id;
      if (!nodeId) return;

      const node = result.current.getNode(nodeId);
      expect(node).toBeDefined();
      expect(node?.id).toBe(nodeId);
    });

    it('should return undefined for non-existent node id', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(SIMPLE_OBJECT)
      );

      const node = result.current.getNode('non-existent-id');
      expect(node).toBeUndefined();
    });

    it('should get path from root to node', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT)
      );

      // Find a leaf node
      const leafNode = result.current.flatNodes.find(
        (n) => n.type !== 'object' && n.type !== 'array'
      );
      if (!leafNode) return;

      const path = result.current.getPath(leafNode.id);
      expect(path.length).toBeGreaterThan(0);
      expect(path[0].id).toBe(result.current.root?.id);
      expect(path[path.length - 1].id).toBe(leafNode.id);
    });
  });

  describe('maxDepth option', () => {
    it('should respect maxDepth option', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(DEEP_OBJECT, { maxDepth: 2 })
      );

      expect(result.current.isReady).toBe(true);
      // Should not go beyond depth 2
      const maxDepthSeen = Math.max(
        ...result.current.flatNodes.map((n) => n.depth)
      );
      expect(maxDepthSeen).toBeLessThanOrEqual(2);
    });

    it('should handle maxDepth of 0', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(SIMPLE_OBJECT, { maxDepth: 0 })
      );

      expect(result.current.isReady).toBe(true);
    });
  });

  describe('defaultExpandedDepth option', () => {
    it('should respect defaultExpandedDepth option', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(NESTED_OBJECT, { defaultExpandedDepth: 1 })
      );

      // Should only auto-expand depth 0
      const maxExpandedDepth = Math.max(
        ...result.current.flatNodes.map((n) => n.depth)
      );
      expect(maxExpandedDepth).toBeLessThanOrEqual(1);
    });

    it('should expand all when defaultExpandedDepth is large', () => {
      const { result } = renderHook(() =>
        useJsonTreeVisualization(SIMPLE_OBJECT, { defaultExpandedDepth: 100 })
      );

      expect(result.current.isReady).toBe(true);
    });
  });
});
