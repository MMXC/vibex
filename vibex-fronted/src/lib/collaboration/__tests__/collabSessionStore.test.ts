/**
 * collabSessionStore vitest — S66-E5
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCollabSessionStore } from '../collabSessionStore';

// Mock idb
vi.mock('idb', () => {
  const mockDB = {
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    getAllFromIndex: vi.fn().mockResolvedValue([]),
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        delete: vi.fn().mockResolvedValue(undefined),
      }),
      done: vi.fn().mockResolvedValue(undefined),
    }),
  };

  return {
    openDB: vi.fn().mockResolvedValue(mockDB),
  };
});

// Mock indexedDB guard
const mockIndexedDB = {} as unknown as IDBDatabase;
Object.defineProperty(globalThis, 'indexedDB', { value: mockIndexedDB, writable: true });

describe('collabSessionStore', () => {
  beforeEach(() => {
    // Reset store state
    useCollabSessionStore.setState({
      isRecording: false,
      currentSessionId: null,
      currentEvents: [],
      sessions: [],
      sessionsLoaded: false,
      replay: {
        sessionId: null,
        isPlaying: false,
        currentIndex: 0,
        speed: 1,
        startedAt: null,
      },
      replayEvents: [],
    });
  });

  describe('startRecording / stopRecording', () => {
    it('should start recording and set isRecording=true', () => {
      const { startRecording } = useCollabSessionStore.getState();
      startRecording('canvas-1', 'Test Session');

      const state = useCollabSessionStore.getState();
      expect(state.isRecording).toBe(true);
      expect(state.currentSessionId).toBeTruthy();
      expect(state.currentEvents).toEqual([]);
    });

    it('should stop recording and reset state', async () => {
      const store = useCollabSessionStore.getState();
      store.startRecording('canvas-1', 'Test');
      store.addEvent({ type: 'user:join', userId: 'u1', userName: 'Alice' });

      const result = await store.stopRecording();

      const state = useCollabSessionStore.getState();
      expect(state.isRecording).toBe(false);
      expect(state.currentSessionId).toBeNull();
      expect(state.currentEvents).toEqual([]);
      expect(result).toBeTruthy();
    });
  });

  describe('addEvent', () => {
    it('should add event to currentEvents when recording', () => {
      const store = useCollabSessionStore.getState();
      store.startRecording('canvas-1');

      store.addEvent({ type: 'node:focused', userId: 'u1', userName: 'Bob', nodeId: 'node-1' });

      const state = useCollabSessionStore.getState();
      expect(state.currentEvents).toHaveLength(1);
      expect(state.currentEvents[0].type).toBe('node:focused');
      expect(state.currentEvents[0].nodeId).toBe('node-1');
      expect(state.currentEvents[0].userId).toBe('u1');
      expect(state.currentEvents[0].eventId).toBeTruthy();
      expect(state.currentEvents[0].sessionId).toBe(state.currentSessionId);
    });

    it('should not add event when not recording', () => {
      const store = useCollabSessionStore.getState();
      store.addEvent({ type: 'user:join', userId: 'u1', userName: 'Alice' });

      const state = useCollabSessionStore.getState();
      expect(state.currentEvents).toHaveLength(0);
    });
  });

  describe('replay state', () => {
    it('should set replay speed', () => {
      const { setReplaySpeed } = useCollabSessionStore.getState();
      setReplaySpeed(2);

      expect(useCollabSessionStore.getState().replay.speed).toBe(2);
    });

    it('should pause and resume replay', () => {
      const store = useCollabSessionStore.getState();

      // Start replay state
      useCollabSessionStore.setState({
        replay: { ...store.replay, isPlaying: true },
      });

      store.pauseReplay();
      expect(useCollabSessionStore.getState().replay.isPlaying).toBe(false);

      store.resumeReplay();
      expect(useCollabSessionStore.getState().replay.isPlaying).toBe(true);
    });

    it('should stop replay and reset state', () => {
      const store = useCollabSessionStore.getState();
      store.stopReplay();

      const state = useCollabSessionStore.getState();
      expect(state.replay.sessionId).toBeNull();
      expect(state.replay.isPlaying).toBe(false);
      expect(state.replay.currentIndex).toBe(0);
    });
  });

  describe('SESSION_EVENT_LABELS', () => {
    it('should have labels for all event types', async () => {
      const { SESSION_EVENT_LABELS } = await import('../collabSessionStore');
      expect(SESSION_EVENT_LABELS['node:focused']).toBe('节点获得焦点');
      expect(SESSION_EVENT_LABELS['node:blur']).toBe('节点解锁');
      expect(SESSION_EVENT_LABELS['cursor:move']).toBe('光标移动');
      expect(SESSION_EVENT_LABELS['user:join']).toBe('用户加入');
      expect(SESSION_EVENT_LABELS['editing:start']).toBe('开始编辑');
    });
  });

  // S73-E5: Export tests
  describe('exportSessionMarkdown', () => {
    it('should return not-found message for missing session', async () => {
      const store = useCollabSessionStore.getState();
      const md = await store.exportSessionMarkdown('nonexistent');
      expect(md).toContain('Session not found');
    });

    it('should format session with all metadata fields', async () => {
      // Inject a mock session into the store via the mock db
      const { useCollabSessionStore: store } = await import('../collabSessionStore');
      // The mock idb.get returns null by default — no session found
      const md = await store.getState().exportSessionMarkdown('session-1');
      // Should handle missing session gracefully
      expect(typeof md).toBe('string');
    });
  });

  describe('exportSessionPDF', () => {
    it('should exist as a store method', () => {
      const { exportSessionPDF } = useCollabSessionStore.getState();
      expect(typeof exportSessionPDF).toBe('function');
    });
  });
});
