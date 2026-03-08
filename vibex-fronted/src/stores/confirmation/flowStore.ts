// Flow Store - manages business flow

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BusinessFlow } from './types';

const STORAGE_KEY = 'confirmation-flow';

export interface FlowState {
  businessFlow: BusinessFlow;
  flowMermaidCode: string;
}

export interface FlowActions {
  setBusinessFlow: (flow: BusinessFlow) => void;
  setFlowMermaidCode: (code: string) => void;
}

export type FlowStore = FlowState & FlowActions;

const initialState: FlowState = {
  businessFlow: {
    id: '',
    name: '',
    states: [],
    transitions: [],
  },
  flowMermaidCode: '',
};

export const useFlowStore = create<FlowStore>()(
  persist(
    (set) => ({
      ...initialState,

      setBusinessFlow: (flow) => set({ businessFlow: flow }),
      setFlowMermaidCode: (code) => set({ flowMermaidCode: code }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
