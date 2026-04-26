/**
 * conflictStore — 单元测试
 * E8-S1/S2/S3: LWW 仲裁 + 冲突解决
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConflictStore } from './conflictStore';

describe('useConflictStore — LWW 仲裁', () => {
  beforeEach(() => {
    // Reset store between tests
    useConflictStore.setState({
      localDrafts: {},
      activeConflict: null,
      lockedCards: {},
    });
  });

  describe('startDraft / clearDraft', () => {
    it('registers local draft on edit start', () => {
      useConflictStore.getState().startDraft('node-1', { name: 'Test' }, 5);
      const draft = useConflictStore.getState().localDrafts['node-1'];
      expect(draft).toBeDefined();
      expect(draft?.data).toEqual({ name: 'Test' });
      expect(draft?.version).toBe(5);
    });

    it('clears draft when editing is cancelled', () => {
      useConflictStore.getState().startDraft('node-1', { name: 'Test' }, 5);
      useConflictStore.getState().clearDraft('node-1');
      expect(useConflictStore.getState().localDrafts['node-1']).toBeUndefined();
    });
  });

  describe('checkConflict — LWW 仲裁', () => {
    it('returns null (auto-adopt) when no local draft exists', () => {
      const result = useConflictStore.getState().checkConflict(
        'node-1',
        'Node 1',
        { name: 'Remote' },
        3
      );
      expect(result).toBeNull();
    });

    it('returns null (auto-adopt) when remote version > local version', () => {
      useConflictStore.getState().startDraft('node-1', { name: 'Local' }, 5);
      const result = useConflictStore.getState().checkConflict(
        'node-1',
        'Node 1',
        { name: 'Remote' },
        10
      );
      // LWW: remote is newer → auto adopt
      expect(result).toBeNull();
      // Draft should be cleared after auto-adopt
      expect(useConflictStore.getState().localDrafts['node-1']).toBeUndefined();
    });

    it('returns conflict when remote version <= local version', () => {
      useConflictStore.getState().startDraft('node-1', { name: 'Local' }, 10);
      const result = useConflictStore.getState().checkConflict(
        'node-1',
        'Node 1',
        { name: 'Remote' },
        5
      );
      expect(result).not.toBeNull();
      expect(result?.nodeId).toBe('node-1');
      expect(result?.localVersion).toBe(10);
      expect(result?.remoteVersion).toBe(5);
      expect(useConflictStore.getState().activeConflict).not.toBeNull();
    });

    it('shows conflict when versions are equal', () => {
      useConflictStore.getState().startDraft('node-1', { name: 'Local' }, 5);
      const result = useConflictStore.getState().checkConflict(
        'node-1',
        'Node 1',
        { name: 'Remote' },
        5
      );
      expect(result).not.toBeNull();
    });
  });

  describe('resolveKeepLocal / resolveUseRemote', () => {
    it('resolveKeepLocal returns local data and clears draft', () => {
      useConflictStore.getState().startDraft('node-1', { name: 'Local' }, 5);
      useConflictStore.getState().checkConflict('node-1', 'Node 1', { name: 'Remote' }, 3);

      const data = useConflictStore.getState().resolveKeepLocal('node-1');
      expect(data).toEqual({ name: 'Local' });
      expect(useConflictStore.getState().activeConflict).toBeNull();
      expect(useConflictStore.getState().localDrafts['node-1']).toBeUndefined();
    });

    it('resolveUseRemote returns null and clears draft', () => {
      useConflictStore.getState().startDraft('node-1', { name: 'Local' }, 5);
      useConflictStore.getState().checkConflict('node-1', 'Node 1', { name: 'Remote' }, 3);

      const data = useConflictStore.getState().resolveUseRemote('node-1');
      expect(data).toBeNull();
      expect(useConflictStore.getState().activeConflict).toBeNull();
      expect(useConflictStore.getState().localDrafts['node-1']).toBeUndefined();
    });
  });

  describe('dismissConflict', () => {
    it('clears active conflict without resolving', () => {
      useConflictStore.getState().startDraft('node-1', { name: 'Local' }, 5);
      useConflictStore.getState().checkConflict('node-1', 'Node 1', { name: 'Remote' }, 3);
      expect(useConflictStore.getState().activeConflict).not.toBeNull();

      useConflictStore.getState().dismissConflict();
      expect(useConflictStore.getState().activeConflict).toBeNull();
      // Draft should remain (user dismissed without choosing)
      expect(useConflictStore.getState().localDrafts['node-1']).toBeDefined();
    });
  });

  describe('lockCard / unlockCard', () => {
    it('registers card lock in state', () => {
      useConflictStore.getState().lockCard('node-1', 'user-1', 'Alice');
      const lock = useConflictStore.getState().lockedCards['node-1'];
      expect(lock).toBeDefined();
      expect(lock?.lockedBy).toBe('user-1');
      expect(lock?.username).toBe('Alice');
      expect(typeof lock?.lockedAt).toBe('number');
    });

    it('unlocks card', () => {
      useConflictStore.getState().lockCard('node-1', 'user-1');
      useConflictStore.getState().unlockCard('node-1');
      expect(useConflictStore.getState().lockedCards['node-1']).toBeUndefined();
    });

    it('multiple locks do not interfere', () => {
      useConflictStore.getState().lockCard('node-1', 'user-1', 'Alice');
      useConflictStore.getState().lockCard('node-2', 'user-2', 'Bob');
      expect(Object.keys(useConflictStore.getState().lockedCards)).toHaveLength(2);
      expect(useConflictStore.getState().lockedCards['node-1']?.username).toBe('Alice');
      expect(useConflictStore.getState().lockedCards['node-2']?.username).toBe('Bob');
    });
  });
});
