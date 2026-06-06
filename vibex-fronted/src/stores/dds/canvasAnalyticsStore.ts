/**
 * canvasAnalyticsStore.ts — S71-E4: 画布使用统计分析
 * S72-E4 扩展: history 归档 + getHistory() + shareAnalytics() + exportAnalytics JSON扩展
 *
 * Records edit events (position changes, text edits) per canvas/node.
 * Provides aggregation: topNodes, totalEdits, exportAnalytics CSV/JSON.
 *
 * Architecture: Zustand + localStorage persist.
 * Debounce: callers should debounce at 5min before calling recordEdit.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditEvent {
  canvasId: string;
  nodeId: string;
  type: 'position' | 'text' | 'add' | 'delete';
  timestamp: number;
}

/** S72-E4: Single analytics snapshot entry */
export interface AnalyticsEntry {
  date: string; // ISO date string YYYY-MM-DD
  canvasId: string;
  totalEdits: number;
  nodeCount: number;
  topNodes: { nodeId: string; editCount: number }[];
}

export interface CanvasStats {
  totalEdits: number;
  lastEdit: number;
  nodeEdits: Record<string, number>;
}

export interface TopNode {
  nodeId: string;
  editCount: number;
}

/** Share data stored in localStorage */
interface ShareRecord {
  shareId: string;
  canvasId: string;
  data: {
    history: AnalyticsEntry[];
    stats: CanvasStats;
  };
  createdAt: number;
}

interface CanvasAnalyticsState {
  /** canvasId → stats */
  editingStats: Record<string, CanvasStats>;

  /** S72-E4: History entries for trend chart */
  history: AnalyticsEntry[];

  /** S72-E4: Archive current stats as a daily snapshot */
  archiveHistory(canvasId: string): void;

  /** S72-E4: Get history entries within the given range */
  getHistory(range: '7d' | '30d'): AnalyticsEntry[];

  /** S72-E4: Generate a shareId and persist share data */
  shareAnalytics(canvasId: string): string;

  /** Persisted via localStorage */
  getStats(canvasId: string): CanvasStats;
  getTopNodes(canvasId: string, limit?: number): TopNode[];
  recordEdit(canvasId: string, nodeId: string, type: EditEvent['type']): void;
  exportAnalytics(canvasId: string): string;
  clearStats(canvasId: string): void;
}

export const useCanvasAnalyticsStore = create<CanvasAnalyticsState>()(
  persist(
    (set, get) => ({
      editingStats: {},
      history: [],

      archiveHistory(canvasId: string): void {
        const stats = get().getStats(canvasId);
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const nodeEntries = Object.entries(stats.nodeEdits ?? {});
        set((state) => {
          // Skip if already archived today for this canvas
          const existingIdx = state.history.findIndex(
            (e) => e.canvasId === canvasId && e.date === today
          );
          const entry: AnalyticsEntry = {
            date: today,
            canvasId,
            totalEdits: stats.totalEdits,
            nodeCount: nodeEntries.length,
            topNodes: nodeEntries
              .map(([nodeId, editCount]) => ({ nodeId, editCount }))
              .sort((a, b) => b.editCount - a.editCount)
              .slice(0, 10),
          };
          if (existingIdx >= 0) {
            const next = [...state.history];
            next[existingIdx] = entry;
            return { history: next };
          }
          return { history: [...state.history, entry] };
        });
      },

      getHistory(range: '7d' | '30d'): AnalyticsEntry[] {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (range === '7d' ? 7 : 30));
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return get().history.filter((e) => e.date >= cutoffStr);
      },

      shareAnalytics(canvasId: string): string {
        const shareId = Math.random().toString(36).slice(2, 10);
        const stats = get().getStats(canvasId);
        const shareData: ShareRecord = {
          shareId,
          canvasId,
          data: {
            history: get().history.filter((e) => e.canvasId === canvasId),
            stats,
          },
          createdAt: Date.now(),
        };
        // Persist via localStorage
        try {
          const existing = JSON.parse(localStorage.getItem('canvas-analytics-share') ?? '{}');
          existing[shareId] = shareData;
          localStorage.setItem('canvas-analytics-share', JSON.stringify(existing));
        } catch {
          // localStorage not available (e.g., SSR)
        }
        return shareId;
      },

      getStats(canvasId: string): CanvasStats {
        return get().editingStats[canvasId] ?? {
          totalEdits: 0,
          lastEdit: 0,
          nodeEdits: {},
        };
      },

      getTopNodes(canvasId: string, limit = 5): TopNode[] {
        const stats = get().getStats(canvasId);
        return Object.entries(stats.nodeEdits ?? {})
          .map(([nodeId, count]) => ({ nodeId, editCount: count }))
          .sort((a, b) => b.editCount - a.editCount)
          .slice(0, limit);
      },

      recordEdit(canvasId: string, nodeId: string, type: EditEvent['type']): void {
        set((state) => {
          const prev = state.editingStats[canvasId] ?? {
            totalEdits: 0, lastEdit: 0, nodeEdits: {},
          };
          return {
            editingStats: {
              ...state.editingStats,
              [canvasId]: {
                totalEdits: prev.totalEdits + 1,
                lastEdit: Date.now(),
                nodeEdits: {
                  ...prev.nodeEdits,
                  [nodeId]: (prev.nodeEdits[nodeId] ?? 0) + 1,
                },
              },
            },
          };
        });
      },

      exportAnalytics(canvasId: string): string {
        const stats = get().getStats(canvasId);
        const canvasHistory = get().history.filter((e) => e.canvasId === canvasId);
        // JSON format with history time series
        return JSON.stringify(
          {
            canvasId,
            stats,
            history: canvasHistory,
          },
          null,
          2
        );
      },

      clearStats(canvasId: string): void {
        set((state) => {
          const next = { ...state.editingStats };
          delete next[canvasId];
          return { editingStats: next };
        });
      },
    }),
    {
      name: 'canvas-analytics',
      partialize: (s) => ({ editingStats: s.editingStats, history: s.history }),
    }
  )
);
