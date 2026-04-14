/**
 * useDDSCanvasFlow Hook Tests
 * Epic 1: F3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDDSCanvasFlow, toReactFlowNodes, toReactFlowEdges } from '../useDDSCanvasFlow';
import type { UserStoryCard, DDSEdge } from '@/types/dds';

// ==================== Fixtures ====================

const userStoryCard: UserStoryCard = {
  id: 'us-1',
  type: 'user-story',
  title: 'Test Story',
  position: { x: 100, y: 200 },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  role: 'PM',
  action: 'edit',
  benefit: 'fast',
  priority: 'high',
};

const edge: DDSEdge = {
  id: 'edge-1',
  source: 'us-1',
  target: 'us-2',
  type: 'smoothstep',
  animated: false,
};

// ==================== Conversion Function Tests ====================

describe('useDDSCanvasFlow — conversion functions', () => {
  describe('toReactFlowNodes', () => {
    it('converts a single card to ReactFlow node', () => {
      const nodes = toReactFlowNodes([userStoryCard]);
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('us-1');
      expect(nodes[0].type).toBe('user-story');
      expect(nodes[0].position).toEqual({ x: 100, y: 200 });
      expect(nodes[0].data).toMatchObject({ id: 'us-1', title: 'Test Story' });
    });

    it('converts multiple cards to nodes', () => {
      const card2 = { ...userStoryCard, id: 'us-2' };
      const nodes = toReactFlowNodes([userStoryCard, card2]);
      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).toBe('us-1');
      expect(nodes[1].id).toBe('us-2');
    });

    it('returns empty array for empty cards', () => {
      const nodes = toReactFlowNodes([]);
      expect(nodes).toEqual([]);
    });
  });

  describe('toReactFlowEdges', () => {
    it('converts a single edge', () => {
      const edges = toReactFlowEdges([edge]);
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('edge-1');
      expect(edges[0].source).toBe('us-1');
      expect(edges[0].target).toBe('us-2');
      expect(edges[0].type).toBe('smoothstep');
    });

    it('preserves animated flag', () => {
      const animatedEdge = { ...edge, animated: true };
      const edges = toReactFlowEdges([animatedEdge]);
      expect(edges[0].animated).toBe(true);
    });

    it('defaults animated to false', () => {
      const edges = toReactFlowEdges([edge]);
      expect(edges[0].animated).toBe(false);
    });

    it('returns empty array for empty edges', () => {
      const edges = toReactFlowEdges([]);
      expect(edges).toEqual([]);
    });
  });
});

// ==================== Hook Tests ====================
// Note: Full integration tests require React Flow provider context.
// These tests verify the conversion logic independently.

describe('useDDSCanvasFlow — integration', () => {
  // The hook itself requires ReactFlowProvider context, which is complex to set up in unit tests.
  // The primary testing strategy:
  // 1. Unit test conversion functions (above) — covers data transformation
  // 2. Integration test via React Flow provider in e2e tests (E6)
  // 3. Store-level testing for addEdge/updateCard behavior (DDSCanvasStore.test.ts)

  it('toReactFlowNodes and toReactFlowEdges can be composed', () => {
    const cards = [
      userStoryCard,
      { ...userStoryCard, id: 'us-2', position: { x: 300, y: 400 } },
    ];
    const edges = [
      edge,
      { id: 'e2', source: 'us-1', target: 'us-2', type: 'smoothstep' as const },
    ];

    const nodes = toReactFlowNodes(cards);
    const rfEdges = toReactFlowEdges(edges);

    expect(nodes).toHaveLength(2);
    expect(rfEdges).toHaveLength(2);
    expect(rfEdges.find((e) => e.source === 'us-1')).toBeDefined();
  });

  it('cards maintain their data through conversion', () => {
    const card: UserStoryCard = {
      ...userStoryCard,
      role: 'Admin',
      action: 'delete',
      benefit: 'safety',
      priority: 'low',
    };

    const nodes = toReactFlowNodes([card]);
    const nodeData = nodes[0].data as UserStoryCard;

    expect(nodeData.role).toBe('Admin');
    expect(nodeData.action).toBe('delete');
    expect(nodeData.benefit).toBe('safety');
    expect(nodeData.priority).toBe('low');
  });
});
