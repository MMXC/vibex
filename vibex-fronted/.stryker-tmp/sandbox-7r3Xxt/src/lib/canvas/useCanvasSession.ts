/**
 * useCanvasSession — Composed hook for canvas session state
 *
 * Epic 2: 新建 useCanvasSession hook
 * Returns: sessionId + 三棵树 + messages + drawerState + AI状态
 *
 * PRD S2.2: hook 返回 sessionId + 三棵树 + messages + projectId + drawerState
 * PRD S2.3: hook 返回 AI 状态 + SSE 状态
 */
// @ts-nocheck


import { useMemo } from 'react';
import { useContextStore } from './stores/contextStore';
import { useFlowStore } from './stores/flowStore';
import { useComponentStore } from './stores/componentStore';
import { useUIStore } from './stores/uiStore';
import { useSessionStore } from './stores/sessionStore';
import { useMessageDrawerStore } from '@/components/canvas/messageDrawer/messageDrawerStore';

/**
 * Session ID — use projectId if set, otherwise generate from timestamp
 */
function useSessionId(): string {
  const projectId = useSessionStore((s) => s.projectId);
  return useMemo(() => projectId ?? `session-${Date.now()}`, [projectId]);
}

export interface UseCanvasSessionReturn {
  /** Unique session identifier (projectId or generated) */
  sessionId: string;
  /** Bounded Context nodes */
  contextNodes: ReturnType<typeof useContextStore.getState>['contextNodes'];
  /** Business Flow nodes */
  flowNodes: ReturnType<typeof useContextStore.getState>['flowNodes'];
  /** Component nodes */
  componentNodes: ReturnType<typeof useContextStore.getState>['componentNodes'];
  /** Project ID (may be null) */
  projectId: string | null;
  /** Messages from message drawer */
  messages: ReturnType<typeof useMessageDrawerStore.getState>['messages'];
  /** Drawer open states */
  drawerState: {
    leftDrawerOpen: boolean;
    rightDrawerOpen: boolean;
  };
  /** AI thinking/generating states */
  aiStatus: {
    aiThinking: boolean;
    aiThinkingMessage: string | null;
    flowGenerating: boolean;
    flowGeneratingMessage: string | null;
  };
  /** SSE connection status */
  sseStatus: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  /** SSE error message */
  sseError: string | null;
}

export function useCanvasSession(): UseCanvasSessionReturn {
  const sessionId = useSessionId();

  // Three trees
  const contextNodes = useContextStore((s) => s.contextNodes);
  const flowNodes = useFlowStore((s) => s.flowNodes);
  const componentNodes = useComponentStore((s) => s.componentNodes);
  const projectId = useSessionStore((s) => s.projectId);

  // Messages
  const messages = useMessageDrawerStore((s) => s.messages);

  // Drawer state
  const leftDrawerOpen = useUIStore((s) => s.leftDrawerOpen);
  const rightDrawerOpen = useUIStore((s) => s.rightDrawerOpen);

  // AI status
  const aiThinking = useSessionStore((s) => s.aiThinking);
  const aiThinkingMessage = useSessionStore((s) => s.aiThinkingMessage);
  const flowGenerating = useSessionStore((s) => s.flowGenerating);
  const flowGeneratingMessage = useSessionStore((s) => s.flowGeneratingMessage);

  // SSE status
  const sseStatus = useSessionStore((s) => s.sseStatus);
  const sseError = useSessionStore((s) => s.sseError);

  return useMemo(
    () => ({
      sessionId,
      contextNodes,
      flowNodes,
      componentNodes,
      projectId,
      messages,
      drawerState: {
        leftDrawerOpen,
        rightDrawerOpen,
      },
      aiStatus: {
        aiThinking,
        aiThinkingMessage,
        flowGenerating,
        flowGeneratingMessage,
      },
      sseStatus,
      sseError,
    }),
    [
      sessionId,
      contextNodes,
      flowNodes,
      componentNodes,
      projectId,
      messages,
      leftDrawerOpen,
      rightDrawerOpen,
      aiThinking,
      aiThinkingMessage,
      flowGenerating,
      flowGeneratingMessage,
      sseStatus,
      sseError,
    ]
  );
}
