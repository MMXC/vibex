/**
 * agentStore.ts — Sprint6 U5: Agent Session Management
 * Sprint44 P001-E1: IndexedDB persistence via agentDB
 *
 * Manages AI Coding Agent sessions with Zustand.
 * Sessions are persisted to IndexedDB on every create/update/delete.
 */

'use client';

import { create } from 'zustand';
import type {
  AgentSession,
  AgentMessage,
} from '@/services/agent/CodingAgentService';
import type { CodeGenContext } from '@/types/codegen';
import { initAgentDB, persistSession, loadSessionList, deleteSession as dbDeleteSession } from '@/lib/agentDB';

interface AgentState {
  sessions: AgentSession[];
  activeSessionKey: string | null;
  /** Injected code generation context from design tool export */
  codeGenContext: CodeGenContext | null;
}

interface AgentActions {
  addSession: (session: AgentSession) => void;
  updateSession: (sessionKey: string, updates: Partial<AgentSession>) => void;
  removeSession: (sessionKey: string) => void;
  setActiveSession: (sessionKey: string | null) => void;
  addMessage: (sessionKey: string, message: AgentMessage) => void;
  clearSessions: () => void;
  /**
   * Inject and validate a CodeGenContext from a design tool export.
   * Throws if the input does not conform to the expected shape.
   */
  injectContext: (raw: unknown) => asserts raw is CodeGenContext;
  /** S44-E1: Initialize IndexedDB and load persisted sessions */
  initAgentSessions: () => Promise<void>;
}

export type AgentStore = AgentState & AgentActions;

export const useAgentStore = create<AgentStore>((set) => ({
  sessions: [],
  activeSessionKey: null,
  codeGenContext: null,

  addSession: (session) =>
    set((state) => {
      const newSessions = [session, ...state.sessions].slice(0, 50);
      // Persist to IndexedDB (async, non-blocking)
      void persistSession(session);
      void initAgentDB(); // ensure DB is open
      return { sessions: newSessions, activeSessionKey: session.sessionKey };
    }),

  updateSession: (sessionKey, updates) =>
    set((state) => {
      const updated = state.sessions.map((s) =>
        s.sessionKey === sessionKey ? { ...s, ...updates } : s
      );
      const updatedSession = updated.find((s) => s.sessionKey === sessionKey);
      if (updatedSession) {
        void persistSession(updatedSession); // async persist
      }
      return { sessions: updated };
    }),

  removeSession: (sessionKey) =>
    set((state) => {
      void dbDeleteSession(sessionKey); // async delete from IndexedDB
      return {
        sessions: state.sessions.filter((s) => s.sessionKey !== sessionKey),
        activeSessionKey:
          state.activeSessionKey === sessionKey
            ? (state.sessions[1]?.sessionKey ?? null)
            : state.activeSessionKey,
      };
    }),

  setActiveSession: (sessionKey) => set({ activeSessionKey: sessionKey }),

  addMessage: (sessionKey, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionKey === sessionKey
          ? { ...s, messages: [...s.messages, message] }
          : s
      ),
    })),

  clearSessions: () => set({ sessions: [], activeSessionKey: null }),

  injectContext: (raw) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('injectContext: input must be a non-null object');
    }

    const ctx = raw as Record<string, unknown>;

    if (ctx['type'] !== 'codegen') {
      throw new Error(
        `injectContext: 'type' field must be 'codegen', got ${JSON.stringify(ctx['type'])}`
      );
    }
    if (typeof ctx['generatedCode'] !== 'string') {
      throw new Error(
        `injectContext: 'generatedCode' must be a string, got ${typeof ctx['generatedCode']}`
      );
    }
    if (!Array.isArray(ctx['nodes'])) {
      throw new Error(
        `injectContext: 'nodes' must be an array, got ${typeof ctx['nodes']}`
      );
    }
    for (const node of ctx['nodes'] as unknown[]) {
      if (typeof node !== 'object' || node === null) {
        throw new Error(
          'injectContext: each node in nodes must be a non-null object'
        );
      }
      const n = node as Record<string, unknown>;
      if (typeof n['id'] !== 'string') {
        throw new Error(
          `injectContext: node.id must be a string, got ${typeof n['id']}`
        );
      }
      if (typeof n['type'] !== 'string') {
        throw new Error(
          `injectContext: node.type must be a string, got ${typeof n['type']}`
        );
      }
    }
    if (typeof ctx['schemaVersion'] !== 'string') {
      throw new Error(
        `injectContext: 'schemaVersion' must be a string, got ${typeof ctx['schemaVersion']}`
      );
    }
    if (typeof ctx['exportedAt'] !== 'string') {
      throw new Error(
        `injectContext: 'exportedAt' must be a string (ISO-8601), got ${typeof ctx['exportedAt']}`
      );
    }

    set({ codeGenContext: raw as CodeGenContext });
  },

  /** S44-E1: Load persisted sessions from IndexedDB on app init */
  initAgentSessions: async () => {
    try {
      const db = await initAgentDB();
      void db; // DB is open; loadSessionList reads it lazily
      const sessions = await loadSessionList();
      // Only restore if we don't already have sessions (avoid overwriting in-flight state)
      const current = useAgentStore.getState();
      if (current.sessions.length === 0 && sessions.length > 0) {
        set({
          sessions,
          activeSessionKey: sessions[0]?.sessionKey ?? null,
        });
      }
    } catch (err) {
      console.warn('[agentStore] Failed to load sessions from IndexedDB:', err);
    }
  },
}));
