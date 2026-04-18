/**
 * CodingAgentService.ts — Sprint6 U3/U4/U5
 *
 * AI Coding Agent integration service.
 *
 * Architecture decision:
 * - U3: BLOCKED — sessions_spawn is an OpenClaw runtime tool, not callable
 *   from Next.js frontend API routes. Needs backend AI Agent HTTP API.
 * - U4/U5: Implemented as mock service for UI development + testing.
 *   Replace mockAgentCall with real sessions_spawn once backend is ready.
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

// ==================== U3: BLOCKED (sessions_spawn) ====================

/**
 * U3 BLOCKED: createSession() requires sessions_spawn (OpenClaw runtime tool).
 *
 * sessions_spawn is an OpenClaw runtime function that can only be called from
 * within the OpenClaw agent context. It cannot be imported or called from
 * Next.js frontend code.
 *
 * @deprecated Blocked — needs backend AI Agent HTTP API
 */
export async function createSession(_context: { task: string }): Promise<string> {
  console.warn('[CodingAgentService] U3 BLOCKED: sessions_spawn not callable from frontend. Using mock.');
  // Fallback: use mock store
  const store = useAgentStore.getState();
  const sessionKey = `mock-session-${Date.now()}`;
  store.addSession({
    sessionKey,
    task: _context.task,
    status: 'complete',
    createdAt: Date.now(),
    messages: [
      {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: 'AI Coding Agent 集成待完成。sessions_spawn 需要后端 AI Agent HTTP 服务支持。',
        timestamp: Date.now(),
        codeBlocks: [],
      },
    ],
  });
  return sessionKey;
}

/**
 * U3 BLOCKED: Mock getSessionStatus.
 */
export async function getSessionStatus(sessionKey: string): Promise<AgentSessionStatus> {
  const store = useAgentStore.getState();
  const session = store.sessions.find((s) => s.sessionKey === sessionKey);
  return session?.status ?? 'error';
}

/**
 * U3 BLOCKED: Mock terminateSession.
 */
export async function terminateSession(sessionKey: string): Promise<void> {
  const store = useAgentStore.getState();
  store.updateSession(sessionKey, { status: 'terminated' });
}

// ==================== U4/U5: Mock Agent (full implementation) ====================

/**
 * Simulated agent response for UI development and testing.
 * Replace with real sessions_spawn when backend is available.
 */
export async function mockAgentCall(task: string): Promise<AgentMessage[]> {
  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const sessionKey = `mock-${Date.now()}`;

  return [
    {
      id: `${sessionKey}-1`,
      role: 'agent',
      content: `已收到任务: ${task}\n\n正在分析代码上下文...`,
      timestamp: Date.now(),
    },
    {
      id: `${sessionKey}-2`,
      role: 'agent',
      content: '以下是建议的代码修改：',
      timestamp: Date.now() + 1000,
      codeBlocks: [
        {
          language: 'typescript',
          code: `// TODO: Replace with real agent code\nexport function placeholder() {\n  console.log('AI Coding Agent integration pending');\n}`,
          filePath: 'src/services/agent/placeholder.ts',
          accepted: undefined,
        },
      ],
    },
  ];
}

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
    // Trigger store update
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
