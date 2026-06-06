'use client';

import React, { memo, useCallback } from 'react';
import { useActivityStore, activityLabel, formatActivityTime } from '@/lib/collaboration/activityStore';
import type { ActivityEntry, ActivityType } from '@/lib/collaboration/types';
import styles from './CollabActivityPanel.module.css';

interface CollabActivityPanelProps {
  /** Whether the panel is open */
  open: boolean;
  onClose: () => void;
  /** Current user ID (for filtering own activities) */
  currentUserId?: string;
}

/** Icon map for activity types */
const ActivityIcon: Record<ActivityType, string> = {
  join: '👋',
  leave: '👋',
  edit: '✏️',
  add: '➕',
  delete: '🗑️',
  lock: '🔒',
  unlock: '🔓',
  focus: '🎯',
  blur: '⊙',
  cursor_move: '🖱️',
};

/**
 * CollabActivityPanel — real-time collaboration activity feed panel.
 * S67-E2: 实时协作活动流面板
 *
 * Shows:
 * - Online users (from presenceStore)
 * - Recent activity timeline (from activityStore, max 20)
 */
const CollabActivityPanel = memo(function CollabActivityPanel({
  open,
  onClose,
  currentUserId,
}: CollabActivityPanelProps) {
  const recentActivity = useActivityStore((s) => s.recentActivity);
  const entries = useActivityStore((s) => s.entries);

  // Use recentActivity (E2 DoD) or fallback to entries
  const displayEntries: ActivityEntry[] =
    recentActivity.length > 0 ? recentActivity : entries;

  const handleClear = useCallback(() => {
    useActivityStore.getState().clearEntries();
  }, []);

  if (!open) return null;

  return (
    <aside className={styles.panel} role="complementary" aria-label="协作活动面板">
      <header className={styles.header}>
        <h3 className={styles.title}>协作活动</h3>
        <div className={styles.actions}>
          {displayEntries.length > 0 && (
            <button
              className={styles.clearBtn}
              onClick={handleClear}
              aria-label="清除活动记录"
              title="清除活动记录"
            >
              ✕
            </button>
          )}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭活动面板"
          >
            →
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {displayEntries.length === 0 ? (
          <p className={styles.empty}>暂无协作活动</p>
        ) : (
          <ul className={styles.feed} role="list" aria-label="活动时间线">
            {displayEntries.map((entry) => {
              const isOwn = entry.userId === currentUserId;
              return (
                <li
                  key={entry.id}
                  className={`${styles.entry} ${isOwn ? styles.own : ''}`}
                  role="listitem"
                >
                  <span className={styles.icon} aria-hidden="true">
                    {ActivityIcon[entry.type] ?? '📌'}
                  </span>
                  <div className={styles.entryBody}>
                    <span className={styles.userName}>
                      {isOwn ? '你' : entry.userName}
                    </span>
                    <span className={styles.action}>
                      {activityLabel(entry.type)}
                    </span>
                    {entry.nodeName && (
                      <span className={styles.nodeName}>「{entry.nodeName}」</span>
                    )}
                  </div>
                  <time
                    className={styles.time}
                    dateTime={new Date(entry.timestamp).toISOString()}
                    title={new Date(entry.timestamp).toLocaleString()}
                  >
                    {formatActivityTime(entry.timestamp)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className={styles.footer}>
        <span className={styles.count}>
          {displayEntries.length}/20 条活动
        </span>
      </footer>
    </aside>
  );
});

export default CollabActivityPanel;
