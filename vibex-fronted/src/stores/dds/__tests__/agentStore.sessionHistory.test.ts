/**
 * agentStore.sessionHistory.test.ts -- vitest for S64-E3 AI Session Persistence
 * D3.1-D3.8: sessionHistory CRUD
 *
 * vi.mock intercepts the static top-level import from @/lib/ai-session-db
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/ai-session-db', () => ({
  openDB: vi.fn(),
  saveSessionToHistory: vi.fn().mockResolvedValue(undefined),
  loadSessionsFromHistory: vi.fn().mockResolvedValue([]),
  deleteSessionFromHistory: vi.fn().mockResolvedValue(undefined),
  clearAllHistory: vi.fn().mockResolvedValue(undefined),
}));

import { useAgentStore } from '../agentStore';
import {
  loadSessionsFromHistory,
  saveSessionToHistory,
  deleteSessionFromHistory,
  clearAllHistory,
} from '@/lib/ai-session-db';

describe('S64-E3 agentStore sessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (loadSessionsFromHistory as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (saveSessionToHistory as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    useAgentStore.setState({
      sessions: [], activeSessionId: null, defaultRetryMode: '3',
      streamingContent: {}, isStreaming: {}, lastPrompt: {},
      sessionHistory: [], sessionHistoryLoaded: false,
    });
  });

  it('D3.6: sessionHistoryLoaded is initially false', () => {
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(false);
  });

  it('D3.6b: sessionHistory is initially empty', () => {
    expect(useAgentStore.getState().sessionHistory).toHaveLength(0);
  });

  it('D3.2a: loadSessions reads from IndexedDB and populates sessionHistory', async () => {
    const fakeHistory = [
      { id: 'h1', prompt: 'What is TS?', response: 'TS is typed JS.', timestamp: 1000 },
      { id: 'h2', prompt: 'How does React work?', response: 'Virtual DOM.', timestamp: 2000 },
    ];
    (loadSessionsFromHistory as ReturnType<typeof vi.fn>).mockResolvedValue(fakeHistory);
    await useAgentStore.getState().loadSessions();
    const state = useAgentStore.getState();
    expect(state.sessionHistory).toHaveLength(2);
    expect(state.sessionHistory[0].id).toBe('h1');
    expect(state.sessionHistoryLoaded).toBe(true);
  });

  it('D3.2b: loadSessions is idempotent -- skips if already loaded', async () => {
    useAgentStore.setState({
      sessionHistoryLoaded: true,
      sessionHistory: [{ id: 'existing', prompt: 'Old', response: 'Old', timestamp: 0 }],
    });
    await useAgentStore.getState().loadSessions();
    expect(useAgentStore.getState().sessionHistory).toHaveLength(1);
    expect(loadSessionsFromHistory).not.toHaveBeenCalled();
  });

  it('D3.2c: loadSessions sets sessionHistoryLoaded to true on empty DB', async () => {
    (loadSessionsFromHistory as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await useAgentStore.getState().loadSessions();
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(true);
    expect(useAgentStore.getState().sessionHistory).toHaveLength(0);
  });

  it('D3.3a: saveSession calls saveSessionToHistory with truncated data', async () => {
    const longPrompt = 'A'.repeat(500);
    const longResponse = 'B'.repeat(600);
    await useAgentStore.getState().saveSession({
      id: 'trunc-test', prompt: longPrompt, response: longResponse, timestamp: 12345,
    });
    expect(saveSessionToHistory).toHaveBeenCalledTimes(1);
    const [rec] = (saveSessionToHistory as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(rec.prompt.length).toBeLessThanOrEqual(200);
    expect(rec.response.length).toBeLessThanOrEqual(300);
  });

  it('D3.3b: saveSession adds record to sessionHistory in memory', async () => {
    await useAgentStore.getState().saveSession({
      id: 'session-new', prompt: 'Hello', response: 'Hi there!', timestamp: 1234567890,
    });
    const rec = useAgentStore.getState().sessionHistory.find((h) => h.id === 'session-new');
    expect(rec).toBeDefined();
    expect(rec!.prompt).toBe('Hello');
  });

  it('D3.4a: clearSession calls deleteSessionFromHistory and removes from memory', async () => {
    useAgentStore.setState({
      sessionHistory: [
        { id: 'to-delete', prompt: 'X', response: 'Y', timestamp: 1000 },
        { id: 'to-keep', prompt: 'A', response: 'B', timestamp: 2000 },
      ],
    });
    await useAgentStore.getState().clearSession('to-delete');
    expect(deleteSessionFromHistory).toHaveBeenCalledWith('to-delete');
    const remaining = useAgentStore.getState().sessionHistory;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('to-keep');
  });

  it('D3.4b: clearSession is idempotent -- non-existent session does not throw', async () => {
    useAgentStore.setState({
      sessionHistory: [{ id: 'existing', prompt: 'P', response: 'R', timestamp: 1 }],
    });
    await expect(
      useAgentStore.getState().clearSession('non-existent')
    ).resolves.not.toThrow();
    expect(deleteSessionFromHistory).toHaveBeenCalledWith('non-existent');
    expect(useAgentStore.getState().sessionHistory).toHaveLength(1);
  });

  it('D3.5a: clearAllSessions calls clearAllHistory and resets memory', async () => {
    useAgentStore.setState({
      sessionHistory: [
        { id: 'h1', prompt: 'P1', response: 'R1', timestamp: 1000 },
        { id: 'h2', prompt: 'P2', response: 'R2', timestamp: 2000 },
      ],
    });
    await useAgentStore.getState().clearAllSessions();
    expect(clearAllHistory).toHaveBeenCalledTimes(1);
    expect(useAgentStore.getState().sessionHistory).toHaveLength(0);
  });

  it('D3.7: saveSession works before loadSessions', async () => {
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(false);
    await useAgentStore.getState().saveSession({
      id: 'standalone', prompt: 'Standalone prompt', response: 'Standalone response', timestamp: 9999999999,
    });
    const rec = useAgentStore.getState().sessionHistory.find((h) => h.id === 'standalone');
    expect(rec).toBeDefined();
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(false);
  });
});
