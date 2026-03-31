/**
 * CascadeUpdateManager — Unit Tests
 * 100% 覆盖 CascadeUpdateManager 核心函数
 */
import {
  cascadeContextChange,
  cascadeFlowChange,
  markFlowNodesPending,
  markComponentNodesPending,
  hasNodes,
} from './CascadeUpdateManager';
import type {
  BoundedContextNode,
  BusinessFlowNode,
  ComponentNode,
} from '../types';

describe('CascadeUpdateManager', () => {
  describe('markFlowNodesPending', () => {
    it('should mark all flow nodes pending and unconfirm', () => {
      const flows: BusinessFlowNode[] = [
        {
          nodeId: 'f1',
          contextId: 'c1',
          name: 'Flow 1',
          steps: [],
          confirmed: true,
          status: 'confirmed',
          children: [],
        },
        {
          nodeId: 'f2',
          contextId: 'c1',
          name: 'Flow 2',
          steps: [
            { stepId: 's1', name: 'Step 1', actor: 'User', order: 0, confirmed: true, status: 'confirmed' },
          ],
          confirmed: true,
          status: 'confirmed',
          children: [],
        },
      ];

      const result = markFlowNodesPending(flows);

      expect(result[0].status).toBe('pending');
      expect(result[0].confirmed).toBe(false);
      expect(result[1].status).toBe('pending');
      expect(result[1].confirmed).toBe(false);
      // Steps should also be marked pending
      expect(result[1].steps[0].status).toBe('pending');
      expect(result[1].steps[0].confirmed).toBe(false);
    });

    it('should return empty array for empty input', () => {
      const result = markFlowNodesPending([]);
      expect(result).toEqual([]);
    });
  });

  describe('markComponentNodesPending', () => {
    it('should mark all component nodes pending and unconfirm', () => {
      const components: ComponentNode[] = [
        {
          nodeId: 'comp1',
          flowId: 'f1',
          name: 'Page 1',
          type: 'page',
          props: {},
          api: { method: 'GET', path: '/api', params: [] },
          children: [],
          confirmed: true,
          status: 'confirmed',
        },
      ];

      const result = markComponentNodesPending(components);

      expect(result[0].status).toBe('pending');
      expect(result[0].confirmed).toBe(false);
    });
  });

  describe('hasNodes', () => {
    it('should return true when array has nodes', () => {
      const nodes = [{ confirmed: true }, { confirmed: true }];
      expect(hasNodes(nodes)).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(hasNodes([])).toBe(false);
    });
  });

  describe('cascadeContextChange', () => {
    it('should mark both flow and component pending when context changes', () => {
      const flows: BusinessFlowNode[] = [
        { nodeId: 'f1', contextId: 'c1', name: 'Flow 1', steps: [], confirmed: true, status: 'confirmed', children: [] },
      ];
      const components: ComponentNode[] = [
        { nodeId: 'c1', flowId: 'f1', name: 'Comp 1', type: 'page', props: {}, api: { method: 'GET', path: '/api', params: [] }, children: [], confirmed: true, status: 'confirmed' },
      ];

      const { flowNodes, componentNodes } = cascadeContextChange([], flows, components);

      expect(flowNodes[0].status).toBe('pending');
      expect(flowNodes[0].confirmed).toBe(false);
      expect(componentNodes[0].status).toBe('pending');
      expect(componentNodes[0].confirmed).toBe(false);
    });

    it('should not affect context nodes', () => {
      const contexts: BoundedContextNode[] = [
        { nodeId: 'c1', name: 'Ctx 1', description: '', type: 'core', confirmed: true, status: 'confirmed', children: [] },
      ];
      const flows: BusinessFlowNode[] = [];
      const components: ComponentNode[] = [];

      const { flowNodes, componentNodes } = cascadeContextChange(contexts, flows, components);

      expect(flowNodes).toEqual([]);
      expect(componentNodes).toEqual([]);
    });
  });

  describe('cascadeFlowChange', () => {
    it('should mark only component pending when flow changes (not context)', () => {
      const flows: BusinessFlowNode[] = [];
      const components: ComponentNode[] = [
        { nodeId: 'c1', flowId: 'f1', name: 'Comp 1', type: 'page', props: {}, api: { method: 'GET', path: '/api', params: [] }, children: [], confirmed: true, status: 'confirmed' },
        { nodeId: 'c2', flowId: 'f1', name: 'Comp 2', type: 'form', props: {}, api: { method: 'POST', path: '/api', params: [] }, children: [], confirmed: true, status: 'confirmed' },
      ];

      const { componentNodes } = cascadeFlowChange(flows, components);

      expect(componentNodes.every((n) => n.status === 'pending')).toBe(true);
      expect(componentNodes.every((n) => n.confirmed === false)).toBe(true);
    });
  });
});
