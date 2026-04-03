/**
 * inferRelationships.test.ts
 *
 * Epic 1: S1.3 — Relationship inference
 */
// @ts-nocheck

import { describe, it, expect } from '@jest/globals';
import { inferRelationships, getRelationshipStyle } from './inferRelationships';

const makeNode = (id: string, name: string, type: 'core' | 'supporting' | 'generic' | 'external') => ({
  nodeId: id,
  name,
  type,
  confirmed: false,
  parentId: null,
  children: [],
  status: 'idle' as const,
});

describe('inferRelationships', () => {
  // F1: Keyword-based inference
  it('should infer dependency from keyword', () => {
    const nodes = [
      makeNode('s1', '支付服务', 'core'),
      makeNode('s2', '用到支付服务', 'generic'),
    ];
    const rels = inferRelationships(nodes);
    expect(rels).toHaveLength(1);
    expect(rels[0].type).toBe('dependency');
  });

  // F2: Generic → Core = dependency
  it('should infer dependency from generic to core', () => {
    const nodes = [
      makeNode('s1', '通知服务', 'generic'),
      makeNode('s2', '预约管理', 'core'),
    ];
    const rels = inferRelationships(nodes);
    expect(rels).toHaveLength(1);
    expect(rels[0].type).toBe('dependency');
    expect(rels[0].sourceId).toBe('s1');
    expect(rels[0].targetId).toBe('s2');
  });

  // F3: Core → Core = calls
  it('should infer calls between core domains', () => {
    const nodes = [
      makeNode('c1', '患者管理', 'core'),
      makeNode('c2', '预约管理', 'core'),
    ];
    const rels = inferRelationships(nodes);
    expect(rels).toHaveLength(1);
    expect(rels[0].type).toBe('calls');
  });

  // F4: External has no relationship (no inference)
  it('should return empty for external nodes', () => {
    const nodes = [
      makeNode('e1', '微信支付', 'external'),
      makeNode('e2', '支付宝', 'external'),
    ];
    const rels = inferRelationships(nodes);
    expect(rels).toHaveLength(0);
  });

  // F5: getRelationshipStyle returns correct styles
  it('should return correct style for each relationship type', () => {
    expect(getRelationshipStyle('dependency')).toEqual({ stroke: '#94a3b8', strokeWidth: 1.5 });
    expect(getRelationshipStyle('aggregate')).toEqual({ stroke: '#6366f1', strokeWidth: 2.5 });
    expect(getRelationshipStyle('calls')).toEqual({ stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '5,3' });
  });

  // F6: Empty nodes returns empty relationships
  it('should return empty for fewer than 2 nodes', () => {
    expect(inferRelationships([makeNode('n1', 'Test', 'core')])).toHaveLength(0);
    expect(inferRelationships([])).toHaveLength(0);
  });
});
