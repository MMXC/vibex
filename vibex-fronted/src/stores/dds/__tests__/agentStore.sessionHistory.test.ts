/**
 * agentStore.sessionHistory.test.ts — vitest for S64-E3 AI Session Persistence
 * D3.1–D3.8: sessionHistory CRUD + IndexedDB integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── IndexedDB mock ──────────────────────────────────────────────────────────────
// jsdom has no IndexedDB; must mock globally before any store code runs.
const mockRequest = {
  result: null as IDBDatabase | null,
  error: null as Error | null,
  onsuccess: null as ((this: IDBRequest, ev: Event) => unknown) | null,
  onerror: null as ((this: IDBRequest, ev: Event) => unknown) | null,
};

let mockDB: IDBDatabase;

function makeMockDB(): IDBDatabase {
  return {
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        add: vi.fn(() => mockRequest),
        put: vi.fn(() => mockRequest),
        getAll: vi.fn(() => mockRequest),
        delete: vi.fn(() => mockRequest),
        clear: vi.fn(() => mockRequest),
      })),
    })),
    close: vi.fn(),
    createObjectStore: vi.fn(),
    deleteObjectStore: vi.fn(),
    objectStoreNames: { contains: vi.fn(() => true), length: 0 },
    version: 1,
  } as unknown as IDBDatabase;
}

function mockIndexedDBOpen(): void {
  mockDB = makeMockDB();
  const openReq = {
    result: mockDB,
    error: null,
    onsuccess: null as ((this: IDBRequest, ev: Event) => unknown) | null,
    onerror: null as ((this: IDBRequest, ev: Event) => unknown) | null,
    set onsuccess(fn: ((this: IDBRequest, ev: Event) => unknown) | null) {
      // Simulate async open success
      if (fn) setTimeout(() => fn.call(openReq, new Event('success')), 0);
    },
  } as unknown as IDBOpenDBRequest;

  const indexedDBMock = {
    open: vi.fn(() => openReq),
    deleteDatabase: vi.fn(),
    cmp: vi.fn(),
  };
  globalThis.indexedDB = indexedDBMock as unknown as IDBDatabase & IDBFactory;
}

// ── Store import ────────────────────────────────────────────────────────────────
import { useAgentStore } from '../agentStore';

// ── Test suite ──────────────────────────────────────────────────────────────────
describe('S64-E3 agentStore sessionHistory', () => {
  beforeEach(() => {
    mockIndexedDBOpen();
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
    // @ts-ignore
    delete globalThis.indexedDB;
  });

  // ── D3.2: loadSessions ─────────────────────────────────────────────────────

  it('D3.2a: loadSessions reads from IndexedDB and populates sessionHistory', async () => {
    const fakeHistory = [
      {
        id: 'history-1',
        prompt: 'What is TypeScript?',
        response: 'TypeScript is a typed superset of JavaScript.',
        timestamp: Date.now() - 10000,
      },
      {
        id: 'history-2',
        prompt: 'How does React work?',
        response: 'React uses a virtual DOM.',
        timestamp: Date.now() - 5000,
      },
    ];

    // Intercept getAll call — simulate returning stored records
    const tx = mockDB.transaction('history', 'readonly');
    const store = tx.objectStore('history') as unknown as {
      getAll: ReturnType<typeof vi.fn>;
    };
    (store.getAll as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      const req = { result: fakeHistory, error: null } as unknown as IDBRequest;
      // Fire success synchronously in mock
      setTimeout(() => {
        // @ts-ignore
        req.onsuccess?.call(req);
      }, 0);
      return req;
    });

    await useAgentStore.getState().loadSessions();

    const state = useAgentStore.getState();
    expect(state.sessionHistory).toHaveLength(2);
    expect(state.sessionHistory[0].id).toBe('history-1');
    expect(state.sessionHistory[1].id).toBe('history-2');
    expect(state.sessionHistoryLoaded).toBe(true);
  });

  it('D3.2b: loadSessions is idempotent — skips if already loaded', async () => {
    useAgentStore.setState({
      sessionHistoryLoaded: true,
      sessionHistory: [{ id: 'existing', prompt: 'Old', response: 'Old', timestamp: 0 }],
    });

    await useAgentStore.getState().loadSessions();

    // Should not call indexedDB.open again (idempotent guard)
    const state = useAgentStore.getState();
    expect(state.sessionHistory).toHaveLength(1);
    expect(state.sessionHistory[0].id).toBe('existing');
  });

  it('D3.2c: loadSessions sets sessionHistoryLoaded to true even on empty DB', async () => {
    const tx = mockDB.transaction('history', 'readonly');
    const store = tx.objectStore('history') as unknown as {
      getAll: ReturnType<typeof vi.fn>;
    };
    (store.getAll as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      const req = { result: [], error: null } as unknown as IDBRequest;
      setTimeout(() => {
        // @ts-ignore
        req.onsuccess?.call(req);
      }, 0);
      return req;
    });

    await useAgentStore.getState().loadSessions();
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(true);
    expect(useAgentStore.getState().sessionHistory).toHaveLength(0);
  });

  // ── D3.3: saveSession ─────────────────────────────────────────────────────

  it('D3.3a: saveSession truncates long prompt and response', async () => {
    const longPrompt = 'A'.repeat(500);
    const longResponse = 'B'.repeat(600);

    let storedRecord: unknown = null;
    const tx = mockDB.transaction('history', 'readwrite');
    const store = tx.objectStore('history') as unknown as {
      put: ReturnType<typeof vi.fn>;
    };
    (store.put as ReturnType<typeof vi.fn>).mockImplementationOnce((record: unknown) => {
      storedRecord = record;
      return mockRequest;
    });

    await useAgentStore.getState().saveSession({
      id: 'session-new',
      prompt: longPrompt,
      response: longResponse,
      timestamp: Date.now(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = storedRecord as any;
    expect(rec.prompt.length).toBeLessThanOrEqual(200);
    expect(rec.response.length).toBeLessThanOrEqual(300);
  });

  it('D3.3b: saveSession adds record to sessionHistory in memory', async () => {
    const tx = mockDB.transaction('history', 'readwrite');
    const store = tx.objectStore('history') as unknown as {
      put: ReturnType<typeof vi.fn>;
    };
    (store.put as ReturnType<typeof vi.fn>).mockImplementationOnce(() => mockRequest);

    await useAgentStore.getState().saveSession({
      id: 'session-new',
      prompt: 'Hello',
      response: 'Hi there!',
      timestamp: 1234567890,
    });

    const history = useAgentStore.getState().sessionHistory;
    expect(history.some((h) => h.id === 'session-new')).toBe(true);
  });

  // ── D3.4: clearSession ───────────────────────────────────────────────────

  it('D3.4a: clearSession removes session from IndexedDB', async () => {
    const tx = mockDB.transaction('history', 'readwrite');
    const store = tx.objectStore('history') as unknown as {
      delete: ReturnType<typeof vi.fn>;
    };
    const deleteMock = vi.fn(() => mockRequest);
    (store.delete as ReturnType<typeof vi.fn>).mockImplementationOnce(deleteMock);

    useAgentStore.setState({
      sessionHistory: [
        { id: 'to-delete', prompt: 'X', response: 'Y', timestamp: 1000 },
        { id: 'to-keep', prompt: 'A', response: 'B', timestamp: 2000 },
      ],
    });

    await useAgentStore.getState().clearSession('to-delete');

    expect(deleteMock).toHaveBeenCalledWith('to-delete');
    const remaining = useAgentStore.getState().sessionHistory;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('to-keep');
  });

  // ── D3.5: clearAllSessions ───────────────────────────────────────────────

  it('D3.5a: clearAllSessions clears IndexedDB and resets state', async () => {
    const tx = mockDB.transaction('history', 'readwrite');
    const store = tx.objectStore('history') as unknown as {
      clear: ReturnType<typeof vi.fn>;
    };
    (store.clear as ReturnType<typeof vi.fn>).mockImplementationOnce(() => mockRequest);

    useAgentStore.setState({
      sessionHistory: [
        { id: 'h1', prompt: 'P1', response: 'R1', timestamp: 1000 },
        { id: 'h2', prompt: 'P2', response: 'R2', timestamp: 2000 },
      ],
    });

    await useAgentStore.getState().clearAllSessions();

    expect(useAgentStore.getState().sessionHistory).toHaveLength(0);
  });

  // ── Integration: sessionHistoryLoaded flag ──────────────────────────────────

  it('D3.6: sessionHistoryLoaded is initially false', () => {
    // Fresh store state
    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(false);
  });

  it('D3.7: saveSession can be called before loadSessions', async () => {
    // Populate empty sessionHistory with a new session
    const tx = mockDB.transaction('history', 'readwrite');
    const store = tx.objectStore('history') as unknown as {
      put: ReturnType<typeof vi.fn>;
    };
    (store.put as ReturnType<typeof vi.fn>).mockImplementationOnce(() => mockRequest);

    expect(useAgentStore.getState().sessionHistoryLoaded).toBe(false);
    await useAgentStore.getState().saveSession({
      id: 'standalone-session',
      prompt: 'Standalone prompt',
      response: 'Standalone response',
      timestamp: 9999999999,
    });

    const history = useAgentStore.getState().sessionHistory;
    expect(history.some((h) => h.id === 'standalone-session')).toBe(true);
  });

  it('D3.8: sessionHistory entries are sorted by timestamp descending', async () => {
    // Pre-populate with mixed timestamps
    useAgentStore.setState({
      sessionHistory: [
        { id: 'older', prompt: 'Old', response: 'Old', timestamp: 1000 },
        { id: 'newer', prompt: 'New', response: 'New', timestamp: 2000 },
        { id: 'middle', prompt: 'Mid', response: 'Mid', timestamp: 1500 },
      ],
    });

    const history = useAgentStore.getState().sessionHistory;
    expect(history[0].id).toBe('newer');
    expect(history[1].id).toBe('middle');
    expect(history[2].id).toBe('older');
  });
});
