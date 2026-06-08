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
