/**
 * agentStore.ts — Sprint6 U5: Agent Session Management
 *
 * Manages AI Coding Agent sessions with Zustand.
 */

'use client';

import { create } from 'zustand';
import type {
  AgentSession,
  AgentMessage,
  AgentSessionStatus,
} from '@/services/agent/CodingAgentService';

interface AgentState {
  sessions: AgentSession[];
  activeSessionKey: string | null;
}

interface AgentActions {
  addSession: (session: AgentSession) => void;
  updateSession: (sessionKey: string, updates: Partial<AgentSession>) => void;
  removeSession: (sessionKey: string) => void;
  setActiveSession: (sessionKey: string | null) => void;
  addMessage: (sessionKey: string, message: AgentMessage) => void;
  clearSessions: () => void;
}

export type AgentStore = AgentState & AgentActions;

export const useAgentStore = create<AgentStore>((set) => ({
  sessions: [],
  activeSessionKey: null,

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions].slice(0, 50), // keep max 50
      activeSessionKey: session.sessionKey,
    })),

  updateSession: (sessionKey, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionKey === sessionKey ? { ...s, ...updates } : s
      ),
    })),

  removeSession: (sessionKey) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.sessionKey !== sessionKey),
      activeSessionKey:
        state.activeSessionKey === sessionKey
          ? state.sessions[1]?.sessionKey ?? null
          : state.activeSessionKey,
    })),

  setActiveSession: (sessionKey) =>
    set({ activeSessionKey: sessionKey }),

  addMessage: (sessionKey, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.sessionKey === sessionKey
          ? { ...s, messages: [...s.messages, message] }
          : s
      ),
    })),

  clearSessions: () =>
    set({ sessions: [], activeSessionKey: null }),
}));
