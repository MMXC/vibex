/**
 * AgentFeedbackPanel.tsx — Sprint6 U4: AgentFeedbackPanel
 *
 * Shows agent code feedback with accept/reject controls.
 * Supports four states: idle / running / complete / error.
 */

'use client';

import React, { memo, useCallback } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { acceptCodeBlock, rejectCodeBlock } from '@/services/agent/CodingAgentService';
import type { AgentMessage, CodeBlock } from '@/services/agent/CodingAgentService';
import styles from './AgentFeedbackPanel.module.css';

function CodeBlockView({
  block,
  sessionKey,
  messageId,
  blockIndex,
}: {
  block: CodeBlock;
  sessionKey: string;
  messageId: string;
  blockIndex: number;
}) {
  const handleAccept = () => acceptCodeBlock(sessionKey, messageId, blockIndex);
  const handleReject = () => rejectCodeBlock(sessionKey, messageId, blockIndex);

  return (
    <div className={`${styles.codeBlock} ${block.accepted === true ? styles.accepted : ''} ${block.accepted === false ? styles.rejected : ''}`}>
      {block.filePath && (
        <div className={styles.codeFilePath}>{block.filePath}</div>
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
              aria-label="接受代码"
            >
              ✓ 接受
            </button>
            <button
              type="button"
              className={styles.rejectBtn}
              onClick={handleReject}
              aria-label="拒绝代码"
            >
              ✕ 拒绝
            </button>
          </>
        ) : block.accepted ? (
          <span className={styles.acceptedLabel}>✓ 已接受</span>
        ) : (
          <span className={styles.rejectedLabel}>✕ 已拒绝</span>
        )}
      </div>
    </div>
  );
}

function MessageView({
  message,
  sessionKey,
}: {
  message: AgentMessage;
  sessionKey: string;
}) {
  const roleLabel = message.role === 'agent' ? 'AI Agent' : message.role === 'user' ? '你' : '系统';

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
  const { sessions, activeSessionKey } = useAgentStore();
  const sessionKey = sessionKeyProp ?? activeSessionKey;
  const session = sessions.find((s) => s.sessionKey === sessionKey);

  if (!session) {
    return (
      <div className={styles.panel}>
        <div className={styles.idleState}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤖</div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
            AI Coding Agent
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            从会话列表选择一个会话查看反馈
          </div>
        </div>
      </div>
    );
  }

  const statusLabel = {
    idle: '空闲',
    starting: '启动中...',
    running: '分析中...',
    complete: '已完成',
    error: '错误',
    terminated: '已终止',
  }[session.status] ?? '未知';

  return (
    <div className={styles.panel} data-testid="agent-feedback-panel">
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>AI Coding Agent</div>
        <div className={`${styles.statusPill} ${styles[`status_${session.status}`]}`}>
          {statusLabel}
        </div>
      </div>

      {/* Task description */}
      <div className={styles.taskBanner}>
        <span className={styles.taskLabel}>任务</span>
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
          <div className={styles.emptyMessages}>
            {session.status === 'running' || session.status === 'starting'
              ? '等待 AI Agent 响应...'
              : '暂无消息'}
          </div>
        ) : (
          session.messages.map((msg) => (
            <MessageView
              key={msg.id}
              message={msg}
              sessionKey={session.sessionKey}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default AgentFeedbackPanel;
