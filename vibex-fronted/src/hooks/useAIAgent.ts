/**
 * useAIAgent.ts — Sprint38 P002-E1: useAIAgent hook
 *
 * Wrapper around CodingAgentService that:
 * - Provides reactive state for agent sessions
 * - Records AI operations to the oplog via useOplogStore
 * - Exposes isEditing state for AIEditingIndicator
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { useOplogStore } from '@/stores/oplogStore';
import type { AgentSession } from '@/services/agent/CodingAgentService';

export interface DiffResult {
  added: number;
  removed: number;
  changes: Array<{ type: 'add' | 'remove'; line: string; lineNumber: number }>;
}

export interface UseAIAgentOptions {
  /** Auto-start a session when the hook mounts (default: false) */
  autoStart?: boolean;
  /** Initial task description */
  initialTask?: string;
}

export interface UseAIAgentReturn {
  /** Current active session key */
  sessionKey: string | null;
  /** Current session status */
  sessionStatus: AgentSession['status'] | null;
  /** Last result from the AI agent */
  lastResult: DiffResult | null;
  /** Last error from the AI agent */
  lastError: string | null;
  /** Whether AI is currently editing (operations in progress) */
  isEditing: boolean;
  /** Start a new agent session */
  startSession: (task: string) => Promise<string>;
  /** Accept a code block suggestion */
  acceptCodeBlock: (messageId: string, blockIndex: number) => void;
  /** Terminate the current session */
  terminate: () => Promise<void>;
  /** Current session messages */
  messages: AgentSession['messages'];
}

/**
 * useAIAgent — AI Coding Agent hook with oplog integration.
 *
 * Usage:
 * ```ts
 * const { isEditing, startSession } = useAIAgent();
 * await startSession('Fix the login bug');
 * ```
 */
export function useAIAgent(options: UseAIAgentOptions = {}): UseAIAgentReturn {
  const { autoStart = false, initialTask } = options;

  // Agent store selectors
  const sessions = useAgentStore((s) => s.sessions);
  const activeSessionKey = useAgentStore((s) => s.activeSessionKey);
  const addSession = useAgentStore((s) => s.addSession);
  const updateSession = useAgentStore((s) => s.updateSession);
  const addMessage = useAgentStore((s) => s.addMessage);

  // Oplog store
  const addOplogEntry = useOplogStore((s) => s.addOplogEntry);

  // Local state
  const [lastResult, setLastResult] = useState<DiffResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const pendingOpRef = useRef<string | null>(null);

  // Derived from agent store
  const activeSession = sessions.find((s) => s.sessionKey === activeSessionKey) ?? null;
  const sessionStatus = activeSession?.status ?? null;
  const messages = activeSession?.messages ?? [];

  // Sync isEditing with session status
  useEffect(() => {
    const editing = sessionStatus === 'running' || sessionStatus === 'starting';
    setIsEditing(editing);

    if (editing && activeSessionKey && !pendingOpRef.current) {
      // Record AI operation start in oplog
      pendingOpRef.current = addOplogEntry({
        userId: 'ai',
        type: 'ai',
        nodeId: activeSessionKey,
        action: `session:${sessionStatus}`,
      });
    } else if (!editing && pendingOpRef.current) {
      // Operation ended — update oplog entry (append nodeId for display)
      pendingOpRef.current = null;
    }
  }, [sessionStatus, activeSessionKey, addOplogEntry]);

  // Record AI completion result in oplog
  useEffect(() => {
    if (sessionStatus === 'complete' && activeSession) {
      addOplogEntry({
        userId: 'ai',
        type: 'ai',
        nodeId: activeSessionKey ?? 'unknown',
        action: `session:complete:messages:${activeSession.messages.length}`,
      });

      // Compute simple diff result from messages (code blocks)
      const codeBlocks = activeSession.messages
        .flatMap((m) => m.codeBlocks ?? [])
        .filter((b) => b.accepted !== false);
      const added = codeBlocks.filter((b) => b.filePath).length;
      setLastResult({ added, removed: 0, changes: [] });
    }
  }, [sessionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Record error in oplog
  useEffect(() => {
    if (activeSession?.error) {
      setLastError(activeSession.error);
      addOplogEntry({
        userId: 'ai',
        type: 'ai',
        nodeId: activeSessionKey ?? 'unknown',
        action: `error:${activeSession.error.slice(0, 80)}`,
      });
    }
  }, [activeSession?.error]); // eslint-disable-line react-hooks/exhaustive-deps

  const startSession = useCallback(
    async (task: string): Promise<string> => {
      setLastError(null);
      setLastResult(null);
      try {
        const { createSession } = await import('@/services/agent/CodingAgentService');
        const sessionKey = await createSession({ task });
        return sessionKey;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLastError(msg);
        throw err;
      }
    },
    []
  );

  const acceptCodeBlock = useCallback(
    (messageId: string, blockIndex: number) => {
      if (!activeSessionKey) return;
      const { acceptCodeBlock: accept } = require('@/services/agent/CodingAgentService');
      accept(activeSessionKey, messageId, blockIndex);

      // Record in oplog
      addOplogEntry({
        userId: 'ai',
        type: 'ai',
        nodeId: activeSessionKey,
        action: `accept:${messageId}:${blockIndex}`,
      });
    },
    [activeSessionKey, addOplogEntry]
  );

  const terminate = useCallback(async () => {
    if (!activeSessionKey) return;
    const { terminateSession } = await import('@/services/agent/CodingAgentService');
    await terminateSession(activeSessionKey);
  }, [activeSessionKey]);

  return {
    sessionKey: activeSessionKey,
    sessionStatus,
    lastResult,
    lastError,
    isEditing,
    startSession,
    acceptCodeBlock,
    terminate,
    messages,
  };
}
