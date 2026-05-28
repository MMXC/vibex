/**
 * AgentSessions.tsx — Sprint6 U5: Agent Session Management
 * Sprint40 P001-E1: i18n — hardcoded text replaced with useTranslations('ai')()
 *
 * Displays session list, status badges, and terminate controls.
 */

'use client';

import React, { memo } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { terminateSession } from '@/services/agent/CodingAgentService';
import type { AgentSessionStatus } from '@/services/agent/CodingAgentService';
import { useTranslations } from '@/hooks/useTranslations';
import styles from './AgentSessions.module.css';

interface SessionCardProps {
  sessionKey: string;
  task: string;
  status: AgentSessionStatus;
  createdAt: number;
  isActive: boolean;
  t: (key: string) => string;
}

const SessionCard = memo(function SessionCard({
  sessionKey,
  task,
  status,
  createdAt,
  isActive,
  t,
}: SessionCardProps) {
  const { setActiveSession, removeSession } = useAgentStore();

  const statusLabel = {
    idle: t('statusIdle'),
    starting: t('statusStarting'),
    running: t('statusRunning'),
    complete: t('statusComplete'),
    error: t('statusError'),
    terminated: t('statusTerminated'),
  }[status] ?? t('statusIdle');

  const statusColor = {
    idle: 'rgba(255,255,255,0.3)',
    starting: 'rgba(234,179,8,0.7)',
    running: 'rgba(59,130,246,0.8)',
    complete: 'rgba(34,197,94,0.8)',
    error: 'rgba(248,113,113,0.8)',
    terminated: 'rgba(255,255,255,0.2)',
  }[status] ?? 'rgba(255,255,255,0.3)';

  const handleTerminate = async () => {
    await terminateSession(sessionKey);
  };

  const handleSelect = () => {
    setActiveSession(sessionKey);
  };

  const timeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ${t('timeAgoSuffix') ?? 'ago'}`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${t('timeAgoSuffix') ?? 'ago'}`;
    return `${Math.floor(diff / 3600)}h ${t('timeAgoSuffix') ?? 'ago'}`;
  };

  return (
    <div
      className={`${styles.sessionCard} ${isActive ? styles.sessionCardActive : ''}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
      aria-pressed={isActive}
      data-testid="agent-session-item"
    >
      <div className={styles.sessionHeader}>
        <span
          className={styles.statusBadge}
          style={{ background: statusColor }}
          aria-label={`${t('statusLabel') ?? 'Status'}: ${statusLabel}`}
        >
          {statusLabel}
        </span>
        <span className={styles.timeAgo}>{timeAgo(createdAt)}</span>
      </div>
      <div className={styles.taskPreview}>{task || t('noTitle')}</div>
      <div className={styles.sessionActions}>
        {status === 'running' || status === 'starting' ? (
          <button
            type="button"
            className={styles.terminateBtn}
            onClick={(e) => { e.stopPropagation(); handleTerminate(); }}
            aria-label={t('terminateSession')}
          >
            {t('terminateSession')}
          </button>
        ) : (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={(e) => { e.stopPropagation(); removeSession(sessionKey); }}
            aria-label={t('deleteSession')}
          >
            {t('deleteSession')}
          </button>
        )}
      </div>
    </div>
  );
});

export const AgentSessions = memo(function AgentSessions() {
  const t = useTranslations('ai')();
  const { sessions, activeSessionKey } = useAgentStore();

  if (sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤖</div>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>{t('noSessions')}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          {t('noSessionsHint') ?? 'Trigger AI Coding Agent from prototype or DDS canvas'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sessionsList}>
      <div className={styles.sessionsHeader}>
        <span className={styles.sessionsTitle}>{t('sessionList')}</span>
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
          t={t}
        />
      ))}
    </div>
  );
});

export default AgentSessions;
