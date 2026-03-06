// Context Store - manages bounded contexts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BoundedContext } from './types';

const STORAGE_KEY = 'confirmation-context';

export interface ContextState {
  boundedContexts: BoundedContext[];
  selectedContextIds: string[];
  contextMermaidCode: string;
}

export interface ContextActions {
  setBoundedContexts: (contexts: BoundedContext[]) => void;
  setSelectedContextIds: (ids: string[]) => void;
  setContextMermaidCode: (code: string) => void;
}

export type ContextStore = ContextState & ContextActions;

const initialState: ContextState = {
  boundedContexts: [],
  selectedContextIds: [],
  contextMermaidCode: '',
};

export const useContextStore = create<ContextStore>()(
  persist(
    (set) => ({
      ...initialState,

      setBoundedContexts: (contexts) => set({ boundedContexts: contexts }),
      setSelectedContextIds: (ids) => set({ selectedContextIds: ids }),
      setContextMermaidCode: (code) => set({ contextMermaidCode: code }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
