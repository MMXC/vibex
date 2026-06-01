/**
 * canvasHistoryStore — Command Pattern undo/redo for DDS Canvas
 *
 * P001: Epic1-UndoRedo U1
 *
 * 设计决策：
 * - Command Pattern：每个操作记录 execute/rollback 闭包
 * - 50步限制：past 超长时 shift 淘汰最旧记录
 * - future 在 execute 时清空（撤销后做新操作会覆盖 redo 栈）
 * - isPerforming 标志防止嵌套执行
 */

import { create } from 'zustand';

// ==================== Command Interface ====================

export interface Command {
  id: string;
  execute: () => void;
  rollback: () => void;
  timestamp: number;
  description?: string;
}

// ==================== CommandMeta (E1 — Sprint51) ====================

/** Serializable command metadata for IndexedDB persistence */
export interface CommandMeta {
  id: string;
  timestamp: number;
  description?: string;
}

// ==================== Constants ====================

export const MAX_HISTORY = 50;

// ==================== State Interface ====================

interface CanvasHistoryState {
  past: Command[];
  future: Command[];
  isPerforming: boolean;
  /** Push a new command, execute it, and push to history */
  execute: (cmd: Command) => void;
  /** Undo last command */
  undo: () => void;
  /** Redo next command */
  redo: () => void;
  /** Clear all history */
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Undo all commands back to (and including) targetIndex in past */
  selectiveUndo: (targetIndex: number) => void;
  /** Returns current position in history stack */
  getPosition: () => { current: number; total: number };
  // E1: IndexedDB persistence actions
  /** Save current history to IndexedDB for a given canvas */
  saveHistory: (canvasId: string) => Promise<void>;
  /** Load history metadata from IndexedDB (closures not restored) */
  loadHistory: (canvasId: string) => Promise<{ past: CommandMeta[]; future: CommandMeta[] } | null>;
  /** Clear history from IndexedDB for a given canvas */
  clearHistory: (canvasId: string) => Promise<void>;
}

// ==================== Helper ====================

/** Pop the last element from an array, returning it (or undefined if empty). */
function popLast<T>(arr: T[]): { item: T | undefined; rest: T[] } {
  if (arr.length === 0) return { item: undefined, rest: arr };
  const rest = arr.slice(0, -1);
  const item = arr[arr.length - 1];
  return { item, rest };
}

// ==================== Store ====================

export const useCanvasHistoryStore = create<CanvasHistoryState>((set, get) => ({
  past: [],
  future: [],
  isPerforming: false,

  execute: (cmd: Command) => {
    if (get().isPerforming) return;
    set({ isPerforming: true });
    try {
      cmd.execute();
      set((state) => {
        const past = [...state.past, cmd];
        if (past.length > MAX_HISTORY) {
          past.shift();
        }
        return { past, future: [] };
      });
    } finally {
      set({ isPerforming: false });
    }
  },

  undo: () => {
    const { past, isPerforming } = get();
    if (past.length === 0 || isPerforming) return;
    set({ isPerforming: true });
    try {
      const { item: cmd, rest } = popLast(past);
      if (!cmd) { set({ isPerforming: false }); return; }
      cmd.rollback();
      set({ past: rest, future: [cmd, ...get().future] });
    } finally {
      set({ isPerforming: false });
    }
  },

  redo: () => {
    const { future, isPerforming } = get();
    if (future.length === 0 || isPerforming) return;
    set({ isPerforming: true });
    try {
      const { item: cmd, rest } = popLast([...future].reverse());
      if (!cmd) { set({ isPerforming: false }); return; }
      cmd.execute();
      set((state) => ({
        past: [...state.past, cmd],
        future: rest.reverse(),
      }));
    } finally {
      set({ isPerforming: false });
    }
  },

  clear: () => set({ past: [], future: [] }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  /** Undo all commands from (targetIndex+1) to end of past stack */
  selectiveUndo: (targetIndex: number) => {
    const { past, future, isPerforming } = get();
    if (isPerforming || targetIndex < 0) return;
    set({ isPerforming: true });
    try {
      if (targetIndex < past.length - 1) {
        // targetIndex is within the past — roll back newer commands
        const toUndo = past.slice(targetIndex + 1);
        for (let i = toUndo.length - 1; i >= 0; i--) {
          toUndo[i].rollback();
        }
        set((state) => ({
          past: state.past.slice(0, targetIndex + 1),
          future: [...toUndo, ...state.future],
        }));
      } else {
        // targetIndex >= past.length - 1 (at or past current state)
        // Calculate how many future commands to re-apply
        const steps = targetIndex - (past.length - 1);
        for (let i = 0; i < steps; i++) {
          get().redo();
        }
      }
    } finally {
      set({ isPerforming: false });
    }
  },

  /** Returns { current: position in past (0-indexed), total: past.length } */
  getPosition: () => {
    const { past } = get();
    return { current: past.length, total: past.length };
  },

  // E1: IndexedDB persistence actions (Sprint51)
  saveHistory: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const { past, future } = get();
    const { saveHistoryToDB } = await import('@/lib/canvas/historyDB');
    await saveHistoryToDB(canvasId, past, future);
  },

  loadHistory: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return null;
    const { loadHistoryFromDB } = await import('@/lib/canvas/historyDB');
    return loadHistoryFromDB(canvasId);
  },

  clearHistory: async (canvasId: string) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const { clearHistoryFromDB } = await import('@/lib/canvas/historyDB');
    await clearHistoryFromDB(canvasId);
  },
}))


/**
 * Save current history state to localStorage.
 * Note: Command execute/rollback closures are NOT serialized.
 * Only metadata is persisted. On restore, history starts empty (fresh commands needed).
 *
 * Key format: vibex-dds-history-{canvasId}
 */
export function saveHistoryToStorage(canvasId: string): void {
  try {
    const state = useCanvasHistoryStore.getState();
    const payload = {
      past: state.past.map((cmd) => ({
        id: cmd.id,
        timestamp: cmd.timestamp,
        description: cmd.description,
      })),
      future: state.future.map((cmd) => ({
        id: cmd.id,
        timestamp: cmd.timestamp,
        description: cmd.description,
      })),
    };
    localStorage.setItem(`vibex-dds-history-${canvasId}`, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (e.g., private browsing, quota exceeded)
  }
}

/**
 * Restore history metadata from localStorage.
 * Returns null if no history saved or parse fails.
 * Note: The actual Command objects cannot be restored (closures lost in serialization).
 * Callers should initialize empty history and require fresh commands.
 */
export function loadHistoryFromStorage(canvasId: string): {
  pastMeta: Array<{ id: string; timestamp: number; description?: string }>;
  futureMeta: Array<{ id: string; timestamp: number; description?: string }>;
} | null {
  try {
    const raw = localStorage.getItem(`vibex-dds-history-${canvasId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      pastMeta: Array.isArray(parsed.past) ? parsed.past : [],
      futureMeta: Array.isArray(parsed.future) ? parsed.future : [],
    };
  } catch {
    return null;
  }
}

/**
 * Clear history from localStorage for a given canvasId.
 */
export function clearHistoryFromStorage(canvasId: string): void {
  try {
    localStorage.removeItem(`vibex-dds-history-${canvasId}`);
  } catch {
    // ignore
  }
}

export type { CanvasHistoryState };