/**
 * useEmbeddedAgent — Hook for EmbeddedAgentPanel state management
 * Sprint57 E2: Canvas-Inline AI Session Panel
 *
 * Connects agentStore sessions with DDSCanvasStore addCard action.
 * Use inside DDSCanvasPage — openPanel/closePanel passed as props.
 */

'use client';

import { useCallback, useState } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { useDDSCanvasStore, ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import type { AgentSession, AgentMessage } from '@/services/agent/CodingAgentService';
import type { DDSCard } from '@/types/dds';

// ==================== Helpers ====================

function generateCardId(): string {
  return `agent-card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function messageToCard(
  session: AgentSession,
  message: AgentMessage,
  chapter: string
): DDSCard {
  return {
    id: generateCardId(),
    type: 'agent-response',
    title: `[${session.name ?? session.task}] AI 回复`,
    description: message.content,
    position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      sessionKey: session.sessionKey,
      messageId: message.id,
      role: message.role,
      codeBlocks: message.codeBlocks,
    },
  };
}

// ==================== Hook ====================

export interface UseEmbeddedAgentReturn {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Open the panel */
  openPanel: () => void;
  /** Close the panel */
  closePanel: () => void;
  /** Toggle the panel */
  togglePanel: () => void;
  /** The currently active session key */
  activeSessionId: string | null;
  /** All sessions from agentStore */
  sessions: AgentSession[];
  /** Insert the last AI agent message into the canvas as a card */
  insertToCanvas: () => void;
  /** Select a session and open the panel */
  selectSession: (sessionKey: string) => void;
}

/**
 * Manages embedded agent panel state.
 * Call once at the DDSCanvasPage level; pass isOpen/closePanel to EmbeddedAgentPanel.
 */
export function useEmbeddedAgent(): UseEmbeddedAgentReturn {
  const [isOpen, setIsOpen] = useState(false);

  const sessions = useAgentStore((s) => s.sessions);
  const activeSessionKey = useAgentStore((s) => s.activeSessionKey);
  const activeChapter = useDDSCanvasStore((s) => s.activeChapter);
  const addCard = ddsChapterActions.addCard;

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((prev) => !prev), []);

  const selectSession = useCallback(
    (sessionKey: string) => {
      useAgentStore.getState().setActiveSession(sessionKey);
      setIsOpen(true);
    },
    []
  );

  const insertToCanvas = useCallback(() => {
    const sessionKey = useAgentStore.getState().activeSessionKey;
    if (!sessionKey) return;

    const session = useAgentStore
      .getState()
      .sessions.find((s) => s.sessionKey === sessionKey);
    if (!session) return;

    const lastAgentMsg = [...session.messages]
      .reverse()
      .find((m) => m.role === 'agent');
    if (!lastAgentMsg) return;

    const card = messageToCard(session, lastAgentMsg, activeChapter);
    addCard(activeChapter, card);
  }, [activeChapter, addCard]);

  return {
    isOpen,
    openPanel,
    closePanel,
    togglePanel,
    activeSessionId: activeSessionKey,
    sessions,
    insertToCanvas,
    selectSession,
  };
}

export default useEmbeddedAgent;
