'use client';

/**
 * ActivityFeed — Collaboration activity stream panel
 * S60-E3: 协作活动流 + 在线状态指示
 *
 * Displays the 5 most recent collaboration activities in a scrollable panel.
 * Reads from useActivityStore and formats entries using activityLabel/formatActivityTime.
 */

import React from 'react';
import { useActivityStore, activityLabel, formatActivityTime } from '@/lib/collaboration/activityStore';
import styles from './ActivityFeed.module.css';

interface ActivityFeedProps {
  /** Additional CSS class */
  className?: string;
  /** Max entries to display (default: 5) */
  maxEntries?: number;
}

/** Single activity item row */
function ActivityItem({
  userName,
  type,
  nodeName,
  timestamp,
}: {
  userName: string;
  type: string;
  nodeName?: string;
  timestamp: number;
}) {
  const label = activityLabel(type as Parameters<typeof activityLabel>[0]);
  const time = formatActivityTime(timestamp);

  return (
    <li className={styles.activityItem} data-testid="activity-item">
      <span className={styles.userName}>{userName}</span>
      <span className={styles.action}>{label}</span>
      {nodeName && (
        <span className={styles.nodeName} title={nodeName}>
          「{nodeName.length > 12 ? nodeName.slice(0, 12) + '…' : nodeName}」
        </span>
      )}
      <span className={styles.time}>{time}</span>
    </li>
  );
}

/**
 * ActivityFeed displays recent collaboration activities.
 *
 * States:
 * - Empty: "暂无活动" placeholder
 * - 1+ entries: scrollable list of recent activities
 */
export function ActivityFeed({ className, maxEntries = 5 }: ActivityFeedProps) {
  const entries = useActivityStore((state) =>
    state.getRecentEntries(maxEntries)
  );

  return (
    <div
      className={`${styles.container} ${className ?? ''}`}
      data-testid="activity-feed"
      role="feed"
      aria-label="协作活动流"
    >
      <div className={styles.header} data-testid="activity-feed-header">
        <span className={styles.title}>协作活动</span>
        {entries.length > 0 && (
          <span className={styles.count} data-testid="activity-count">
            {entries.length}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div
          className={styles.empty}
          data-testid="activity-empty"
          role="status"
        >
          暂无活动
        </div>
      ) : (
        <ul className={styles.list} aria-label="活动列表">
          {entries.map((entry) => (
            <ActivityItem
              key={entry.id}
              userName={entry.userName}
              type={entry.type}
              nodeName={entry.nodeName}
              timestamp={entry.timestamp}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
