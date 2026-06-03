/**
 * conflictStore.test.ts — Sprint58 E5: 协作冲突增强
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useConflictStore } from '../conflictStore';

describe('conflictStore', () => {
  beforeEach(() => {
    useConflictStore.getState().clearConflict();
  });

  describe('setConflict', () => {
    it('sets conflictData and resets resolvedStrategy', () => {
      useConflictStore.getState().resolveConflict('local');
      const conflictData = {
        local: { nodes: [] },
        remote: { nodes: [] },
        canvasId: 'canvas-1',
        localRevision: 5,
        remoteRevision: 6,
      };
      useConflictStore.getState().setConflict(conflictData);

      const state = useConflictStore.getState();
      expect(state.conflictData).toEqual(conflictData);
      expect(state.resolvedStrategy).toBeNull();
      expect(state.isManualMergeEditing).toBe(false);
    });
  });

  describe('resolveConflict', () => {
    it('sets resolvedStrategy', () => {
      useConflictStore.getState().resolveConflict('remote');
      expect(useConflictStore.getState().resolvedStrategy).toBe('remote');
    });
  });

  describe('setManualMergeContent', () => {
    it('updates manualMergeContent', () => {
      useConflictStore.getState().setManualMergeContent('{ "nodes": [] }');
      expect(useConflictStore.getState().manualMergeContent).toBe('{ "nodes": [] }');
    });
  });

  describe('startManualMerge', () => {
    it('sets isManualMergeEditing to true', () => {
      useConflictStore.getState().startManualMerge();
      expect(useConflictStore.getState().isManualMergeEditing).toBe(true);
    });
  });

  describe('clearConflict', () => {
    it('resets all conflict state', () => {
      useConflictStore.getState().setConflict({
        local: {},
        remote: {},
        canvasId: 'c1',
        localRevision: 1,
        remoteRevision: 2,
      });
      useConflictStore.getState().resolveConflict('local');
      useConflictStore.getState().setManualMergeContent('test');

      useConflictStore.getState().clearConflict();

      const state = useConflictStore.getState();
      expect(state.conflictData).toBeNull();
      expect(state.resolvedStrategy).toBeNull();
      expect(state.manualMergeContent).toBe('');
      expect(state.isManualMergeEditing).toBe(false);
    });
  });
});
