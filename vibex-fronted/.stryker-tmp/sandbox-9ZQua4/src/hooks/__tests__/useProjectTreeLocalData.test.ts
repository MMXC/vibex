/**
 * Epic2: boundedContextsToCardTree 单元测试
 */
// @ts-nocheck


import { boundedContextsToCardTree } from '../useProjectTree';
import type { BoundedContext } from '@/types/homepage';

describe('boundedContextsToCardTree', () => {
  it('should convert empty contexts to empty nodes', () => {
    const result = boundedContextsToCardTree([]);
    expect(result.nodes).toHaveLength(0);
  });

  it('should convert single context with no relationships', () => {
    const ctx: BoundedContext = {
      id: 'ctx-1',
      name: 'User Management',
      description: 'Manages user accounts',
      type: 'core',
      relationships: [],
    };
    const result = boundedContextsToCardTree([ctx]);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].title).toBe('User Management');
    expect(result.nodes[0].description).toBe('Manages user accounts');
    expect(result.nodes[0].status).toBe('in-progress'); // core → in-progress
    expect(result.nodes[0].icon).toBe('🟣'); // core icon
    expect(result.nodes[0].children).toHaveLength(0);
  });

  it('should convert multiple contexts with relationships', () => {
    const ctx1: BoundedContext = {
      id: 'ctx-1',
      name: 'Order Context',
      description: 'Order management',
      type: 'supporting',
      relationships: [
        {
          id: 'rel-1',
          fromContextId: 'ctx-1',
          toContextId: 'ctx-2',
          type: 'downstream',
          description: 'Uses payment service',
        },
      ],
    };
    const ctx2: BoundedContext = {
      id: 'ctx-2',
      name: 'Payment Context',
      description: 'Payment processing',
      type: 'external',
      relationships: [],
    };
    const result = boundedContextsToCardTree([ctx1, ctx2]);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].children).toHaveLength(1);
    expect(result.nodes[0].children[0].label).toContain('payment');
  });

  it('should set pending status for non-core types', () => {
    const ctx: BoundedContext = {
      id: 'ctx-1',
      name: 'Generic Service',
      description: 'Generic service',
      type: 'generic',
      relationships: [],
    };
    const result = boundedContextsToCardTree([ctx]);
    expect(result.nodes[0].status).toBe('pending');
    expect(result.nodes[0].icon).toBe('⚪');
  });

  it('should include projectId and name', () => {
    const result = boundedContextsToCardTree([], 'proj-123');
    expect(result.projectId).toBe('proj-123');
    expect(result.name).toBe('项目分析');
  });

  it('should set updatedAt timestamp', () => {
    const ctx: BoundedContext = {
      id: 'ctx-1',
      name: 'Test',
      description: 'Test',
      type: 'core',
      relationships: [],
    };
    const before = new Date().toISOString();
    const result = boundedContextsToCardTree([ctx]);
    const after = new Date().toISOString();
    expect(result.nodes[0].updatedAt).toBeDefined();
    expect(result.nodes[0].updatedAt! >= before).toBe(true);
    expect(result.nodes[0].updatedAt! <= after).toBe(true);
  });
});
