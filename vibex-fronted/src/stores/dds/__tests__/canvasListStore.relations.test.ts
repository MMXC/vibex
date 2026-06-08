/**
 * canvasListStore.relations.test.ts — S78-E5: Canvas Relations Tracking
 *
 * Tests the synchronous E5 store logic:
 *   addCanvasRelation, removeCanvasRelation, updateCanvasRelation,
 *   getCanvasRelations, getRelationStats, detectCircularRelation.
 *
 * All tests are fully synchronous — no IndexedDB mocking needed.
 * Pre-populate store state via setState(), then call actions directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasListStore } from '@/stores/canvasListStore';

function resetStore() {
  useCanvasListStore.getState().$reset();
}

// Helper: pre-populate canvases in store state
function setupCanvases() {
  useCanvasListStore.setState({
    canvases: [
      { id: 'canvas-1', name: '画布一', thumbnail: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'canvas-2', name: '画布二', thumbnail: null, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
      { id: 'canvas-3', name: '画布三', thumbnail: null, createdAt: '2026-01-03T00:00:00.000Z', updatedAt: '2026-01-03T00:00:00.000Z' },
    ],
  });
}

// ─── addCanvasRelation ─────────────────────────────────────────────────────────

describe('S78-E5: Canvas Relations — addCanvasRelation', () => {
  beforeEach(() => {
    resetStore();
    setupCanvases();
  });

  it('should add a relation between two canvases', () => {
    const { addCanvasRelation, getCanvasRelations } = useCanvasListStore.getState();
    const id = addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    expect(typeof id).toBe('string');
    const relations = getCanvasRelations('canvas-1');
    expect(relations).toHaveLength(1);
    expect(relations[0].sourceCanvasId).toBe('canvas-1');
    expect(relations[0].targetCanvasId).toBe('canvas-2');
    expect(relations[0].type).toBe('parent');
  });

  it('should throw if source canvas does not exist', () => {
    const { addCanvasRelation } = useCanvasListStore.getState();
    expect(() => addCanvasRelation('nonexistent', 'canvas-2', 'related'))
      .toThrow('Source canvas not found');
  });

  it('should throw if target canvas does not exist', () => {
    const { addCanvasRelation } = useCanvasListStore.getState();
    expect(() => addCanvasRelation('canvas-1', 'nonexistent', 'related'))
      .toThrow('Target canvas not found');
  });

  it('should throw if self-loop detected', () => {
    const { addCanvasRelation } = useCanvasListStore.getState();
    expect(() => addCanvasRelation('canvas-1', 'canvas-1', 'parent'))
      .toThrow('circular dependency');
  });
});

// ─── detectCircularRelation ────────────────────────────────────────────────────

describe('S78-E5: Canvas Relations — detectCircularRelation', () => {
  beforeEach(() => {
    resetStore();
    setupCanvases();
  });

  it('should return false when no cycle exists', () => {
    const { addCanvasRelation, detectCircularRelation } = useCanvasListStore.getState();
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    expect(detectCircularRelation('canvas-2', 'canvas-3')).toBe(false);
  });

  it('should return true for direct cycle (A→B, then B→A)', () => {
    const { addCanvasRelation, detectCircularRelation } = useCanvasListStore.getState();
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    expect(detectCircularRelation('canvas-2', 'canvas-1')).toBe(true);
  });

  it('should return true for self-loop', () => {
    const { detectCircularRelation } = useCanvasListStore.getState();
    expect(detectCircularRelation('canvas-1', 'canvas-1')).toBe(true);
  });

  it('should detect cycle in 3-node chain (A→B→C, then C→A)', () => {
    const { addCanvasRelation, detectCircularRelation } = useCanvasListStore.getState();
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    addCanvasRelation('canvas-2', 'canvas-3', 'parent');
    expect(detectCircularRelation('canvas-3', 'canvas-1')).toBe(true);
  });

  it('should not flag a valid non-circular addition', () => {
    const { addCanvasRelation, detectCircularRelation } = useCanvasListStore.getState();
    addCanvasRelation('canvas-1', 'canvas-2', 'child');
    expect(detectCircularRelation('canvas-1', 'canvas-3')).toBe(false);
  });
});

// ─── removeCanvasRelation ──────────────────────────────────────────────────────

describe('S78-E5: Canvas Relations — removeCanvasRelation', () => {
  beforeEach(() => {
    resetStore();
    setupCanvases();
  });

  it('should remove a relation by id', () => {
    const { addCanvasRelation, removeCanvasRelation, getCanvasRelations } = useCanvasListStore.getState();
    const id = addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    expect(getCanvasRelations('canvas-1')).toHaveLength(1);
    removeCanvasRelation(id);
    expect(getCanvasRelations('canvas-1')).toHaveLength(0);
  });

  it('should be idempotent when removing non-existent relation', () => {
    const { removeCanvasRelation } = useCanvasListStore.getState();
    expect(() => removeCanvasRelation('nonexistent')).not.toThrow();
  });
});

// ─── getRelationStats ─────────────────────────────────────────────────────────

describe('S78-E5: Canvas Relations — getRelationStats', () => {
  beforeEach(() => {
    resetStore();
    setupCanvases();
  });

  it('should return zero stats for canvas with no relations', () => {
    const { getRelationStats } = useCanvasListStore.getState();
    const stats = getRelationStats('canvas-1');
    expect(stats.total).toBe(0);
    expect(stats.byType.parent).toBe(0);
  });

  it('should count relations by type', () => {
    const { addCanvasRelation, getRelationStats } = useCanvasListStore.getState();
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    addCanvasRelation('canvas-1', 'canvas-3', 'child');
    addCanvasRelation('canvas-2', 'canvas-3', 'related');

    const stats = getRelationStats('canvas-1');
    expect(stats.total).toBe(2);
    expect(stats.byType.parent).toBe(1);
    expect(stats.byType.child).toBe(1);
    expect(stats.byType.related).toBe(0);
  });
});

// ─── $reset ───────────────────────────────────────────────────────────────────

describe('S78-E5: Canvas Relations — $reset', () => {
  beforeEach(() => {
    resetStore();
    setupCanvases();
  });

  it('should reset canvasRelations to empty', () => {
    const { addCanvasRelation, $reset, getCanvasRelations } = useCanvasListStore.getState();
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    expect(getCanvasRelations('canvas-1')).toHaveLength(1);
    $reset();
    expect(getCanvasRelations('canvas-1')).toHaveLength(0);
  });
});


// ─── getCanvasRelationsDepth (S79-E4: Multi-depth BFS) ─────────────────────────

describe('S79-E4: Canvas Relations — getCanvasRelationsDepth', () => {
  beforeEach(() => {
    resetStore();
    setupCanvases();
  });

  it('should return empty array when canvasId is falsy', () => {
    const { getCanvasRelationsDepth } = useCanvasListStore.getState();
    expect(getCanvasRelationsDepth('')).toHaveLength(0);
    expect(getCanvasRelationsDepth(null as any)).toHaveLength(0);
    expect(getCanvasRelationsDepth(undefined as any)).toHaveLength(0);
  });

  it('should return empty array when maxDepth < 1', () => {
    const { getCanvasRelationsDepth } = useCanvasListStore.getState();
    expect(getCanvasRelationsDepth('canvas-1', 0)).toHaveLength(0);
    expect(getCanvasRelationsDepth('canvas-1', -1)).toHaveLength(0);
  });

  it('should return empty array when canvas has no relations', () => {
    const { getCanvasRelationsDepth } = useCanvasListStore.getState();
    expect(getCanvasRelationsDepth('canvas-1')).toHaveLength(0);
  });

  it('should return empty array when canvas does not exist', () => {
    const { getCanvasRelationsDepth } = useCanvasListStore.getState();
    expect(getCanvasRelationsDepth('nonexistent')).toHaveLength(0);
  });

  it('should return direct relations at depth=1 (same as getCanvasRelations but with depth field)', () => {
    const { addCanvasRelation, getCanvasRelations, getCanvasRelationsDepth } = useCanvasListStore.getState();
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    addCanvasRelation('canvas-1', 'canvas-3', 'derives_from');

    const direct = getCanvasRelations('canvas-1');
    const depthResults = getCanvasRelationsDepth('canvas-1', 1);

    expect(depthResults).toHaveLength(2);
    expect(depthResults.every(r => r.depth === 1)).toBe(true);
    // Same relations but with depth field added
    const relIds = depthResults.map(r => r.id);
    expect(direct.map(r => r.id).sort()).toEqual(relIds.sort());
  });

  it('should perform BFS traversal for multi-depth relations', () => {
    const { addCanvasRelation, getCanvasRelationsDepth } = useCanvasListStore.getState();
    // Add canvas-4 for 4-level chain
    useCanvasListStore.setState({
      canvases: [
        ...useCanvasListStore.getState().canvases,
        { id: 'canvas-4', name: '画布四', thumbnail: null, createdAt: '2026-01-04T00:00:00.000Z', updatedAt: '2026-01-04T00:00:00.000Z' },
      ],
    });
    // chain: canvas-1 → canvas-2 → canvas-3 → canvas-4 (all in a line, no cycles)
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    addCanvasRelation('canvas-2', 'canvas-3', 'derives_from');
    addCanvasRelation('canvas-3', 'canvas-4', 'child');

    // depth=1: only canvas-2 (canvas-3 not reachable yet)
    const d1 = getCanvasRelationsDepth('canvas-1', 1);
    expect(d1).toHaveLength(1);
    expect(d1[0].depth).toBe(1);
    expect(d1[0].targetCanvasId).toBe('canvas-2');

    // depth=2: canvas-2 and canvas-3
    const d2 = getCanvasRelationsDepth('canvas-1', 2);
    expect(d2).toHaveLength(2);
    const depth1 = d2.filter(r => r.depth === 1);
    const depth2 = d2.filter(r => r.depth === 2);
    expect(depth1).toHaveLength(1);
    expect(depth2).toHaveLength(1);
    expect(depth1[0].targetCanvasId).toBe('canvas-2');
    expect(depth2[0].targetCanvasId).toBe('canvas-3');

    // depth=3: canvas-2, canvas-3, canvas-4
    const d3 = getCanvasRelationsDepth('canvas-1', 3);
    expect(d3).toHaveLength(3);
  });

  it('should mark each relation with correct depth', () => {
    const { addCanvasRelation, getCanvasRelationsDepth } = useCanvasListStore.getState();
    // chain: canvas-1 → canvas-2 → canvas-3 → canvas-4 (non-existent, skipped)
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    addCanvasRelation('canvas-2', 'canvas-3', 'child');

    const results = getCanvasRelationsDepth('canvas-1', 3);
    expect(results).toHaveLength(2);
    
    const c2Rel = results.find(r => r.targetCanvasId === 'canvas-2');
    const c3Rel = results.find(r => r.targetCanvasId === 'canvas-3');
    expect(c2Rel!.depth).toBe(1);
    expect(c3Rel!.depth).toBe(2);
  });

  it('should not revisit already-visited canvases (visited set)', () => {
    const { addCanvasRelation, getCanvasRelationsDepth } = useCanvasListStore.getState();
    // canvas-1 → canvas-2 (parent)
    // canvas-1 → canvas-3 (related)
    // canvas-3 → canvas-2 (child) — canvas-2 already visited at depth 1
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    addCanvasRelation('canvas-1', 'canvas-3', 'related');
    addCanvasRelation('canvas-3', 'canvas-2', 'child');

    const results = getCanvasRelationsDepth('canvas-1', 3);
    // BFS: canvas-1 discovers canvas-2 and canvas-3 at depth 1
    // canvas-3 discovers canvas-2 but canvas-2 already visited → skipped
    // canvas-2 discovers canvas-3 but canvas-3 already visited → skipped
    // Result: 2 relations at depth 1 (canvas-2 and canvas-3), each appears once
    expect(results).toHaveLength(2);
    expect(results.every(r => r.depth === 1)).toBe(true);
  });

  it('should include relation metadata (id, type, label, sourceCanvasId)', () => {
    const { addCanvasRelation, getCanvasRelationsDepth } = useCanvasListStore.getState();
    addCanvasRelation('canvas-1', 'canvas-2', 'parent', 'parent canvas');

    const results = getCanvasRelationsDepth('canvas-1', 1);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBeDefined();
    expect(results[0].type).toBe('parent');
    expect(results[0].label).toBe('parent canvas');
    expect(results[0].sourceCanvasId).toBe('canvas-1');
    expect(results[0].targetCanvasId).toBe('canvas-2');
    expect(results[0].createdAt).toBeDefined();
  });

  it('should include all relation types at each depth', () => {
    const { addCanvasRelation, getCanvasRelationsDepth } = useCanvasListStore.getState();
    // Add canvas-4 for testing all relation types
    useCanvasListStore.setState({
      canvases: [
        ...useCanvasListStore.getState().canvases,
        { id: 'canvas-4', name: '画布四', thumbnail: null, createdAt: '2026-01-04T00:00:00.000Z', updatedAt: '2026-01-04T00:00:00.000Z' },
      ],
    });
    // canvas-1 → canvas-2 (parent), canvas-1 → canvas-3 (derives_from), canvas-2 → canvas-4 (child)
    addCanvasRelation('canvas-1', 'canvas-2', 'parent');
    addCanvasRelation('canvas-1', 'canvas-3', 'derives_from');
    addCanvasRelation('canvas-2', 'canvas-4', 'child');

    const results = getCanvasRelationsDepth('canvas-1', 3);
    const types = results.map(r => r.type);
    expect(types).toContain('parent');
    expect(types).toContain('derives_from');
    expect(types).toContain('child');
  });

  it('should handle single canvas with self-relation', () => {
    const { addCanvasRelation, getCanvasRelationsDepth } = useCanvasListStore.getState();
    // Note: addCanvasRelation prevents self-loop via detectCircularRelation
    // But if we manually add a relation (edge case), getCanvasRelationsDepth should handle it
    // Since addCanvasRelation blocks self-loops, this tests the empty result path
    expect(getCanvasRelationsDepth('canvas-1')).toHaveLength(0);
  });
});
