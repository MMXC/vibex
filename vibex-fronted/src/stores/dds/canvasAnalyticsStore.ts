/**
 * canvasAnalyticsStore.ts — S71-E4: 画布使用统计分析
 *
 * Records edit events (position changes, text edits) per canvas/node.
 * Provides aggregation: topNodes, totalEdits, exportAnalytics CSV.
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

export interface CanvasStats {
  totalEdits: number;
  lastEdit: number;
  nodeEdits: Record<string, number>;
}

export interface TopNode {
  nodeId: string;
  editCount: number;
}

interface CanvasAnalyticsState {
  /** canvasId → stats */
  editingStats: Record<string, CanvasStats>;

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
        const lines = [
          `canvasId,nodeId,editCount`,
          ...Object.entries(stats.nodeEdits ?? {}).map(
            ([nodeId, count]) => `${canvasId},${nodeId},${count}`
          ),
          `,totalEdits,${stats.totalEdits}`,
        ];
        return lines.join('\n');
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
      partialize: (s) => ({ editingStats: s.editingStats }),
    }
  )
);
