/**
 * Canvas Store — Multi-Select Unit Tests
 * F3-F10: 多选节点
 */
// @ts-nocheck


import { act, renderHook } from '@testing-library/react';
import { useCanvasStore } from '../canvasStore';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '../types';

// Helper to seed store with test data
function seedContextNodes() {
  const { result } = renderHook(() => useCanvasStore());
  act(() => {
    result.current.setContextNodes([
      {
        nodeId: 'ctx-1',
        name: '测试上下文1',
        description: '测试描述1',
        type: 'core',
        confirmed: false,
        status: 'pending',
        children: [],
      },
      {
        nodeId: 'ctx-2',
        name: '测试上下文2',
        description: '测试描述2',
        type: 'supporting',
        confirmed: false,
        status: 'pending',
        children: [],
      },
      {
        nodeId: 'ctx-3',
        name: '测试上下文3',
        description: '测试描述3',
        type: 'generic',
        confirmed: false,
        status: 'pending',
        children: [],
      },
    ]);
  });
}

function seedFlowNodes() {
  const { result } = renderHook(() => useCanvasStore());
  act(() => {
    result.current.setFlowNodes([
      {
        nodeId: 'flow-1',
        contextId: 'ctx-1',
        name: '测试流程1',
        steps: [],
        confirmed: false,
        status: 'pending',
      },
      {
        nodeId: 'flow-2',
        contextId: 'ctx-1',
        name: '测试流程2',
        steps: [],
        confirmed: false,
        status: 'pending',
      },
    ]);
  });
}

function seedComponentNodes() {
  const { result } = renderHook(() => useCanvasStore());
  act(() => {
    result.current.setComponentNodes([
      {
        nodeId: 'comp-1',
        flowId: 'flow-1',
        name: '测试组件1',
        type: 'page',
        props: {},
        api: { method: 'GET', path: '/api/1', params: [] },
        confirmed: false,
        status: 'pending',
        children: [],
      },
      {
        nodeId: 'comp-2',
        flowId: 'flow-1',
        name: '测试组件2',
        type: 'list',
        props: {},
        api: { method: 'GET', path: '/api/2', params: [] },
        confirmed: false,
        status: 'pending',
        children: [],
      },
    ]);
  });
}

describe('CanvasStore — Multi-Select (F3-F10)', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCanvasStore());
    act(() => {
      result.current.setContextNodes([]);
      result.current.setFlowNodes([]);
      result.current.setComponentNodes([]);
      result.current.clearNodeSelection('context');
      result.current.clearNodeSelection('flow');
      result.current.clearNodeSelection('component');
    });
  });

  describe('toggleNodeSelect', () => {
    it('should add node to selection when not selected', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();

      act(() => {
        result.current.toggleNodeSelect('context', 'ctx-1');
      });

      expect(result.current.selectedNodeIds.context).toContain('ctx-1');
    });

    it('should remove node from selection when already selected', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();

      act(() => {
        result.current.toggleNodeSelect('context', 'ctx-1');
        result.current.toggleNodeSelect('context', 'ctx-1');
      });

      expect(result.current.selectedNodeIds.context).not.toContain('ctx-1');
    });

    it('should allow selecting multiple nodes in same tree', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();

      act(() => {
        result.current.toggleNodeSelect('context', 'ctx-1');
        result.current.toggleNodeSelect('context', 'ctx-2');
        result.current.toggleNodeSelect('context', 'ctx-3');
      });

      expect(result.current.selectedNodeIds.context).toHaveLength(3);
      expect(result.current.selectedNodeIds.context).toEqual(['ctx-1', 'ctx-2', 'ctx-3']);
    });

    it('should support selecting across different trees', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();
      seedFlowNodes();

      act(() => {
        result.current.toggleNodeSelect('context', 'ctx-1');
        result.current.toggleNodeSelect('flow', 'flow-1');
      });

      expect(result.current.selectedNodeIds.context).toContain('ctx-1');
      expect(result.current.selectedNodeIds.flow).toContain('flow-1');
    });
  });

  describe('selectNode', () => {
    it('should select single node and clear previous selection', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();

      act(() => {
        result.current.toggleNodeSelect('context', 'ctx-1');
        result.current.toggleNodeSelect('context', 'ctx-2');
        result.current.selectNode('context', 'ctx-3');
      });

      expect(result.current.selectedNodeIds.context).toEqual(['ctx-3']);
    });
  });

  describe('clearNodeSelection', () => {
    it('should clear all selections for a tree', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();

      act(() => {
        result.current.toggleNodeSelect('context', 'ctx-1');
        result.current.toggleNodeSelect('context', 'ctx-2');
        result.current.clearNodeSelection('context');
      });

      expect(result.current.selectedNodeIds.context).toHaveLength(0);
    });
  });

  describe('selectAllNodes', () => {
    it('should select all nodes in a tree', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();

      act(() => {
        result.current.selectAllNodes('context');
      });

      expect(result.current.selectedNodeIds.context).toEqual(['ctx-1', 'ctx-2', 'ctx-3']);
    });
  });

  describe('deleteSelectedNodes', () => {
    it('should delete all selected nodes in a tree', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();

      act(() => {
        result.current.toggleNodeSelect('context', 'ctx-1');
        result.current.toggleNodeSelect('context', 'ctx-2');
        result.current.deleteSelectedNodes('context');
      });

      expect(result.current.contextNodes).toHaveLength(1);
      expect(result.current.contextNodes[0].nodeId).toBe('ctx-3');
      expect(result.current.selectedNodeIds.context).toHaveLength(0);
    });

    it('should do nothing when no nodes selected', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedContextNodes();
      const initialCount = result.current.contextNodes.length;

      act(() => {
        result.current.deleteSelectedNodes('context');
      });

      expect(result.current.contextNodes).toHaveLength(initialCount);
    });
  });

  describe('Flow tree multi-select', () => {
    it('should support selecting flow nodes', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedFlowNodes();

      act(() => {
        result.current.toggleNodeSelect('flow', 'flow-1');
        result.current.selectAllNodes('flow');
      });

      expect(result.current.selectedNodeIds.flow).toEqual(['flow-1', 'flow-2']);
    });

    it('should delete selected flow nodes', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedFlowNodes();

      act(() => {
        result.current.toggleNodeSelect('flow', 'flow-1');
        result.current.deleteSelectedNodes('flow');
      });

      expect(result.current.flowNodes).toHaveLength(1);
      expect(result.current.flowNodes[0].nodeId).toBe('flow-2');
    });
  });

  describe('Component tree multi-select', () => {
    it('should support selecting component nodes', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedComponentNodes();

      act(() => {
        result.current.toggleNodeSelect('component', 'comp-1');
      });

      expect(result.current.selectedNodeIds.component).toContain('comp-1');
    });

    it('should delete selected component nodes', () => {
      const { result } = renderHook(() => useCanvasStore());
      seedComponentNodes();

      act(() => {
        result.current.toggleNodeSelect('component', 'comp-1');
        result.current.toggleNodeSelect('component', 'comp-2');
        result.current.deleteSelectedNodes('component');
      });

      expect(result.current.componentNodes).toHaveLength(0);
    });
  });
});
