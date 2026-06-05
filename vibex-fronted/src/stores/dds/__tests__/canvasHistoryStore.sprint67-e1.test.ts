/**
 * canvasHistoryStore — E1 Branch Comparison Tests
 * E1 (Sprint67): 画布分支快照视觉对比
 *
 * Tests: compareBranches() — finds latest snapshots for two branches,
 * calls compareSnapshots(), and returns BranchDiffResult with summary.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCanvasHistoryStore } from '../canvasHistoryStore';
import type { Snapshot } from '../canvasHistoryStore';

// jsdom has no indexedDB — mock it so store calls dynamic import but returns early
Object.defineProperty(globalThis, 'indexedDB', {
  value: { open: () => ({ result: { transaction: () => ({ objectStore: () => ({}) }) } }) },
  writable: true,
  configurable: true,
});

const { mockGetLatestSnapshotFromDB } = vi.hoisted(() => ({
  mockGetLatestSnapshotFromDB: vi.fn(),
}));

vi.mock('@/lib/canvas/historyDB', () => ({
  getLatestSnapshotFromDB: mockGetLatestSnapshotFromDB,
}));

describe('canvasHistoryStore — E1 Branch Comparison (Sprint67)', () => {
  beforeEach(() => {
    useCanvasHistoryStore.setState({
      past: [],
      future: [],
      isPerforming: false,
      snapshots: [],
      restoringSnapshotId: null,
    });
    vi.clearAllMocks();
  });

  it('compareBranches returns error when branchA has no snapshots', async () => {
    mockGetLatestSnapshotFromDB
      .mockResolvedValueOnce(null)  // branchA: no snapshot
      .mockResolvedValueOnce({       // branchB: has snapshot
        id: 's2', name: 'v1', timestamp: 2000, branch: 'feature-a',
        data: { nodes: [{ id: 'n1' }], edges: [] },
      });

    const { compareBranches } = useCanvasHistoryStore.getState();
    const result = await compareBranches('canvas-1', 'main', 'feature-a');

    expect(result.branchA).toBe('main');
    expect(result.branchB).toBe('feature-a');
    expect(result.error).toContain('not found');
    expect(result.diffs).toEqual({ added: [], removed: [], modified: [] });
    expect(result.summary.totalChanges).toBe(0);
  });

  it('compareBranches returns error when branchB has no snapshots', async () => {
    mockGetLatestSnapshotFromDB
      .mockResolvedValueOnce({       // branchA: has snapshot
        id: 's1', name: 'v1', timestamp: 1000, branch: 'main',
        data: { nodes: [{ id: 'n1' }], edges: [] },
      })
      .mockResolvedValueOnce(null);  // branchB: no snapshot

    const { compareBranches } = useCanvasHistoryStore.getState();
    const result = await compareBranches('canvas-1', 'main', 'feature-a');

    expect(result.error).toContain('not found');
    expect(result.diffs).toEqual({ added: [], removed: [], modified: [] });
    expect(result.summary.totalChanges).toBe(0);
  });

  it('compareBranches returns correct snapA and snapB', async () => {
    const snapA: Snapshot = {
      id: 's1', name: 'main v1', timestamp: 1000, branch: 'main',
      data: { nodes: [{ id: 'n1' }, { id: 'n2' }], edges: [] },
    };
    const snapB: Snapshot = {
      id: 's2', name: 'feature v1', timestamp: 2000, branch: 'feature-a',
      data: { nodes: [{ id: 'n1' }, { id: 'n3' }], edges: [] },
    };

    mockGetLatestSnapshotFromDB
      .mockResolvedValueOnce(snapA)
      .mockResolvedValueOnce(snapB);

    const { compareBranches } = useCanvasHistoryStore.getState();
    const result = await compareBranches('canvas-1', 'main', 'feature-a');

    expect(result.snapA?.id).toBe('s1');
    expect(result.snapB?.id).toBe('s2');
    expect(result.branchA).toBe('main');
    expect(result.branchB).toBe('feature-a');
    expect(result.error).toBeUndefined();
  });

  it('compareBranches returns diffs with correct types (added/removed/modified)', async () => {
    const snapA: Snapshot = {
      id: 's1', name: 'main v1', timestamp: 1000, branch: 'main',
      data: {
        nodes: [
          { id: 'n1', type: 'context', label: 'Node A' },
          { id: 'n2', type: 'context', label: 'Node B' },
        ],
        edges: [],
      },
    };
    const snapB: Snapshot = {
      id: 's2', name: 'feature v1', timestamp: 2000, branch: 'feature-a',
      data: {
        nodes: [
          { id: 'n1', type: 'context', label: 'Node A' },     // unchanged
          { id: 'n3', type: 'context', label: 'Node C' },    // added
        ],
        edges: [],
      },
    };

    mockGetLatestSnapshotFromDB
      .mockResolvedValueOnce(snapA)
      .mockResolvedValueOnce(snapB);

    const { compareBranches } = useCanvasHistoryStore.getState();
    const result = await compareBranches('canvas-1', 'main', 'feature-a');

    // n2 removed, n3 added
    expect(result.diffs.removed.length).toBeGreaterThan(0);
    expect(result.diffs.added.length).toBeGreaterThan(0);
    expect(
      [...result.diffs.added, ...result.diffs.removed, ...result.diffs.modified].every(d =>
        ['added', 'removed', 'modified'].includes(d.type as unknown as string)
      )
    ).toBe(true);

    // Summary counts
    expect(result.summary.totalChanges).toBeGreaterThan(0);
    expect(
      result.summary.contextsRemoved +
      result.summary.contextsAdded +
      result.summary.contextsModified
    ).toBe(result.summary.totalChanges);
  });

  it('compareBranches DoD acceptance — diffs exist and have valid types', async () => {
    const snapA: Snapshot = {
      id: 'sA', name: 'a', timestamp: 1000, branch: 'main',
      data: { nodes: [{ id: 'n1', type: 'context' }], edges: [] },
    };
    const snapB: Snapshot = {
      id: 'sB', name: 'b', timestamp: 2000, branch: 'feature',
      data: { nodes: [{ id: 'n2', type: 'context' }], edges: [] },
    };

    mockGetLatestSnapshotFromDB
      .mockResolvedValueOnce(snapA)
      .mockResolvedValueOnce(snapB);

    const { compareBranches } = useCanvasHistoryStore.getState();
    const result = await compareBranches('canvas-1', 'main', 'feature');

    // E1 DoD: expect(compareBranches('main', 'feature').diffs added/removed/modified).toBeTruthy()
    const allDiffs = [...result.diffs.added, ...result.diffs.removed, ...result.diffs.modified];
    expect(allDiffs.length).toBeGreaterThan(0);
    expect(allDiffs.every(d =>
      ['added', 'removed', 'modified'].includes(d.type as unknown as string)
    )).toBe(true);
  });
});
