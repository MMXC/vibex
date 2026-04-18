/**
 * AgentSessions.tsx — Sprint6 U5: Agent Session Management
 *
 * Displays session list, status badges, and terminate controls.
 */

'use client';

import React, { memo } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { terminateSession } from '@/services/agent/CodingAgentService';
import type { AgentSessionStatus } from '@/services/agent/CodingAgentService';
import styles from './AgentSessions.module.css';

const STATUS_CONFIG: Record<AgentSessionStatus, { label: string; color: string }> = {
  idle: { label: '空闲', color: 'rgba(255,255,255,0.3)' },
  starting: { label: '启动中', color: 'rgba(234,179,8,0.7)' },
  running: { label: '运行中', color: 'rgba(59,130,246,0.8)' },
  complete: { label: '已完成', color: 'rgba(34,197,94,0.8)' },
  error: { label: '错误', color: 'rgba(248,113,113,0.8)' },
  terminated: { label: '已终止', color: 'rgba(255,255,255,0.2)' },
};

interface SessionCardProps {
  sessionKey: string;
  task: string;
  status: AgentSessionStatus;
  createdAt: number;
  isActive: boolean;
}

const SessionCard = memo(function SessionCard({
  sessionKey,
  task,
  status,
  createdAt,
  isActive,
}: SessionCardProps) {
  const { setActiveSession, removeSession } = useAgentStore();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  const handleTerminate = async () => {
    await terminateSession(sessionKey);
  };

  const handleSelect = () => {
    setActiveSession(sessionKey);
  };

  const timeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s 前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m 前`;
    return `${Math.floor(diff / 3600)}h 前`;
  };

  return (
    <div
      className={`${styles.sessionCard} ${isActive ? styles.sessionCardActive : ''}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
      aria-pressed={isActive}
    >
      <div className={styles.sessionHeader}>
        <span
          className={styles.statusBadge}
          style={{ background: cfg.color }}
          aria-label={`状态: ${cfg.label}`}
        >
          {cfg.label}
        </span>
        <span className={styles.timeAgo}>{timeAgo(createdAt)}</span>
      </div>
      <div className={styles.taskPreview}>{task || '无标题任务'}</div>
      <div className={styles.sessionActions}>
        {status === 'running' || status === 'starting' ? (
          <button
            type="button"
            className={styles.terminateBtn}
            onClick={(e) => { e.stopPropagation(); handleTerminate(); }}
            aria-label="终止会话"
          >
            终止
          </button>
        ) : (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={(e) => { e.stopPropagation(); removeSession(sessionKey); }}
            aria-label="删除会话"
          >
            删除
          </button>
        )}
      </div>
    </div>
  );
});

export const AgentSessions = memo(function AgentSessions() {
  const { sessions, activeSessionKey } = useAgentStore();

  if (sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤖</div>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>暂无会话</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          在原型或 DDS 画布中触发 AI Coding Agent
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionsList}>
      <div className={styles.sessionsHeader}>
        <span className={styles.sessionsTitle}>会话历史</span>
        <span className={styles.sessionsCount}>{sessions.length}</span>
      </div>
      {sessions.map((session) => (
        <SessionCard
          key={session.sessionKey}
          sessionKey={session.sessionKey}
          task={session.task}
          status={session.status}
          createdAt={session.createdAt}
          isActive={session.sessionKey === activeSessionKey}
        />
      ))}
    </div>
  );
});

export default AgentSessions;
