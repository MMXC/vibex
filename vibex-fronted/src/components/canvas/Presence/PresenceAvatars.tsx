/**
 * PresenceAvatars — Display online users on canvas (E2-U4)
 * EpicE2: Firebase Presence 真实接入
 *
 * 四态覆盖：理想态 / 空状态 / 加载态 / 错误态
 * 禁止导入 firebase/app，只导入 firebase/database 以控制 bundle 大小。
 */

'use client';

import React from 'react';
import { usePresence, type PresenceUser } from '@/lib/firebase/presence';
import styles from './PresenceAvatars.module.css';

interface PresenceAvatarsProps {
  canvasId: string;
  maxDisplay?: number; // 默认 5
}

/**
 * WiFi-off 图标（错误态）
 */
function WifiOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

/**
 * 两个小人图标（空状态）
 */
function NoCollaboratorsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/**
 * 理想态：彩色圆形头像堆叠
 */
function IdealState({ users, maxDisplay }: { users: PresenceUser[]; maxDisplay: number }) {
  const displayUsers = users.slice(0, maxDisplay);
  const overflow = Math.max(0, users.length - maxDisplay);

  if (users.length === 0) return null;

  return (
    <div className={styles.container} role="group" aria-label={`${users.length} 位协作者在线`}>
      {displayUsers.map((user) => (
        <div
          key={user.userId}
          className={styles.avatar}
          style={{ backgroundColor: user.color }}
          title={user.name}
          aria-label={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={styles.overflow}
          title={`还有 ${overflow} 位`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

/**
 * 空状态：两个小人图标 + "暂无协作者"
 */
function EmptyState() {
  return (
    <div className={styles.emptyState} role="status" aria-live="polite">
      <NoCollaboratorsIcon />
      <span className={styles.emptyText}>暂无协作者</span>
    </div>
  );
}

/**
 * 加载态：骨架屏（3 个灰色圆形，shimmer 动画）
 */
function LoadingState() {
  return (
    <div className={styles.container} role="status" aria-label="加载中...">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={styles.skeleton}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

/**
 * 错误态：WiFi-off 图标 + tooltip
 */
function ErrorState() {
  return (
    <div
      className={styles.errorState}
      role="status"
      title="实时同步暂不可用"
    >
      <WifiOffIcon />
      <span className={styles.errorTooltip}>实时同步暂不可用</span>
    </div>
  );
}

/**
 * PresenceAvatars — 四态协作用户头像组件
 *
 * 使用 usePresence hook 获取实时数据，内部处理四态切换
 */
export function PresenceAvatars({ canvasId, maxDisplay = 5 }: PresenceAvatarsProps) {
  // usePresence 内部已处理 visibilitychange 兜底（E2-U3）
  const { others, isAvailable, isConnected } = usePresence(canvasId, null, 'presence-check');

  // 四态分支
  if (!isAvailable) {
    return <ErrorState />;
  }
  if (!isConnected) {
    return <LoadingState />;
  }
  if (others.length === 0) {
    return <EmptyState />;
  }
  return <IdealState users={others} maxDisplay={maxDisplay} />;
}

export type { PresenceAvatarsProps };
export default PresenceAvatars;
