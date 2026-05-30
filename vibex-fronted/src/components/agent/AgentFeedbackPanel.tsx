/**
 * AgentFeedbackPanel.tsx — Sprint6 U4: AgentFeedbackPanel
 * Sprint40 P001-E1: i18n — hardcoded text replaced with useTranslations('ai')()
 * Sprint43 P002-E2: SSE streaming — streaming indicator + cancel button
 * Sprint44 P001-E1: character counter — "已接收 N 个字符"
 *
 * Shows agent code feedback with accept/reject controls.
 * Supports four states: idle / running / complete / error.
 */

'use client';

import React, { memo, useCallback, useState, useEffect } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { acceptCodeBlock, rejectCodeBlock } from '@/services/agent/CodingAgentService';
import type { AgentMessage, CodeBlock } from '@/services/agent/CodingAgentService';
import { useTranslations } from '@/hooks/useTranslations';
import styles from './AgentFeedbackPanel.module.css';

interface CodeBlockViewProps {
  block: CodeBlock;
  sessionKey: string;
  messageId: string;
  blockIndex: number;
  t: (key: string) => string;
}

function CodeBlockView({ block, sessionKey, messageId, blockIndex, t }: CodeBlockViewProps) {
  const handleAccept = () => acceptCodeBlock(sessionKey, messageId, blockIndex);
  const handleReject = () => rejectCodeBlock(sessionKey, messageId, blockIndex);

  return (
    <div className={`${styles.codeBlock} ${block.accepted === true ? styles.accepted : ''} ${block.accepted === false ? styles.rejected : ''}`}>
      {block.filePath && (
        <div className={styles.codeFilePath}>{t('filePath')}: {block.filePath}</div>
      )}
      <pre className={styles.codeContent}>
        <code>{block.code}</code>
      </pre>
      <div className={styles.codeActions}>
        {block.accepted === undefined ? (
          <>
            <button
              type="button"
              className={styles.acceptBtn}
              onClick={handleAccept}
              aria-label={t('acceptCode')}
            >
              ✓ {t('acceptCode')}
            </button>
            <button
              type="button"
              className={styles.rejectBtn}
              onClick={handleReject}
              aria-label={t('rejectCode')}
            >
              ✕ {t('rejectCode')}
            </button>
          </>
        ) : block.accepted ? (
          <span className={styles.acceptedLabel}>✓ {t('accepted')}</span>
        ) : (
          <span className={styles.rejectedLabel}>✕ {t('rejected')}</span>
        )}
      </div>
    </div>
  );
}

interface MessageViewProps {
  message: AgentMessage;
  sessionKey: string;
  t: (key: string) => string;
}

function MessageView({ message, sessionKey, t }: MessageViewProps) {
  const roleLabel = message.role === 'agent' ? 'AI Agent' : message.role === 'user' ? t('userLabel') ?? 'You' : 'System';

  return (
    <div className={`${styles.message} ${message.role === 'agent' ? styles.agentMessage : styles.userMessage}`}>
      <div className={styles.messageRole}>{roleLabel}</div>
      <div className={styles.messageContent}>{message.content}</div>
      {message.codeBlocks?.map((block, i) => (
        <CodeBlockView
          key={i}
          block={block}
          sessionKey={sessionKey}
          messageId={message.id}
          blockIndex={i}
          t={t}
        />
      ))}
    </div>
  );
}

interface AgentFeedbackPanelProps {
  /** Optional sessionKey override; defaults to activeSessionKey */
  sessionKey?: string;
}

export const AgentFeedbackPanel = memo(function AgentFeedbackPanel({
  sessionKey: sessionKeyProp,
}: AgentFeedbackPanelProps) {
  const t = useTranslations('ai')();
  const { sessions, activeSessionKey } = useAgentStore();
  const sessionKey = sessionKeyProp ?? activeSessionKey;
  const session = sessions.find((s) => s.sessionKey === sessionKey);

  // S44-E1: track total received characters for streaming counter
  const [receivedChars, setReceivedChars] = useState(0);
  const prevLengthRef = React.useRef(0);

  useEffect(() => {
    if (!session) {
      setReceivedChars(0);
      prevLengthRef.current = 0;
      return;
    }
    // Count total characters across all agent messages
    const total = session.messages
      .filter((m) => m.role === 'agent')
      .reduce((sum, m) => sum + m.content.length, 0);
    setReceivedChars(total);
    prevLengthRef.current = total;
  }, [session?.messages, sessionKey]);

  const handleCancel = useCallback(() => {
    if (sessionKey) {
      import('@/services/agent/CodingAgentService').then(({ terminateSession }) => {
        terminateSession(sessionKey);
      });
    }
  }, [sessionKey]);

  if (!session) {
    return (
      <div className={styles.panel}>
        <div className={styles.idleState}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤖</div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
            {t('aiPageTitle')}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            {t('selectSessionHint')}
          </div>
        </div>
      </div>
    );
  }

  const statusMap: Record<string, string> = {
    idle: t('statusIdle'),
    starting: t('statusStarting'),
    running: t('statusRunning'),
    complete: t('statusComplete'),
    error: t('statusError'),
    terminated: t('statusTerminated'),
  };
  const statusLabel = statusMap[session.status] || 'Unknown';

  const emptyMsg = session.status === 'running' || session.status === 'starting'
    ? t('waitingForAgent')
    : t('noMessages');

  return (
    <div className={styles.panel} data-testid="agent-feedback-panel">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>{t('aiPageTitle')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* S43-E2: streaming cancel button */}
          {session.status === 'running' && (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
              aria-label={t('terminateSession') ?? 'Cancel'}
            >
              ⏹ {t('terminateSession') ?? '停止'}
            </button>
          )}
          <div className={`${styles.statusPill} ${styles[`status_${session.status}`]}`}>
            {/* S43-E2: show generating indicator when running */}
          {session.status === 'running' ? (
            <span className={styles.streamingIndicator}>
              <span className={styles.streamingDot} />
              {t('generating') ?? '生成中...'}
              {receivedChars > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.6 }}>
                  ({t('charsReceived') ?? '已接收'} {receivedChars.toLocaleString()} {t('charsUnit') ?? '个字符'})
                </span>
              )}
            </span>
          ) : statusLabel}
          </div>
        </div>
      </div>

      {/* Task description */}
      <div className={styles.taskBanner}>
        <span className={styles.taskLabel}>{t('taskLabel')}</span>
        <span className={styles.taskText}>{session.task}</span>
      </div>

      {/* Error state */}
      {session.status === 'error' && session.error && (
        <div className={styles.errorBanner} role="alert">
          <span>⚠️</span>
          <span>{session.error}</span>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages}>
        {session.messages.length === 0 ? (
          <div className={styles.emptyMessages}>{emptyMsg}</div>
        ) : (
          session.messages.map((msg) => (
            <MessageView
              key={msg.id}
              message={msg}
              sessionKey={session.sessionKey}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default AgentFeedbackPanel;
