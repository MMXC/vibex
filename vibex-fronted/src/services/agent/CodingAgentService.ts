/**
 * CodingAgentService.ts — Sprint6 U3/U4/U5
 * Sprint44 P001-E1: branchId, createBranch, getBranches
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
  /** S44-E1: session name for display (user-editable) */
  name?: string;
  /** S44-E1: parent session key for branch sessions */
  branchId?: string;
  /** S44-E1: branch metadata */
  branches?: AgentBranch[];
  error?: string;
}

/** S44-E1: Branch metadata for multi-session branching */
export interface AgentBranch {
  sessionKey: string;
  branchName: string;
  createdAt: number;
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

// ── S44-E1: Multi-session branching ───────────────────────────────

/**
 * S44-E1: Create a branch session from a parent session.
 * The new branch session inherits context from the parent but runs independently.
 */
export async function createBranch(
  parentSessionKey: string,
  branchName: string
): Promise<string> {
  const parent = useAgentStore.getState().sessions.find(
    (s) => s.sessionKey === parentSessionKey
  );
  if (!parent) {
    throw new Error(`Parent session ${parentSessionKey} not found`);
  }

  // Create new session with branchId pointing to parent
  const newSessionKey = `branch_${parentSessionKey}_${Date.now()}`;

  const response = await fetch('/api/agent/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: `[${branchName}] ${parent.task}`,
      branchFrom: parentSessionKey,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create branch session');
  }

  const data = await response.json() as { sessionKey: string };

  // Register branch in parent's branches list
  const branch: AgentBranch = {
    sessionKey: data.sessionKey,
    branchName,
    createdAt: Date.now(),
  };
  const updatedBranches = [...(parent.branches ?? []), branch];
  useAgentStore.getState().updateSession(parentSessionKey, { branches: updatedBranches });

  return data.sessionKey;
}

/**
 * S44-E1: Get all branches for a given parent session.
 */
export function getBranches(sessionKey: string): AgentBranch[] {
  const session = useAgentStore.getState().sessions.find((s) => s.sessionKey === sessionKey);
  return session?.branches ?? [];
}