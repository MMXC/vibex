'use client';

import { useAgentStore } from '@/stores/agentStore';
import type { AgentSession } from '@/services/agent/CodingAgentService';
import styles from './WorkbenchUI.module.css';

interface SessionListProps {
  onSelect: (sessionKey: string) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SessionCard({
  session,
  isActive,
  onClick,
}: {
  session: AgentSession;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.sessionCard} ${isActive ? styles.sessionCardActive : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className={styles.sessionHeader}>
        <span className={styles.sessionTask}>{session.task || '无标题'}</span>
        <span className={`${styles.sessionStatus} ${styles[`status_${session.status}`]}`}>
          {session.status}
        </span>
      </div>
      <div className={styles.sessionMeta}>
        <span>{formatTime(session.createdAt)}</span>
        <span>{session.messages.length} 条消息</span>
      </div>
    </button>
  );
}

export function SessionList({ onSelect }: SessionListProps) {
  const { sessions, activeSessionKey } = useAgentStore();

  if (sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>暂无会话</p>
        <p className={styles.emptyHint}>在下方输入任务描述来创建第一个会话</p>
      </div>
    );
  }

  return (
    <div className={styles.sessionList}>
      <div className={styles.sessionListHeader}>
        <span>会话列表</span>
        <span className={styles.sessionCount}>{sessions.length}</span>
      </div>
      {sessions.map((session) => (
        <SessionCard
          key={session.sessionKey}
          session={session}
          isActive={session.sessionKey === activeSessionKey}
          onClick={() => onSelect(session.sessionKey)}
        />
      ))}
    </div>
  );
}
