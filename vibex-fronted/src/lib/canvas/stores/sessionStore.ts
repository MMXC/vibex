/**
 * VibeX sessionStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 5 slice extraction.
 *
 * Responsibilities:
 * - SSE connection status
 * - AI thinking state
 * - Message history
 * - Prototype queue / project state
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PrototypePage } from '../types';

export type SSEStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type MessageType = 'user_action' | 'ai_suggestion' | 'system' | 'command_executed';
export interface MessageItem {
  id: string;
  type: MessageType;
  content: string;
  meta?: string;
  timestamp: number;
}

let _messageIdCounter = 0;
function newMessageId(): string {
  return `msg-${Date.now()}-${++_messageIdCounter}`;
}

interface SessionStore {
  // SSE status
  sseStatus: SSEStatus;
  sseError: string | null;
  setSseStatus: (status: SSEStatus, error?: string) => void;
  abortGeneration: () => void;

  // AI thinking state
  aiThinking: boolean;
  aiThinkingMessage: string | null;
  flowGenerating: boolean;
  flowGeneratingMessage: string | null;
  requirementText: string;
  setAiThinking: (thinking: boolean, message?: string | null) => void;
  setFlowGenerating: (generating: boolean, message?: string | null) => void;
  setRequirementText: (text: string) => void;

  // Message history
  messages: MessageItem[];
  addMessage: (msg: Omit<MessageItem, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Queue / project
  projectId: string | null;
  projectName: string | null;
  prototypeQueue: PrototypePage[];
  isPolling: boolean;
  setProjectId: (id: string | null) => void;
  setProjectName: (name: string | null) => void;
  setIsPolling: (polling: boolean) => void;
  addToQueue: (pages: PrototypePage[]) => void;
  updateQueueItem: (pageId: string, update: Partial<PrototypePage>) => void;
  removeFromQueue: (pageId: string) => void;
  clearQueue: () => void;
}

export const useSessionStore = create<SessionStore>()(
  devtools(
    persist(
      (set) => ({
        // SSE status
        sseStatus: 'idle' as SSEStatus,
        sseError: null,
        setSseStatus: (status, error) =>
          set({ sseStatus: status, sseError: error ?? null }),

        abortGeneration: () => {
          set({ sseStatus: 'idle', flowGenerating: false, aiThinking: false, aiThinkingMessage: null });
        },

        // AI thinking
        aiThinking: false,
        aiThinkingMessage: null,
        flowGenerating: false,
        flowGeneratingMessage: null,
        requirementText: '',
        setAiThinking: (thinking, message) =>
          set({ aiThinking: thinking, aiThinkingMessage: message ?? null }),
        setFlowGenerating: (generating, message) =>
          set({ flowGenerating: generating, flowGeneratingMessage: message ?? null }),
        setRequirementText: (text) => set({ requirementText: text }),

        // Messages
        messages: [],
        addMessage: (msg) =>
          set((s) => ({
            messages: [...s.messages, { ...msg, id: newMessageId(), timestamp: Date.now() }],
          })),
        clearMessages: () => set({ messages: [] }),

        // Queue
        projectId: null,
        projectName: null,
        prototypeQueue: [],
        isPolling: false,
        setProjectId: (id) => set({ projectId: id }),
        setProjectName: (name) => set({ projectName: name }),
        setIsPolling: (polling) => set({ isPolling: polling }),
        addToQueue: (pages) =>
          set((s) => ({ prototypeQueue: [...s.prototypeQueue, ...pages] })),
        updateQueueItem: (pageId, update) =>
          set((s) => ({
            prototypeQueue: s.prototypeQueue.map((p) =>
              p.pageId === pageId ? { ...p, ...update } : p
            ),
          })),
        removeFromQueue: (pageId) =>
          set((s) => ({ prototypeQueue: s.prototypeQueue.filter((p) => p.pageId !== pageId) })),
        clearQueue: () => set({ prototypeQueue: [], projectId: null, projectName: null }),
      }),
      { name: 'vibex-session-store' }
    ),
    { name: 'SessionStore' }
  )
);
