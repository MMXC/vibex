/**
 * PresenceLayer — 协作用户头像层
 * E1-S1: 展示其他在线用户的头像，位置跟随其光标
 *
 * 特性：
 * - 用户头像圆形徽标（位置跟随光标）
 * - 颜色按 userId 哈希分配（同一用户颜色稳定）
 * - 最多显示 10 个用户头像（超出显示 +N）
 */

'use client';

import React, { useEffect, useRef, memo } from 'react';
import type { PresenceUser } from '@/lib/firebase/presence';
import { usePresence } from '@/lib/firebase/presence';
import styles from './PresenceLayer.module.css';

interface PresenceLayerProps {
  canvasId: string | null;
  userId: string | null;
  userName?: string;
  /** 画布容器的 ref，用于计算光标偏移 */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** 是否启用（可由降级模式关闭） */
  enabled?: boolean;
}

// 单个用户头像徽章
interface AvatarBadgeProps {
  user: PresenceUser;
  containerRef?: React.RefObject<HTMLElement | null>;
}

const AvatarBadge = memo(function AvatarBadge({
  user,
  containerRef,
}: AvatarBadgeProps) {
  const name = user.name || user.userId || '?';
  const initial = name.charAt(0).toUpperCase();

  // 计算头像位置
  let left = 0;
  let top = 0;
  if (user.cursor) {
    left = user.cursor.x;
    top = user.cursor.y;
  }

  // containerRef 用于未来相对坐标转换，当前位置已相对于画布

  return (
    <div
      className={styles.avatarBadge}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        backgroundColor: user.color,
      }}
      title={name}
      aria-label={`${name} 正在浏览此位置`}
    >
      <span className={styles.avatarInitial}>{initial}</span>
      <span className={styles.userName}>{name}</span>
    </div>
  );
});

// +N 溢出徽章
interface OverflowBadgeProps {
  count: number;
}

const OverflowBadge = memo(function OverflowBadge({ count }: OverflowBadgeProps) {
  return (
    <div className={styles.overflowBadge} title={`还有 ${count} 位用户在线`}>
      <span className={styles.overflowCount}>+{count}</span>
    </div>
  );
});

/**
 * PresenceLayer
 * 画布上层叠的协作用户头像层
 *
 * 使用 z-index 确保在画布节点之上，工具栏之下
 */
function PresenceLayer({
  canvasId,
  userId,
  userName = 'Anonymous',
  containerRef,
  enabled = true,
}: PresenceLayerProps) {
  const { others, updateCursor, isAvailable } = usePresence(
    enabled ? canvasId : null,
    enabled ? userId : null,
    userName
  );

  const lastCursorUpdate = useRef<number>(0);
  const CURSOR_THROTTLE_MS = 50; // 光标更新节流 50ms

  // 全局鼠标移动监听，更新光标位置
  useEffect(() => {
    if (!enabled || !isAvailable) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastCursorUpdate.current < CURSOR_THROTTLE_MS) return;
      lastCursorUpdate.current = now;

      // 转换为画布坐标（如果 containerRef 存在）
      let x = e.clientX;
      let y = e.clientY;

      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      updateCursor(x, y);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled, isAvailable, updateCursor, containerRef]);

  if (!enabled || !isAvailable) {
    return null;
  }

  const MAX_VISIBLE = 10;
  const visibleUsers = others.slice(0, MAX_VISIBLE);
  const overflowCount = Math.max(0, others.length - MAX_VISIBLE);

  return (
    <div className={styles.presenceLayer} aria-hidden="true">
      {visibleUsers.map((user) => (
        <AvatarBadge
          key={user.userId}
          user={user}
          containerRef={containerRef}
        />
      ))}
      {overflowCount > 0 && <OverflowBadge count={overflowCount} />}
    </div>
  );
}

export default PresenceLayer;
