// History Store - manages undo/redo and project creation

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ConfirmationSnapshot } from './types';

const STORAGE_KEY = 'confirmation-history';

export interface HistoryState {
  history: ConfirmationSnapshot[];
  historyIndex: number;
  createdProjectId: string | null;
}

export interface HistoryActions {
  saveSnapshot: (snapshot: ConfirmationSnapshot) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setCreatedProjectId: (id: string | null) => void;
  reset: () => void;
}

export type HistoryStore = HistoryState & HistoryActions;

const initialState: HistoryState = {
  history: [],
  historyIndex: -1,
  createdProjectId: null,
};

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      saveSnapshot: (snapshot) => {
        const { history, historyIndex } = get();
        // Remove any redo history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(snapshot);

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          set({ historyIndex: historyIndex - 1 });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          set({ historyIndex: historyIndex + 1 });
        }
      },

      canUndo: () => {
        const { history, historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      setCreatedProjectId: (id) => set({ createdProjectId: id }),

      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
