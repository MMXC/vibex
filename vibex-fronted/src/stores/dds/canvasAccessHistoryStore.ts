/**
 * canvasAccessHistoryStore.ts — S89-E1: Canvas Access History
 * 
 * Stores the last N access records per canvas (accessor + timestamp).
 * Used to display "recent collaborators" on canvas cards.
 * 
 * Persistence: localStorage via persist middleware.
 * Max entries: 5 per canvas.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AccessRecord {
  userId: string;
  userName: string;
  /** ISO timestamp of last access */
  accessedAt: string;
  /** Optional avatar URL */
  avatarUrl?: string;
}

export interface CanvasAccessHistory {
  canvasId: string;
  records: AccessRecord[];
  /** ISO timestamp of last update */
  updatedAt: string;
}

interface CanvasAccessHistoryState {
  /** canvasId → CanvasAccessHistory */
  history: Record<string, CanvasAccessHistory>;

  /** Record a new access event */
  recordAccess(canvasId: string, user: Omit<AccessRecord, 'accessedAt'>): void;

  /** Get the last N access records for a canvas */
  getRecentAccessors(canvasId: string, limit?: number): AccessRecord[];

  /** Get all access history for a canvas */
  getHistory(canvasId: string): CanvasAccessHistory | null;

  /** Clear history for a canvas */
  clearHistory(canvasId: string): void;
}

const MAX_RECORDS = 5;

export const useCanvasAccessHistoryStore = create<CanvasAccessHistoryState>()(
  persist(
    (set, get) => ({
      history: {},

      recordAccess(canvasId: string, user: Omit<AccessRecord, 'accessedAt'>): void {
        const now = new Date().toISOString();
        set((state) => {
          const existing = state.history[canvasId] ?? {
            canvasId,
            records: [],
            updatedAt: now,
          };

          // Deduplicate: update timestamp if user already in records
          const existingIdx = existing.records.findIndex((r) => r.userId === user.userId);
          const newRecord: AccessRecord = {
            ...user,
            accessedAt: now,
          };

          let updatedRecords: AccessRecord[];
          if (existingIdx >= 0) {
            // Update existing and move to front
            updatedRecords = [
              newRecord,
              ...existing.records.filter((_, i) => i !== existingIdx),
            ];
          } else {
            // Prepend new record, trim to MAX_RECORDS
            updatedRecords = [newRecord, ...existing.records].slice(0, MAX_RECORDS);
          }

          return {
            history: {
              ...state.history,
              [canvasId]: {
                canvasId,
                records: updatedRecords,
                updatedAt: now,
              },
            },
          };
        });
      },

      getRecentAccessors(canvasId: string, limit = MAX_RECORDS): AccessRecord[] {
        const hist = get().history[canvasId];
        if (!hist) return [];
        return hist.records.slice(0, limit);
      },

      getHistory(canvasId: string): CanvasAccessHistory | null {
        return get().history[canvasId] ?? null;
      },

      clearHistory(canvasId: string): void {
        set((state) => {
          const next = { ...state.history };
          delete next[canvasId];
          return { history: next };
        });
      },
    }),
    { name: 'vibex-canvas-access-history' }
  )
);
