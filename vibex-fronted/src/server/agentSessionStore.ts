/**
 * agentSessionStore.ts — Server-side in-memory store for /api/agent/sessions
 *
 * This module is NOT a React component — it's a plain JS module
 * that can be imported by API routes (server-side).
 * The client-side UI uses the Zustand store (agentStore.ts) instead.
 */

import type { AgentSession, AgentMessage } from '@/services/agent/CodingAgentService';

const sessions = new Map<string, AgentSession>();

export function getSessions(): AgentSession[] {
  return Array.from(sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function getSession(sessionKey: string): AgentSession | undefined {
  return sessions.get(sessionKey);
}

export function createAgentSession(task: string): string {
  const sessionKey = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const userMsg: AgentMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: task,
    timestamp: Date.now(),
  };

  const session: AgentSession = {
    sessionKey,
    task,
    status: 'complete',
    createdAt: Date.now(),
    messages: [userMsg],
  };

  sessions.set(sessionKey, session);

  // Keep max 50 sessions
  if (sessions.size > 50) {
    const oldest = Array.from(sessions.values())
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, sessions.size - 50);
    for (const s of oldest) {
      sessions.delete(s.sessionKey);
    }
  }

  return sessionKey;
}
