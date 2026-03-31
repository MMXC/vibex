/**
 * useCanvasSession — Composed hook for canvas session state
 *
 * Epic 2: 新建 useCanvasSession hook
 * Returns: sessionId + 三棵树 + messages + drawerState + AI状态
 *
 * PRD S2.2: hook 返回 sessionId + 三棵树 + messages + projectId + drawerState
 * PRD S2.3: hook 返回 AI 状态 + SSE 状态
 */

import { useMemo } from 'react';
import { useCanvasStore } from './canvasStore';
import { useMessageDrawerStore } from '@/components/canvas/messageDrawer/messageDrawerStore';

/**
 * Session ID — use projectId if set, otherwise generate from timestamp
 */
function useSessionId(): string {
  const projectId = useCanvasStore((s) => s.projectId);
  return useMemo(() => projectId ?? `session-${Date.now()}`, [projectId]);
}

export interface UseCanvasSessionReturn {
  /** Unique session identifier (projectId or generated) */
  sessionId: string;
  /** Bounded Context nodes */
  contextNodes: ReturnType<typeof useCanvasStore.getState>['contextNodes'];
  /** Business Flow nodes */
  flowNodes: ReturnType<typeof useCanvasStore.getState>['flowNodes'];
  /** Component nodes */
  componentNodes: ReturnType<typeof useCanvasStore.getState>['componentNodes'];
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
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);
  const projectId = useCanvasStore((s) => s.projectId);

  // Messages
  const messages = useMessageDrawerStore((s) => s.messages);

  // Drawer state
  const leftDrawerOpen = useCanvasStore((s) => s.leftDrawerOpen);
  const rightDrawerOpen = useCanvasStore((s) => s.rightDrawerOpen);

  // AI status
  const aiThinking = useCanvasStore((s) => s.aiThinking);
  const aiThinkingMessage = useCanvasStore((s) => s.aiThinkingMessage);
  const flowGenerating = useCanvasStore((s) => s.flowGenerating);
  const flowGeneratingMessage = useCanvasStore((s) => s.flowGeneratingMessage);

  // SSE status
  const sseStatus = useCanvasStore((s) => s.sseStatus);
  const sseError = useCanvasStore((s) => s.sseError);

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
