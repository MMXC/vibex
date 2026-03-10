/**
 * Dialogue Store
 * 管理对话状态
 */

import { create } from 'zustand';

export interface DialogueMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  quickReplies?: string[];
}

export type DialoguePhase = 'clarification' | 'gathering' | 'refining' | 'complete';

export interface DialogueState {
  messages: DialogueMessage[];
  phase: DialoguePhase;
  completeness: number;
  isLoading: boolean;
  error: string | null;
}

export interface DialogueActions {
  addMessage: (message: Omit<DialogueMessage, 'timestamp'> & { timestamp?: number }) => void;
  clearMessages: () => void;
  setPhase: (phase: DialoguePhase) => void;
  setCompleteness: (completeness: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: DialogueState = {
  messages: [],
  phase: 'clarification',
  completeness: 0,
  isLoading: false,
  error: null,
};

export const useDialogueStore = create<DialogueState & DialogueActions>((set) => ({
  ...initialState,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, timestamp: message.timestamp || Date.now() },
      ],
    })),

  clearMessages: () =>
    set((state) => ({
      messages: [],
    })),

  setPhase: (phase) =>
    set(() => ({
      phase,
    })),

  setCompleteness: (completeness) =>
    set(() => ({
      completeness: Math.max(0, Math.min(100, completeness)),
    })),

  setLoading: (isLoading) =>
    set(() => ({
      isLoading,
    })),

  setError: (error) =>
    set(() => ({
      error,
    })),

  reset: () =>
    set(() => ({
      ...initialState,
    })),
}));

export default useDialogueStore;
