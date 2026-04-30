/**
 * CodingAgentService.ts — Sprint6 U3/U4/U5
 *
 * AI Coding Agent integration service.
 *
 * Architecture:
 * - All real agent calls go through the frontend API route /api/agent/sessions
 *   which proxies to vibex-backend.
 * - Backend calls OpenClaw sessions_spawn via OpenClawBridge.
 * - This service provides a client-side API surface for the Workbench UI.
 */

'use client';

import { useAgentStore } from '@/stores/agentStore';

export type AgentSessionStatus = 'idle' | 'starting' | 'running' | 'complete' | 'error' | 'terminated';

export interface AgentSession {
  sessionKey: string;
  task: string;
  status: AgentSessionStatus;
  createdAt: number;
  messages: AgentMessage[];
  error?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  codeBlocks?: CodeBlock[];
}

export interface CodeBlock {
  language: string;
  code: string;
  filePath?: string;
  accepted?: boolean;
}

// ── Real agent calls via API route ───────────────────────────────

/**
 * Create a new agent session.
 * Calls the frontend /api/agent/sessions route which proxies to vibex-backend.
 */
export async function createSession(context: { task: string }): Promise<string> {
  const response = await fetch('/api/agent/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: context.task }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to create session' }));
    throw new Error(err.error ?? 'createSession failed');
  }

  const data = await response.json() as { sessionKey: string };
  return data.sessionKey;
}

/**
 * Get session status from the backend.
 */
export async function getSessionStatus(sessionKey: string): Promise<AgentSessionStatus> {
  try {
    const response = await fetch(`/api/agent/sessions/${encodeURIComponent(sessionKey)}/status`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return 'error';
    }

    const data = await response.json() as { status: string };
    return data.status as AgentSessionStatus;
  } catch {
    return 'error';
  }
}

/**
 * Terminate a session.
 */
export async function terminateSession(sessionKey: string): Promise<void> {
  await fetch(`/api/agent/sessions/${encodeURIComponent(sessionKey)}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(5000),
  });
}

// ── Code block management ─────────────────────────────────────────

/**
 * Accept a code block suggestion.
 */
export function acceptCodeBlock(sessionKey: string, messageId: string, blockIndex: number): void {
  const store = useAgentStore.getState();
  const session = store.sessions.find((s) => s.sessionKey === sessionKey);
  if (!session) return;

  const message = session.messages.find((m) => m.id === messageId);
  if (message?.codeBlocks?.[blockIndex]) {
    message.codeBlocks[blockIndex].accepted = true;
    store.updateSession(sessionKey, { messages: [...session.messages] });
  }
}

/**
 * Reject a code block suggestion.
 */
export function rejectCodeBlock(sessionKey: string, messageId: string, blockIndex: number): void {
  const store = useAgentStore.getState();
  const session = store.sessions.find((s) => s.sessionKey === sessionKey);
  if (!session) return;

  const message = session.messages.find((m) => m.id === messageId);
  if (message?.codeBlocks?.[blockIndex]) {
    message.codeBlocks[blockIndex].accepted = false;
    store.updateSession(sessionKey, { messages: [...session.messages] });
  }
}