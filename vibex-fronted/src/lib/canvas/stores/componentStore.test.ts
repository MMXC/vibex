/**
 * componentStore unit tests — Epic 4
 * Tests component node CRUD, draft state, and multi-select.
 */
import type { ComponentNode } from '../types';
import { useComponentStore } from './componentStore';

describe('useComponentStore', () => {
  beforeEach(() => {
    useComponentStore.setState({
      componentNodes: [],
      componentDraft: null,
      selectedNodeIds: [],
    });
  });

  describe('component node CRUD', () => {
    it('should add a component node', () => {
      useComponentStore.getState().addComponentNode({
        name: '首页',
        type: 'page',
        flowId: 'flow-1',
        props: {},
        api: { method: 'GET', path: '/api/home', params: [] },
      });
      const nodes = useComponentStore.getState().componentNodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('首页');
      expect(nodes[0].type).toBe('page');
      expect(nodes[0].status).toBe('pending');
    });

    it('should set component nodes', () => {
      const nodes: ComponentNode[] = [{
        nodeId: 'comp-1',
        name: '列表页',
        type: 'list',
        flowId: 'flow-1',
        props: {},
        api: { method: 'GET', path: '/api/list', params: [] },
        status: 'confirmed',
        isActive: true,
        children: [],
      }];
      useComponentStore.getState().setComponentNodes(nodes);
      expect(useComponentStore.getState().componentNodes.length).toBe(1);
    });

    it('should edit a component node', () => {
      useComponentStore.getState().addComponentNode({
        name: 'Original',
        type: 'page',
        flowId: 'flow-1',
        props: {},
        api: { method: 'GET', path: '/api/original', params: [] },
      });
      const nodeId = useComponentStore.getState().componentNodes[0].nodeId;
      useComponentStore.getState().editComponentNode(nodeId, { name: 'Updated' });
      expect(useComponentStore.getState().componentNodes[0].name).toBe('Updated');
      expect(useComponentStore.getState().componentNodes[0].status).toBe('pending');
    });

    it('should delete a component node', () => {
      useComponentStore.getState().addComponentNode({
        name: 'ToDelete',
        type: 'modal',
        flowId: 'flow-1',
        props: {},
        api: { method: 'POST', path: '/api/modal', params: [] },
      });
      expect(useComponentStore.getState().componentNodes.length).toBe(1);
      const nodeId = useComponentStore.getState().componentNodes[0].nodeId;
      useComponentStore.getState().deleteComponentNode(nodeId);
      expect(useComponentStore.getState().componentNodes.length).toBe(0);
    });

    it('should add multiple component nodes', () => {
      useComponentStore.getState().addComponentNode({
        name: 'Page1', type: 'page', flowId: 'flow-1', props: {}, api: { method: 'GET', path: '/p1', params: [] },
      });
      useComponentStore.getState().addComponentNode({
        name: 'Page2', type: 'page', flowId: 'flow-1', props: {}, api: { method: 'GET', path: '/p2', params: [] },
      });
      expect(useComponentStore.getState().componentNodes.length).toBe(2);
    });
  });

  describe('draft state', () => {
    it('should set component draft', () => {
      expect(useComponentStore.getState().componentDraft).toBeNull();
      useComponentStore.getState().setComponentDraft({ name: 'Draft Component' });
      expect(useComponentStore.getState().componentDraft?.name).toBe('Draft Component');
    });

    it('should clear component draft', () => {
      useComponentStore.getState().setComponentDraft({ name: 'Draft' });
      useComponentStore.getState().setComponentDraft(null);
      expect(useComponentStore.getState().componentDraft).toBeNull();
    });
  });

  describe('multi-select', () => {
    beforeEach(() => {
      useComponentStore.getState().addComponentNode({
        name: 'Comp1', type: 'page', flowId: 'flow-1', props: {}, api: { method: 'GET', path: '/c1', params: [] },
      });
      useComponentStore.getState().addComponentNode({
        name: 'Comp2', type: 'list', flowId: 'flow-1', props: {}, api: { method: 'GET', path: '/c2', params: [] },
      });
    });

    it('should toggle select a node', () => {
      const nodeId = useComponentStore.getState().componentNodes[0].nodeId;
      useComponentStore.getState().toggleNodeSelect(nodeId);
      expect(useComponentStore.getState().selectedNodeIds).toContain(nodeId);

      useComponentStore.getState().toggleNodeSelect(nodeId);
      expect(useComponentStore.getState().selectedNodeIds).not.toContain(nodeId);
    });

    it('should select a single node', () => {
      const nodeId = useComponentStore.getState().componentNodes[0].nodeId;
      useComponentStore.getState().selectNode(nodeId);
      expect(useComponentStore.getState().selectedNodeIds).toEqual([nodeId]);
    });

    it('should clear node selection', () => {
      const [id1, id2] = useComponentStore.getState().componentNodes.map(n => n.nodeId);
      useComponentStore.getState().toggleNodeSelect(id1);
      useComponentStore.getState().toggleNodeSelect(id2);
      useComponentStore.getState().clearNodeSelection();
      expect(useComponentStore.getState().selectedNodeIds).toEqual([]);
    });

    it('should select all nodes', () => {
      useComponentStore.getState().selectAllNodes();
      const ids = useComponentStore.getState().selectedNodeIds;
      const nodeIds = useComponentStore.getState().componentNodes.map(n => n.nodeId);
      expect(ids).toEqual(nodeIds);
    });

    it('should delete selected nodes', () => {
      const [id1, id2] = useComponentStore.getState().componentNodes.map(n => n.nodeId);
      useComponentStore.getState().toggleNodeSelect(id1);
      useComponentStore.getState().toggleNodeSelect(id2);
      useComponentStore.getState().deleteSelectedNodes();
      expect(useComponentStore.getState().componentNodes.length).toBe(0);
      expect(useComponentStore.getState().selectedNodeIds).toEqual([]);
    });

    it('should do nothing when deleteSelectedNodes called with no selection', () => {
      const initialCount = useComponentStore.getState().componentNodes.length;
      useComponentStore.getState().deleteSelectedNodes();
      expect(useComponentStore.getState().componentNodes.length).toBe(initialCount);
    });
  });
});
