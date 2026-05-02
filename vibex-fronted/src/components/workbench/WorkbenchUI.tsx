'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import type { AgentSession, AgentMessage } from '@/services/agent/CodingAgentService';
import { SessionList } from './SessionList';
import { TaskInput } from './TaskInput';
import styles from './WorkbenchUI.module.css';

export function WorkbenchUI() {
  const {
    sessions,
    activeSessionKey,
    addSession,
    setActiveSession,
    addMessage,
  } = useAgentStore();

  // E5-S1: Error state for agent unavailability
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch sessions from API on mount
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/agent/sessions');
        if (res.ok) {
          const data = await res.json() as { sessions: AgentSession[] };
          // Sync sessions from API into store
          for (const session of data.sessions) {
            addSession(session);
          }
        }
      } catch {
        // Silently fail — store may already have mock sessions
      }
    }
    fetchSessions();
  }, [addSession]);

  const activeSession = sessions.find((s) => s.sessionKey === activeSessionKey) ?? null;

  const handleCreateTask = useCallback(
    async (task: string) => {
      setCreateError(null);
      // Call the API to create a session
      const res = await fetch('/api/agent/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });

      if (!res.ok) {
        // E5-S1: Show error when agent is unavailable
        const body = await res.json().catch(() => ({ error: '暂不可用' })) as { error: string };
        setCreateError(body.error ?? '暂不可用，Agent 服务维护中');
        throw new Error('Failed to create session');
      }

      const data = await res.json() as { sessionKey: string };

      // Add user message to store
      const userMsg: AgentMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: task,
        timestamp: Date.now(),
      };
      addMessage(data.sessionKey, userMsg);
    },
    [addMessage]
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Workbench</h1>
      </header>

      <main className={styles.main}>
        <SessionList onSelect={setActiveSession} />

        <div className={styles.content}>
          <div className={styles.messages}>
            {activeSession
              ? activeSession.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))
              : (
                <div className={styles.emptyState}>
                  <p>选择或创建一个会话开始</p>
                </div>
              )}
          </div>

          {/* E5-S1: Error message when agent unavailable */}
          {createError && (
            <div
              className={styles.errorBanner}
              data-testid="agent-error-message"
              role="alert"
              aria-live="assertive"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{createError}</span>
              <button
                className={styles.errorDismiss}
                onClick={() => setCreateError(null)}
                aria-label="关闭"
                type="button"
              >
                ×
              </button>
            </div>
          )}

          <div className={styles.artifactViewer}>
            <div className={styles.artifactPlaceholder}>
              代码产物预览区域（待实现）
            </div>
          </div>

          <TaskInput onSubmit={handleCreateTask} />
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`${styles.message} ${isUser ? styles.messageUser : styles.messageAgent}`}>
      <span className={styles.messageRole}>{isUser ? '你' : 'Agent'}</span>
      <div className={styles.messageContent}>{message.content}</div>
      {message.codeBlocks && message.codeBlocks.length > 0 && (
        <div className={styles.codeBlock}>
          {message.codeBlocks.map((block, idx) => (
            <div key={idx}>
              <div className={styles.codeBlockHeader}>
                <span className={styles.codeBlockLang}>{block.language}</span>
                {block.filePath && (
                  <span className={styles.codeBlockFile}>{block.filePath}</span>
                )}
                <div className={styles.codeBlockActions}>
                  <button
                    className={`${styles.codeBlockBtn} ${styles.codeBlockBtnAccept}`}
                    type="button"
                  >
                    接受
                  </button>
                  <button
                    className={`${styles.codeBlockBtn} ${styles.codeBlockBtnReject}`}
                    type="button"
                  >
                    拒绝
                  </button>
                </div>
              </div>
              <pre className={styles.codeBlockPre}>
                <code>{block.code}</code>
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
