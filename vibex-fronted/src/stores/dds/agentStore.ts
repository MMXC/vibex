/**
 * agentStore.ts — Sprint61 E4: AI Session Canvas Context Integration
 *
 * DDS-specific AI session store with:
 * - Canvas context injection (node/edge counts per chapter)
 * - Configurable retry settings (3 / 5 / infinite)
 * - Session-level canvas context stored per session
 *
 * Distinct from src/stores/agentStore.ts (coding agent, Sprint6).
 */

'use client';

import { create } from 'zustand';
import type { ChapterType } from '@/types/dds';

// ==================== Types ====================

export type RetryMode = '3' | '5' | 'infinite';

export interface CanvasContext {
  /** Summary string passed to AI: e.g. "4 nodes, 2 edges, chapters: requirement, flow" */
  summary: string;
  /** Per-chapter counts */
  chapterCounts: Record<ChapterType, { nodes: number; edges: number }>;
  /** Total node count across all chapters */
  totalNodes: number;
  /** Total edge count across all chapters */
  totalEdges: number;
  /** Project name or ID */
  projectId: string | null;
}

export interface AISession {
  id: string;
  /** Human-readable session name */
  name: string;
  /** Current retry mode */
  retryMode: RetryMode;
  /** Canvas context attached to this session */
  canvasContext: CanvasContext | null;
  /** Number of retries already attempted */
  retryCount: number;
  /** Whether session is currently in retry-wait state */
  isRetrying: boolean;
  /** Session creation timestamp */
  createdAt: string;
}

interface AgentState {
  sessions: AISession[];
  activeSessionId: string | null;
  /** Default retry mode for new sessions */
  defaultRetryMode: RetryMode;
}

interface AgentActions {
  addSession: (session: Omit<AISession, 'id' | 'createdAt'>) => AISession;
  updateSession: (id: string, updates: Partial<AISession>) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  setDefaultRetryMode: (mode: RetryMode) => void;
  setCanvasContext: (sessionId: string, context: CanvasContext) => void;
  startRetry: (sessionId: string) => void;
  clearRetry: (sessionId: string) => void;
  incrementRetryCount: (sessionId: string) => void;
}

export type AgentStore = AgentState & AgentActions;

// ==================== Helpers ====================

function generateSessionId(): string {
  return `ai-session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSessionName(): string {
  const now = new Date();
  return `AI Session ${now.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

// ==================== Store ====================

export const useAgentStore = create<AgentStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  defaultRetryMode: '3',

  addSession: (session) => {
    const id = generateSessionId();
    const now = new Date().toISOString();
    const fullSession: AISession = {
      ...session,
      id,
      name: session.name || buildSessionName(),
      createdAt: now,
    };
    set((state) => ({
      sessions: [fullSession, ...state.sessions].slice(0, 50),
      activeSessionId: id,
    }));
    return fullSession;
  },

  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId:
        state.activeSessionId === id
          ? (state.sessions.find((s) => s.id !== id)?.id ?? null)
          : state.activeSessionId,
    })),

  setActiveSession: (id) => set({ activeSessionId: id }),

  setDefaultRetryMode: (mode) => set({ defaultRetryMode: mode }),

  setCanvasContext: (sessionId, context) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, canvasContext: context } : s
      ),
    })),

  startRetry: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, isRetrying: true } : s
      ),
    })),

  clearRetry: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, isRetrying: false } : s
      ),
    })),

  incrementRetryCount: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, retryCount: s.retryCount + 1 } : s
      ),
    })),
}));

// ==================== Selectors ====================

export const selectActiveSession = (state: AgentStore) =>
  state.sessions.find((s) => s.id === state.activeSessionId) ?? null;

export const selectCanvasContext = (sessionId: string) => (state: AgentStore) =>
  state.sessions.find((s) => s.id === sessionId)?.canvasContext ?? null;

export const selectRetryCount = (sessionId: string) => (state: AgentStore) =>
  state.sessions.find((s) => s.id === sessionId)?.retryCount ?? 0;

export const selectIsRetrying = (sessionId: string) => (state: AgentStore) =>
  state.sessions.find((s) => s.id === sessionId)?.isRetrying ?? false;
