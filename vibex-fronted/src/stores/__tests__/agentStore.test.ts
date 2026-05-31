/**
 * agentStore.injectContext — Unit Tests
 * Sprint 6 U5: Agent Session Management
 * Sprint44 P001-E1: IndexedDB persistence tests
 * Sprint46 P001-E1: session search tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAgentStore } from '@/stores/agentStore';
import type { AgentSession } from '@/services/agent/CodingAgentService';

// ── S44-E1: IndexedDB persistence tests ─────────────────────────

// Mock idb module
const mockDB: Record<string, AgentSession[]> = {};
const mockStore = {
  put: vi.fn(async (session: AgentSession) => {
    mockDB[session.sessionKey] = session;
  }),
  getAllFromIndex: vi.fn(async () => Object.values(mockDB)),
  delete: vi.fn(async (key: string) => {
    delete mockDB[key];
  }),
  get: vi.fn(async (key: string) => mockDB[key]),
};

vi.mock('idb', () => ({
  openDB: vi.fn(async () => mockStore),
}));

vi.mock('@/lib/agentDB', () => ({
  initAgentDB: vi.fn(async () => mockStore),
  persistSession: vi.fn(async (session: AgentSession) => {
    mockDB[session.sessionKey] = session;
  }),
  loadSessionList: vi.fn(async () => Object.values(mockDB).reverse()),
  deleteSession: vi.fn(async (key: string) => {
    delete mockDB[key];
  }),
}));

function makeSession(overrides: Partial<AgentSession> = {}): AgentSession {
  return {
    sessionKey: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    task: 'Test task',
    status: 'idle',
    createdAt: Date.now(),
    messages: [],
    ...overrides,
  };
}

describe('agentStore.injectContext', () => {
  beforeEach(() => {
    useAgentStore.setState({ codeGenContext: null });
  });

  it('valid context is accepted', () => {
    const ctx = {
      type: 'codegen' as const,
      generatedCode: 'export const x = 1;',
      nodes: [{ id: 'n1', type: 'frame', name: 'Button' }],
      schemaVersion: '1.0.0',
      exportedAt: '2026-04-27T00:00:00.000Z',
    };
    useAgentStore.getState().injectContext(ctx);
    expect(useAgentStore.getState().codeGenContext).toEqual(ctx);
  });

  it('throws on invalid type field', () => {
    const ctx = { type: 'invalid', generatedCode: '', nodes: [], schemaVersion: '1.0.0', exportedAt: '2026-04-27' };
    expect(() => useAgentStore.getState().injectContext(ctx)).toThrow(/type.*codegen/);
  });

  it('throws on missing generatedCode', () => {
    const ctx = { type: 'codegen', nodes: [], schemaVersion: '1.0.0', exportedAt: '2026-04-27' } as any;
    expect(() => useAgentStore.getState().injectContext(ctx)).toThrow(/generatedCode.*string/);
  });

  it('throws on nodes not array', () => {
    const ctx = { type: 'codegen', generatedCode: 'x', nodes: 'not-array', schemaVersion: '1.0.0', exportedAt: '2026-04-27' } as any;
    expect(() => useAgentStore.getState().injectContext(ctx)).toThrow(/nodes.*array/);
  });

  it('throws on node without id', () => {
    const ctx = { type: 'codegen', generatedCode: 'x', nodes: [{ type: 'frame' }], schemaVersion: '1.0.0', exportedAt: '2026-04-27' } as any;
    expect(() => useAgentStore.getState().injectContext(ctx)).toThrow(/node\.id.*string/);
  });
});

// S44-E1: IndexedDB persistence tests
describe('agentStore S44-E1: IndexedDB persistence', () => {
  beforeEach(async () => {
    // Clear mock DB and reset store
    Object.keys(mockDB).forEach((k) => delete mockDB[k]);
    useAgentStore.setState({ sessions: [], activeSessionKey: null, codeGenContext: null });
    vi.clearAllMocks();
  });

  it('addSession persists session to store and sets active', async () => {
    const session = makeSession();
    useAgentStore.getState().addSession(session);
    const state = useAgentStore.getState();
    // S46-E1: session is enriched with searchableText, use objectContaining
    expect(state.sessions).toContainEqual(expect.objectContaining({ sessionKey: session.sessionKey }));
    expect(state.activeSessionKey).toBe(session.sessionKey);
  });

  it('updateSession updates in-memory state', async () => {
    const session = makeSession({ name: 'Old name' });
    useAgentStore.getState().addSession(session);
    useAgentStore.getState().updateSession(session.sessionKey, { name: 'New name' });
    const updated = useAgentStore.getState().sessions.find((s) => s.sessionKey === session.sessionKey);
    expect(updated?.name).toBe('New name');
  });

  it('removeSession removes session from store', async () => {
    const session = makeSession();
    useAgentStore.getState().addSession(session);
    // S46-E1: session is enriched with searchableText
    expect(useAgentStore.getState().sessions).toContainEqual(expect.objectContaining({ sessionKey: session.sessionKey }));
    useAgentStore.getState().removeSession(session.sessionKey);
    expect(useAgentStore.getState().sessions).not.toContainEqual(expect.objectContaining({ sessionKey: session.sessionKey }));
  });

  it('initAgentSessions loads persisted sessions when store is empty', async () => {
    const s1 = makeSession({ sessionKey: 'persist-1', createdAt: 1000 });
    const s2 = makeSession({ sessionKey: 'persist-2', createdAt: 2000 });
    mockDB['persist-1'] = s1;
    mockDB['persist-2'] = s2;
    await useAgentStore.getState().initAgentSessions();
    const state = useAgentStore.getState();
    expect(state.sessions.length).toBeGreaterThanOrEqual(2);
  });
});

// S46-E1: Session search — searchableText build + filter
describe('agentStore S46-E1: session search', () => {
  beforeEach(async () => {
    Object.keys(mockDB).forEach((k) => delete mockDB[k]);
    useAgentStore.setState({ sessions: [], activeSessionKey: null, codeGenContext: null });
    vi.clearAllMocks();
  });

  it('addSession builds searchableText from name + task', () => {
    const session = makeSession({
      sessionKey: 'search-1',
      name: 'My Session',
      task: 'Implement login flow',
      messages: [],
    });
    useAgentStore.getState().addSession(session);
    const state = useAgentStore.getState();
    const found = state.sessions.find((s) => s.sessionKey === 'search-1');
    expect(found?.searchableText).toBe('my session implement login flow');
  });

  it('addSession builds searchableText from task only when name is missing', () => {
    const session = makeSession({
      sessionKey: 'search-2',
      name: undefined,
      task: 'Build user dashboard',
      messages: [],
    });
    useAgentStore.getState().addSession(session);
    const state = useAgentStore.getState();
    const found = state.sessions.find((s) => s.sessionKey === 'search-2');
    expect(found?.searchableText).toBe('build user dashboard');
  });

  it('addSession builds searchableText including first user message', () => {
    const session = makeSession({
      sessionKey: 'search-3',
      name: 'API Design',
      task: 'Design REST API',
      messages: [
        { id: 'm1', role: 'user', content: 'Create endpoints for users and posts', timestamp: 0 },
        { id: 'm2', role: 'agent', content: 'Here are the endpoints:', timestamp: 1 },
      ],
    });
    useAgentStore.getState().addSession(session);
    const state = useAgentStore.getState();
    const found = state.sessions.find((s) => s.sessionKey === 'search-3');
    expect(found?.searchableText).toContain('api design');
    expect(found?.searchableText).toContain('create endpoints for users and posts');
  });

  it('updateSession with name change rebuilds searchableText', () => {
    const session = makeSession({ sessionKey: 'search-4', name: 'Old Name', task: 'Test task' });
    useAgentStore.getState().addSession(session);
    useAgentStore.getState().updateSession('search-4', { name: 'New Name' });
    const state = useAgentStore.getState();
    const found = state.sessions.find((s) => s.sessionKey === 'search-4');
    expect(found?.searchableText).toBe('new name test task');
  });

  it('updateSession with message addition rebuilds searchableText', () => {
    const session = makeSession({
      sessionKey: 'search-5',
      name: 'Search Test',
      task: 'Unit tests',
      messages: [],
    });
    useAgentStore.getState().addSession(session);
    useAgentStore.getState().addMessage('search-5', {
      id: 'msg-1',
      role: 'user',
      content: 'Add more test coverage',
      timestamp: 1,
    });
    const state = useAgentStore.getState();
    const found = state.sessions.find((s) => s.sessionKey === 'search-5');
    expect(found?.searchableText).toContain('add more test coverage');
  });
});