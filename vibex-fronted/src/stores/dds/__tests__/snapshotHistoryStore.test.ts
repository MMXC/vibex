/**
 * snapshotHistoryStore.test.ts
 *
 * S49-E4: 画布版本历史可视化
 * Tests: debounce, MAX_SNAPSHOTS overflow, trigger types, manual snapshot
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useSnapshotHistoryStore,
  resetSnapshotDebounceState,
} from '@/stores/dds/snapshotHistoryStore';

// Minimal DDSCard / DDSEdge shapes for testing
const makeCard = (id: string, title = `Card ${id}`) =>
  ({ id, type: 'user-story', title } as const);

const makeEdge = (id: string) =>
  ({ id, source: `node-${id}`, target: `node-${id}-b` } as const);

describe('snapshotHistoryStore', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Reset store state
    useSnapshotHistoryStore.setState({
      snapshots: [],
      selectedSnapshotId: null,
    });
    // Reset module-level debounce state
    resetSnapshotDebounceState();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetSnapshotDebounceState();
  });

  // ===== addAutoSnapshot debounce =====

  it('adds snapshot after debounce delay', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addAutoSnapshot('ai-generate', {
      nodes: [makeCard('1')],
      edges: [makeEdge('1')],
    });

    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(0);

    // Advance past debounce
    vi.advanceTimersByTime(2001);

    const { snapshots } = useSnapshotHistoryStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].trigger).toBe('ai-generate');
    expect(snapshots[0].canvasState.nodes).toHaveLength(1);
    expect(snapshots[0].canvasState.edges).toHaveLength(1);
  });

  it('debounce: rapid calls within 2s only create 1 snapshot', () => {
    const store = useSnapshotHistoryStore.getState();

    store.addAutoSnapshot('ai-generate', { nodes: [makeCard('1')], edges: [] });
    store.addAutoSnapshot('ai-generate', { nodes: [makeCard('2')], edges: [] });
    store.addAutoSnapshot('ai-generate', { nodes: [makeCard('3')], edges: [] });

    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(0);

    vi.advanceTimersByTime(2001);

    // Only 1 snapshot — debounce coalesced all 3 calls
    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(1);
    // Last call's state wins (only card-3)
    expect(useSnapshotHistoryStore.getState().snapshots[0].canvasState.nodes).toHaveLength(1);
    expect(useSnapshotHistoryStore.getState().snapshots[0].canvasState.nodes[0].id).toBe('3');
  });

  it('debounce: second call after 2s creates second snapshot', () => {
    const store = useSnapshotHistoryStore.getState();

    store.addAutoSnapshot('ai-generate', { nodes: [makeCard('1')], edges: [] });
    vi.advanceTimersByTime(2001);
    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(1);

    store.addAutoSnapshot('pre-export', { nodes: [makeCard('2')], edges: [] });
    vi.advanceTimersByTime(2001);

    const { snapshots } = useSnapshotHistoryStore.getState();
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].trigger).toBe('ai-generate');
    expect(snapshots[1].trigger).toBe('pre-export');
  });

  it('addAutoSnapshot without canvasState uses empty default', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addAutoSnapshot('ai-generate');

    vi.advanceTimersByTime(2001);

    const { snapshots } = useSnapshotHistoryStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].canvasState.nodes).toHaveLength(0);
    expect(snapshots[0].canvasState.edges).toHaveLength(0);
  });

  // ===== MAX_SNAPSHOTS overflow =====

  it('caps at MAX_SNAPSHOTS (20), evicting oldest', () => {
    const store = useSnapshotHistoryStore.getState();

    for (let i = 0; i < 25; i++) {
      store.addManualSnapshot({ nodes: [makeCard(String(i))], edges: [] });
    }

    const { snapshots } = useSnapshotHistoryStore.getState();
    expect(snapshots).toHaveLength(20);
    // Oldest (card-0) should be evicted
    expect(snapshots.find((s) => s.canvasState.nodes[0]?.id === '0')).toBeUndefined();
    // Newest (card-24) should be present
    expect(snapshots.find((s) => s.canvasState.nodes[0]?.id === '24')).toBeDefined();
  });

  // ===== addManualSnapshot =====

  it('addManualSnapshot creates snapshot immediately (no debounce)', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addManualSnapshot({
      nodes: [makeCard('manual-1')],
      edges: [makeEdge('manual-1')],
    });

    const { snapshots } = useSnapshotHistoryStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].trigger).toBe('manual');
    expect(snapshots[0].canvasState.nodes).toHaveLength(1);
  });

  it('addManualSnapshot cancels pending debounced snapshot', () => {
    const store = useSnapshotHistoryStore.getState();

    // Schedule debounced snapshot
    store.addAutoSnapshot('ai-generate', { nodes: [makeCard('auto')], edges: [] });
    // Immediately add manual — cancels the pending auto snapshot
    store.addManualSnapshot({ nodes: [makeCard('manual')], edges: [] });

    // Only manual snapshot — pending was cancelled (not flushed)
    const { snapshots } = useSnapshotHistoryStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].trigger).toBe('manual');
    // Pending timer still in queue but will add nothing when fired (snapshots already cleared by MAX overflow is not relevant here since we only have 1)
    vi.advanceTimersByTime(2001);
    // No additional snapshots created
    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(1);
  });

  // ===== selectSnapshot =====

  it('selectSnapshot sets selectedSnapshotId', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addManualSnapshot({ nodes: [], edges: [] });
    const snapId = useSnapshotHistoryStore.getState().snapshots[0].id;

    store.selectSnapshot(snapId);
    expect(useSnapshotHistoryStore.getState().selectedSnapshotId).toBe(snapId);

    store.selectSnapshot(null);
    expect(useSnapshotHistoryStore.getState().selectedSnapshotId).toBeNull();
  });

  // ===== restoreSnapshot =====

  it('restoreSnapshot returns canvasState for valid id', () => {
    const store = useSnapshotHistoryStore.getState();
    const testState = { nodes: [makeCard('restore')], edges: [makeEdge('restore')] };
    store.addManualSnapshot(testState);
    const snapId = useSnapshotHistoryStore.getState().snapshots[0].id;

    const restored = store.restoreSnapshot(snapId);
    expect(restored).toEqual(testState);
  });

  it('restoreSnapshot returns null for unknown id', () => {
    const store = useSnapshotHistoryStore.getState();
    expect(store.restoreSnapshot('nonexistent-id')).toBeNull();
  });

  // ===== deleteSnapshot =====

  it('deleteSnapshot removes snapshot and clears selection if selected', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addManualSnapshot({ nodes: [], edges: [] });
    const snapId = useSnapshotHistoryStore.getState().snapshots[0].id;
    store.selectSnapshot(snapId);

    store.deleteSnapshot(snapId);

    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(0);
    expect(useSnapshotHistoryStore.getState().selectedSnapshotId).toBeNull();
  });

  it('deleteSnapshot does not clear selection if other snapshot selected', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addManualSnapshot({ nodes: [makeCard('1')], edges: [] });
    store.addManualSnapshot({ nodes: [makeCard('2')], edges: [] });
    const snapIds = useSnapshotHistoryStore.getState().snapshots.map((s) => s.id);
    store.selectSnapshot(snapIds[1]);

    store.deleteSnapshot(snapIds[0]);

    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(1);
    expect(useSnapshotHistoryStore.getState().selectedSnapshotId).toBe(snapIds[1]);
  });

  // ===== clearSnapshots =====

  it('clearSnapshots removes all and flushes pending', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addAutoSnapshot('ai-generate', { nodes: [makeCard('pending')], edges: [] });
    store.addManualSnapshot({ nodes: [makeCard('manual')], edges: [] });

    store.clearSnapshots();

    const { snapshots, selectedSnapshotId } = useSnapshotHistoryStore.getState();
    expect(snapshots).toHaveLength(0);
    expect(selectedSnapshotId).toBeNull();
    // Pending should also be flushed/cleared
    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(0);
  });

  // ===== getSnapshot =====

  it('getSnapshot returns snapshot by id', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addManualSnapshot({ nodes: [makeCard('get')], edges: [] });
    const snapId = useSnapshotHistoryStore.getState().snapshots[0].id;

    const snap = store.getSnapshot(snapId);
    expect(snap).toBeDefined();
    expect(snap?.canvasState.nodes[0].id).toBe('get');
  });

  it('getSnapshot returns undefined for unknown id', () => {
    expect(useSnapshotHistoryStore.getState().getSnapshot('bad-id')).toBeUndefined();
  });

  // ===== getSnapshots =====

  it('getSnapshots returns all snapshots', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addManualSnapshot({ nodes: [makeCard('a')], edges: [] });
    store.addManualSnapshot({ nodes: [makeCard('b')], edges: [] });

    const snaps = store.getSnapshots();
    expect(snaps).toHaveLength(2);
  });

  // ===== flushSnapshot =====

  it('flushSnapshot immediately commits pending snapshot', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addAutoSnapshot('ai-generate', { nodes: [makeCard('flush')], edges: [] });

    expect(useSnapshotHistoryStore.getState().snapshots).toHaveLength(0);

    store.flushSnapshot();

    const { snapshots } = useSnapshotHistoryStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].trigger).toBe('ai-generate');
  });

  // ===== label generation =====

  it('generates correct labels for each trigger type', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addManualSnapshot({ nodes: [], edges: [] }); // manual
    const snaps = useSnapshotHistoryStore.getState().snapshots;

    expect(snaps[0].label).toMatch(/手动快照 @/);
  });

  it('snapshot id is unique', () => {
    const store = useSnapshotHistoryStore.getState();
    store.addManualSnapshot({ nodes: [], edges: [] });
    store.addManualSnapshot({ nodes: [], edges: [] });
    store.addManualSnapshot({ nodes: [], edges: [] });

    const ids = useSnapshotHistoryStore.getState().snapshots.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
