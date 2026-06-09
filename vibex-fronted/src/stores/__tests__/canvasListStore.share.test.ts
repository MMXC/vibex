/**
 * canvasListStore.share.test.ts — Sprint47 E4: Canvas Share Store Extension Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasListStore } from '../canvasListStore';
import type { CanvasShareRecord } from '../canvasListStore';

describe('canvasListStore — Share Extension (E4)', () => {
  beforeEach(() => {
    // Reset to initial state between tests
    useCanvasListStore.getState().$reset();
    // Seed with test canvases
    useCanvasListStore.setState({
      canvases: [
        { id: 'c1', name: 'Canvas 1', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' },
        { id: 'c2', name: 'Canvas 2', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-03' },
        { id: 'c3', name: 'Canvas 3', thumbnail: null, createdAt: '2026-01-01', updatedAt: '2026-01-04' },
      ],
    });
  });

  // ============================================================
  // Initial State
  // ============================================================

  it('should have share state initialised correctly', () => {
    const state = useCanvasListStore.getState();
    expect(state.shareDialogCanvasId).toBeNull();
    expect(state.sharedCanvasIds.size).toBe(0);
    expect(state.shareMap).toEqual({});
    expect(state.isShareLoading).toBe(false);
    expect(state.shareError).toBeNull();
  });

  // ============================================================
  // openShareDialog / closeShareDialog
  // ============================================================

  describe('openShareDialog / closeShareDialog', () => {
    it('openShareDialog sets shareDialogCanvasId', () => {
      useCanvasListStore.getState().openShareDialog('c1');
      expect(useCanvasListStore.getState().shareDialogCanvasId).toBe('c1');
    });

    it('openShareDialog clears previous shareError', () => {
      useCanvasListStore.setState({ shareError: 'Some error' });
      useCanvasListStore.getState().openShareDialog('c1');
      expect(useCanvasListStore.getState().shareError).toBeNull();
    });

    it('closeShareDialog clears shareDialogCanvasId', () => {
      useCanvasListStore.getState().openShareDialog('c1');
      useCanvasListStore.getState().closeShareDialog();
      expect(useCanvasListStore.getState().shareDialogCanvasId).toBeNull();
    });
  });

  // ============================================================
  // markCanvasShared / getShareRecords
  // ============================================================

  describe('markCanvasShared / getShareRecords', () => {
    it('markCanvasShared adds a record to shareMap', () => {
      const record: CanvasShareRecord = {
        canvasId: 'c1',
        teamId: 't1',
        role: 'editor',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
        snapshotUrl: 'https://example.com/snap/c1',
      };

      useCanvasListStore.getState().markCanvasShared(record);

      const state = useCanvasListStore.getState();
      expect(state.shareMap['c1']).toHaveLength(1);
      expect(state.shareMap['c1'][0]).toEqual(record);
    });

    it('markCanvasShared adds canvasId to sharedCanvasIds', () => {
      const record: CanvasShareRecord = {
        canvasId: 'c2',
        role: 'viewer',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
      };

      useCanvasListStore.getState().markCanvasShared(record);
      expect(useCanvasListStore.getState().sharedCanvasIds.has('c2')).toBe(true);
    });

    it('markCanvasShared accumulates multiple records', () => {
      const record1: CanvasShareRecord = {
        canvasId: 'c1',
        role: 'viewer',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
      };
      const record2: CanvasShareRecord = {
        canvasId: 'c1',
        teamId: 't1',
        role: 'editor',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T11:00:00Z',
      };

      useCanvasListStore.getState().markCanvasShared(record1);
      useCanvasListStore.getState().markCanvasShared(record2);

      const records = useCanvasListStore.getState().getShareRecords('c1');
      expect(records).toHaveLength(2);
    });

    it('getShareRecords returns empty array for unknown canvas', () => {
      const records = useCanvasListStore.getState().getShareRecords('nonexistent');
      expect(records).toEqual([]);
    });
  });

  // ============================================================
  // getSharedCanvases / isCanvasShared
  // ============================================================

  describe('getSharedCanvases / isCanvasShared', () => {
    it('isCanvasShared returns false for unshared canvas', () => {
      expect(useCanvasListStore.getState().isCanvasShared('c1')).toBe(false);
    });

    it('isCanvasShared returns true after sharing', () => {
      useCanvasListStore.getState().markCanvasShared({
        canvasId: 'c1',
        role: 'viewer',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
      });
      expect(useCanvasListStore.getState().isCanvasShared('c1')).toBe(true);
    });

    it('getSharedCanvases returns only shared canvases', () => {
      useCanvasListStore.getState().markCanvasShared({
        canvasId: 'c1',
        role: 'viewer',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
      });
      useCanvasListStore.getState().markCanvasShared({
        canvasId: 'c3',
        role: 'editor',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
      });

      const shared = useCanvasListStore.getState().getSharedCanvases();
      expect(shared).toHaveLength(2);
      expect(shared.map((c) => c.id).sort()).toEqual(['c1', 'c3']);
    });

    it('getSharedCanvases returns empty when no canvases shared', () => {
      const shared = useCanvasListStore.getState().getSharedCanvases();
      expect(shared).toEqual([]);
    });
  });

  // ============================================================
  // revokeShareRecord
  // ============================================================

  describe('revokeShareRecord', () => {
    beforeEach(() => {
      // Seed with two share records
      useCanvasListStore.getState().markCanvasShared({
        canvasId: 'c1',
        teamId: 't1',
        role: 'viewer',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
      });
      useCanvasListStore.getState().markCanvasShared({
        canvasId: 'c1',
        teamId: 't2',
        role: 'editor',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T11:00:00Z',
      });
    });

    it('removes a record at given index', () => {
      useCanvasListStore.getState().revokeShareRecord('c1', 0);
      const records = useCanvasListStore.getState().getShareRecords('c1');
      expect(records).toHaveLength(1);
    });

    it('removes canvas from sharedCanvasIds when last record revoked', () => {
      useCanvasListStore.getState().revokeShareRecord('c1', 0);
      useCanvasListStore.getState().revokeShareRecord('c1', 0);
      expect(useCanvasListStore.getState().isCanvasShared('c1')).toBe(false);
    });

    it('ignores out-of-range index', () => {
      const recordsBefore = useCanvasListStore.getState().getShareRecords('c1').length;
      useCanvasListStore.getState().revokeShareRecord('c1', 99);
      const recordsAfter = useCanvasListStore.getState().getShareRecords('c1').length;
      expect(recordsAfter).toBe(recordsBefore);
    });
  });

  // ============================================================
  // $reset
  // ============================================================

  describe('$reset', () => {
    it('resets all share state fields', () => {
      // Set some share state
      useCanvasListStore.getState().openShareDialog('c1');
      useCanvasListStore.getState().markCanvasShared({
        canvasId: 'c1',
        role: 'editor',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
      });
      useCanvasListStore.setState({ isShareLoading: true, shareError: 'some error' });

      // Reset
      useCanvasListStore.getState().$reset();

      const state = useCanvasListStore.getState();
      expect(state.shareDialogCanvasId).toBeNull();
      expect(state.sharedCanvasIds.size).toBe(0);
      expect(state.shareMap).toEqual({});
      expect(state.isShareLoading).toBe(false);
      expect(state.shareError).toBeNull();
    });

    it('$reset does not affect canvas list', () => {
      useCanvasListStore.getState().markCanvasShared({
        canvasId: 'c1',
        role: 'editor',
        sharedBy: 'user-1',
        sharedAt: '2026-06-01T10:00:00Z',
      });
      useCanvasListStore.getState().$reset();
      // Canvas list should be preserved
      expect(useCanvasListStore.getState().canvases).toHaveLength(3);
    });
  });
});
