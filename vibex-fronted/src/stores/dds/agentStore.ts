/**
 * agentStore.ts — Sprint61 E4 + Sprint63 E4 + Sprint64 E3: AI Session Canvas Context Integration + Streaming + Persistence
 *
 * DDS-specific AI session store with:
 * - Canvas context injection (node/edge counts per chapter)
 * - Configurable retry settings (3 / 5 / infinite)
 * - Session-level canvas context stored per session
 * - SSE streaming: streamingContent, isStreaming, lastPrompt
 * - Session history: IndexedDB-backed sessionHistory for cross-refresh persistence
 *
 * Distinct from src/stores/agentStore.ts (coding agent, Sprint6).
 */

'use client';

import { create } from 'zustand';
import type { ChapterType } from '@/types/dds';
import {
  saveSessionToHistory,
  loadSessionsFromHistory,
  deleteSessionFromHistory,
  clearAllHistory,
  type AISessionHistory,
} from '@/lib/ai-session-db';

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
  /** Per-session streaming content (sessionId -> content) */
  streamingContent: Record<string, string>;
  /** Per-session streaming state (sessionId -> isStreaming) */
  isStreaming: Record<string, boolean>;
  /** Per-session last prompt (sessionId -> prompt) for retry */
  lastPrompt: Record<string, string>;
  /** S64-E3: Session history from IndexedDB (persisted across page refresh) */
  sessionHistory: AISessionHistory[];
  /** S64-E3: Whether sessionHistory has been loaded from IndexedDB */
  sessionHistoryLoaded: boolean;
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
  // Streaming actions (E4)
  streamSession: (sessionId: string, prompt: string, canvasContext?: CanvasContext | null) => Promise<void>;
  appendStreamChunk: (sessionId: string, chunk: string) => void;
  endStream: (sessionId: string) => void;
  clearStreamContent: (sessionId: string) => void;
  retryLastStream: (sessionId: string) => Promise<void>;
  cancelStream: (sessionId: string) => void;
  // S64-E3: Session history actions (IndexedDB-backed)
  /** Load session history from IndexedDB (called on app init) */
  loadSessions: () => Promise<void>;
  /** Save a completed session to IndexedDB history */
  saveSession: (sessionId: string) => Promise<void>;
  /** Delete a session from IndexedDB history */
  clearSession: (sessionId: string) => Promise<void>;
  /** Clear all session history */
  clearAllSessions: () => Promise<void>;
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

/** AbortController registry for stream cancellation */
const streamControllers: Map<string, AbortController> = new Map();

// ==================== Store ====================

export const useAgentStore = create<AgentStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  defaultRetryMode: '3',
  streamingContent: {},
  isStreaming: {},
  lastPrompt: {},
  sessionHistory: [],
  sessionHistoryLoaded: false,

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
    set((state) => {
      // Clean up streaming state
      const { [id]: _sc, ...restSc } = state.streamingContent;
      const { [id]: _is, ...restIs } = state.isStreaming;
      const { [id]: _lp, ...restLp } = state.lastPrompt;
      streamControllers.delete(id);
      return {
        sessions: state.sessions.filter((s) => s.id !== id),
        activeSessionId:
          state.activeSessionId === id
            ? (state.sessions.find((s) => s.id !== id)?.id ?? null)
            : state.activeSessionId,
        streamingContent: restSc,
        isStreaming: restIs,
        lastPrompt: restLp,
      };
    }),

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

  // ==================== Streaming Actions (E4) ====================

  clearStreamContent: (sessionId) =>
    set((state) => {
      const { [sessionId]: _, ...rest } = state.streamingContent;
      const { [sessionId]: __, ...restIs } = state.isStreaming;
      return { streamingContent: rest, isStreaming: restIs };
    }),

  appendStreamChunk: (sessionId, chunk) =>
    set((state) => ({
      streamingContent: {
        ...state.streamingContent,
        [sessionId]: (state.streamingContent[sessionId] ?? '') + chunk,
      },
    })),

  endStream: (sessionId) =>
    set((state) => ({
      isStreaming: { ...state.isStreaming, [sessionId]: false },
    })),

  cancelStream: (sessionId) => {
    const controller = streamControllers.get(sessionId);
    if (controller) {
      controller.abort();
      streamControllers.delete(sessionId);
    }
    set((state) => ({
      isStreaming: { ...state.isStreaming, [sessionId]: false },
    }));
  },

  streamSession: async (sessionId, prompt, canvasContext) => {
    const state = get();
    // Set streaming state
    set((s) => ({
      isStreaming: { ...s.isStreaming, [sessionId]: true },
      streamingContent: { ...s.streamingContent, [sessionId]: '' },
      lastPrompt: { ...s.lastPrompt, [sessionId]: prompt },
    }));

    // Attach canvas context if provided
    if (canvasContext) {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (session) {
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, canvasContext }
              : sess
          ),
        }));
      }
    }

    const controller = new AbortController();
    streamControllers.set(sessionId, controller);

    try {
      // Build messages with optional canvas context
      const session = state.sessions.find((s) => s.id === sessionId);
      const contextPrompt = session?.canvasContext
        ? `[Canvas Context] ${session.canvasContext.summary}\n\n`
        : '';
      const fullPrompt = contextPrompt + prompt;

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullPrompt,
          stream: true,
          conversationId: sessionId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              get().appendStreamChunk(sessionId, parsed.content);
            }
            if (parsed.done) break;
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Cancelled by user — clear streaming state silently
      } else {
        console.error('[agentStore] streamSession error:', err);
        // Append error to streaming content
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        get().appendStreamChunk(sessionId, `\n[Error: ${errorMsg}]`);
      }
    } finally {
      streamControllers.delete(sessionId);
      // S64-E3: capture content before endStream clears streaming state
      const finalContent = get().streamingContent[sessionId] ?? '';
      const prompt = get().lastPrompt[sessionId] ?? '';
      get().endStream(sessionId);
      // S64-E3: auto-save completed session to IndexedDB history
      if (finalContent && prompt) {
        get().saveSession({ id: sessionId, prompt, response: finalContent, timestamp: Date.now() });
      }
    }
  },

  retryLastStream: async (sessionId) => {
    const state = get();
    const lastPrompt = state.lastPrompt[sessionId];
    if (!lastPrompt) return;
    const session = state.sessions.find((s) => s.id === sessionId);
    get().startRetry(sessionId);
    await get().streamSession(sessionId, lastPrompt, session?.canvasContext ?? null);
    get().clearRetry(sessionId);
    get().incrementRetryCount(sessionId);
  },

  // ==================== S64-E3: Session History Actions ====================

  /**
   * Load session history from IndexedDB.
   * Safe to call multiple times — only loads if not yet loaded.
   */
  loadSessions: async () => {
    const state = get();
    if (state.sessionHistoryLoaded) return;
    try {
      const history = await loadSessionsFromHistory();
      set({ sessionHistory: history, sessionHistoryLoaded: true });
    } catch (err) {
      console.error('[agentStore] loadSessions error:', err);
      // Still mark as loaded to avoid repeated attempts
      set({ sessionHistoryLoaded: true });
    }
  },

  /**
   * Save a session to IndexedDB history.
   * Truncates prompt/response to display-friendly summaries.
   */
  saveSession: async (sessionId) => {
    const state = get();
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const prompt = state.lastPrompt[sessionId] ?? '';
    const response = state.streamingContent[sessionId] ?? '';

    const historyEntry: AISessionHistory = {
      id: session.id,
      name: session.name,
      promptSummary: prompt.slice(0, 200),
      responseSummary: response.slice(0, 300),
      canvasContextSummary: session.canvasContext?.summary ?? null,
      createdAt: session.createdAt,
      archivedAt: new Date().toISOString(),
    };

    try {
      await saveSessionToHistory(historyEntry);
      // Update local state
      set((s) => ({
        sessionHistory: [historyEntry, ...s.sessionHistory].slice(0, 100),
      }));
    } catch (err) {
      console.error('[agentStore] saveSession error:', err);
    }
  },

  /**
   * Delete a session from IndexedDB history.
   */
  clearSession: async (sessionId) => {
    try {
      await deleteSessionFromHistory(sessionId);
      set((state) => ({
        sessionHistory: state.sessionHistory.filter((h) => h.id !== sessionId),
      }));
    } catch (err) {
      console.error('[agentStore] clearSession error:', err);
    }
  },

  /**
   * Clear all session history from IndexedDB.
   */
  clearAllSessions: async () => {
    try {
      await clearAllHistory();
      set({ sessionHistory: [] });
    } catch (err) {
      console.error('[agentStore] clearAllSessions error:', err);
    }
  },
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

// Streaming selectors (E4)
export const selectStreamingContent = (sessionId: string) => (state: AgentStore) =>
  state.streamingContent[sessionId] ?? '';

export const selectIsStreaming = (sessionId: string) => (state: AgentStore) =>
  state.isStreaming[sessionId] ?? false;

export const selectLastPrompt = (sessionId: string) => (state: AgentStore) =>
  state.lastPrompt[sessionId] ?? '';
