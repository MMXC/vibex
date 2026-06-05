/**
 * agentStore.sessionHistory.test.ts -- vitest for S64-E3 AI Session Persistence
 * D3.1-D3.8: sessionHistory CRUD
 *
 * Strategy: Test store actions directly via getState(), testing state transitions
 * without mocking IndexedDB (that is covered at integration-test level).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useAgentStore } from '../agentStore';

describe('S64-E3 agentStore sessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAgentStore.setState({
      sessions: [],
      activeSessionId: null,
      defaultRetryMode: '3',
      streamingContent: {},
      isStreaming: {},
      lastPrompt: {},
      sessionHistory: [],
      sessionHistoryLoaded: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // State initialization
  it('D3.6: sessionHistoryLoaded is initially false', () => {
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(false);
  });

  it('D3.6b: sessionHistory is initially empty', () => {
    expect(useAgentStore.getState().sessionHistory).toHaveLength(0);
  });

  // loadSessions idempotent
  it('D3.2b: loadSessions is idempotent -- skips if already loaded', async () => {
    useAgentStore.setState({
      sessionHistoryLoaded: true,
      sessionHistory: [{ id: 'existing', prompt: 'Old', response: 'Old', timestamp: 0 }],
    });

    await useAgentStore.getState().loadSessions();

    const state = useAgentStore.getState();
    expect(state.sessionHistory).toHaveLength(1);
    expect(state.sessionHistory[0].id).toBe('existing');
    expect(state.sessionHistoryLoaded).toBe(true);
  });

  // saveSession truncation
  it('D3.3a: saveSession truncates prompt to <=200 chars', async () => {
    const longPrompt = 'A'.repeat(500);
    await useAgentStore.getState().saveSession({
      id: 'trunc-test', prompt: longPrompt, response: 'Short', timestamp: Date.now(),
    });
    const rec = useAgentStore.getState().sessionHistory.find((h) => h.id === 'trunc-test');
    expect(rec).toBeDefined();
    expect(rec!.prompt.length).toBeLessThanOrEqual(200);
    expect(rec!.prompt.endsWith('...')).toBe(true);
  });

  it('D3.3b: saveSession truncates response to <=300 chars', async () => {
    const longResponse = 'B'.repeat(600);
    await useAgentStore.getState().saveSession({
      id: 'trunc-test-2', prompt: 'Short', response: longResponse, timestamp: Date.now(),
    });
    const rec = useAgentStore.getState().sessionHistory.find((h) => h.id === 'trunc-test-2');
    expect(rec).toBeDefined();
    expect(rec!.response.length).toBeLessThanOrEqual(300);
    expect(rec!.response.endsWith('...')).toBe(true);
  });

  it('D3.3c: saveSession appends to sessionHistory', async () => {
    await useAgentStore.getState().saveSession({
      id: 'session-new', prompt: 'Hello', response: 'Hi!', timestamp: 1234567890,
    });
    const rec = useAgentStore.getState().sessionHistory.find((h) => h.id === 'session-new');
    expect(rec).toBeDefined();
    expect(rec!.prompt).toBe('Hello');
    expect(rec!.response).toBe('Hi!');
    expect(rec!.timestamp).toBe(1234567890);
  });

  // clearSession
  it('D3.4a: clearSession removes one session from history', async () => {
    useAgentStore.setState({
      sessionHistory: [
        { id: 'to-delete', prompt: 'X', response: 'Y', timestamp: 1000 },
        { id: 'to-keep', prompt: 'A', response: 'B', timestamp: 2000 },
      ],
    });
    await useAgentStore.getState().clearSession('to-delete');
    const remaining = useAgentStore.getState().sessionHistory;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('to-keep');
  });

  it('D3.4b: clearSession is idempotent -- removing non-existent session does not throw', async () => {
    useAgentStore.setState({
      sessionHistory: [{ id: 'existing', prompt: 'P', response: 'R', timestamp: 1 }],
    });
    await expect(
      useAgentStore.getState().clearSession('non-existent')
    ).resolves.not.toThrow();
    expect(useAgentStore.getState().sessionHistory).toHaveLength(1);
  });

  // clearAllSessions
  it('D3.5a: clearAllSessions removes all sessions', async () => {
    useAgentStore.setState({
      sessionHistory: [
        { id: 'h1', prompt: 'P1', response: 'R1', timestamp: 1000 },
        { id: 'h2', prompt: 'P2', response: 'R2', timestamp: 2000 },
      ],
    });
    await useAgentStore.getState().clearAllSessions();
    expect(useAgentStore.getState().sessionHistory).toHaveLength(0);
  });

  // saveSession before loadSessions
  it('D3.7: saveSession works before loadSessions', async () => {
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(false);
    await useAgentStore.getState().saveSession({
      id: 'standalone', prompt: 'P', response: 'R', timestamp: 9999999999,
    });
    const rec = useAgentStore.getState().sessionHistory.find((h) => h.id === 'standalone');
    expect(rec).toBeDefined();
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(false);
  });

  // loadSessions sets loaded flag
  it('D3.2c: loadSessions sets sessionHistoryLoaded to true', async () => {
    useAgentStore.setState({
      sessionHistory: [{ id: 'l1', prompt: 'P', response: 'R', timestamp: 1 }],
    });
    await useAgentStore.getState().loadSessions();
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(true);
  });
});
