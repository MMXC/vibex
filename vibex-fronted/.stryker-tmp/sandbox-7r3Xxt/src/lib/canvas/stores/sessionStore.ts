/**
 * VibeX sessionStore — Standalone Zustand Store
 * Extracted from canvasStore.ts as part of Epic 5 slice extraction.
 *
 * Responsibilities:
 * - SSE connection status
 * - AI thinking state
 * - Message history
 * - Prototype queue / project state
 * - generateContextsFromRequirement (cross-store: calls canvasSseApi, modifies contextStore)
 */
// @ts-nocheck

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PrototypePage, BoundedContextNode } from '../types';

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
  prototypeQueue: PrototypePage[];
  isPolling: boolean;
  setProjectId: (id: string | null) => void;
  setIsPolling: (polling: boolean) => void;
  addToQueue: (pages: PrototypePage[]) => void;
  updateQueueItem: (pageId: string, update: Partial<PrototypePage>) => void;
  removeFromQueue: (pageId: string) => void;
  clearQueue: () => void;

  // Abort controller
  abortControllerRef: AbortController | null;
  abortGeneration: () => void;

  // Generate contexts from requirement (cross-store)
  generateContextsFromRequirement: (text: string) => Promise<void>;
}

export const useSessionStore = create<SessionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // SSE status
        sseStatus: 'idle' as SSEStatus,
        sseError: null,
        setSseStatus: (status, error) =>
          set({ sseStatus: status, sseError: error ?? null }),

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
        prototypeQueue: [],
        isPolling: false,
        setProjectId: (id) => set({ projectId: id }),
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
        clearQueue: () => set({ prototypeQueue: [], projectId: null }),

        // === Abort controller ===
        abortControllerRef: null as AbortController | null,
        abortGeneration: () => {
          const { abortControllerRef } = get();
          if (abortControllerRef) {
            abortControllerRef.abort();
            set({ abortControllerRef: null, sseStatus: 'idle', flowGenerating: false, aiThinking: false });
          }
        },

        // === Generate contexts from requirement ===
        generateContextsFromRequirement: async (text: string) => {
          // Dynamic import to avoid circular deps
          const { canvasSseAnalyze } = require('../api/canvasSseApi') as typeof import('../api/canvasSseApi');
          const { useContextStore } = require('./contextStore');

          const { setAiThinking, setRequirementText, setPhase } = get();
          const contextStore = useContextStore.getState();

          // Reset state
          setAiThinking(true, '正在连接...');
          setRequirementText(text);
          setPhase('context');

          canvasSseAnalyze(text, {
            timeoutMs: 30000,
            onThinking: (content: string) => {
              setAiThinking(true, content);
            },
            onStepContext: (content: string, _mermaidCode: string | undefined, confidence: number | undefined, boundedContexts) => {
              setAiThinking(true, content);
              const mapContextType = (type: string): BoundedContextNode['type'] => {
                const validTypes = ['core', 'supporting', 'generic', 'external'];
                return validTypes.includes(type) ? type as BoundedContextNode['type'] : 'core';
              };
              const MAX_CONTEXT_NODES = 10;
              const MAX_NAME_LENGTH = 30;
              const truncateName = (name: string): string => {
                if (name.length <= MAX_NAME_LENGTH) return name;
                return name.substring(0, MAX_NAME_LENGTH - 3) + '...';
              };
              if (boundedContexts && boundedContexts.length > 0) {
                const nodesToAdd = boundedContexts.slice(0, MAX_CONTEXT_NODES);
                nodesToAdd.forEach((ctx: any) => {
                  contextStore.addContextNode({
                    name: truncateName(ctx.name),
                    description: ctx.description,
                    type: mapContextType(ctx.type),
                  });
                });
              } else if (confidence !== undefined && confidence > 0.5) {
                contextStore.addContextNode({
                  name: 'AI 分析上下文',
                  description: content,
                  type: 'core',
                });
              }
            },
            onStepModel: (content: string) => {
              setAiThinking(true, content);
            },
            onStepFlow: (content: string) => {
              setAiThinking(true, content);
            },
            onStepComponents: (content: string) => {
              setAiThinking(true, content);
            },
            onDone: () => {
              setAiThinking(false, null);
            },
            onError: () => {
              setAiThinking(false, null);
            },
          }).catch((err: unknown) => {
            setAiThinking(false, null);
            console.error('[sessionStore] generateContextsFromRequirement error:', err);
          });
        },
      }),
      {
        name: 'vibex-session-store',
        partialize: (state) => ({
          projectId: state.projectId,
          prototypeQueue: state.prototypeQueue,
        }),
      }
    ),
    { name: 'SessionStore' }
  )
);
