/**
 * ConflictBubble — 协作冲突提示气泡
 * E1-S3: 协作冲突提示 UI
 *
 * 特性：
 * - 绝对定位气泡，出现在被冲突节点的旁边
 * - 双方用户名 + 冲突时间 + "了解" 按钮
 * - 淡入动画 < 200ms
 * - 关闭后同一冲突 5 分钟内不再重复显示
 */

'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import { onConflict } from '@/lib/canvas/collaborationSync';
import styles from './ConflictBubble.module.css';

interface ConflictEvent {
  treeType: string;
  action: string;
  nodeId: string;
  userId: string;
  timestamp: number;
}

interface ConflictBubbleItem {
  id: string;
  userId: string;
  treeType: string;
  nodeId: string;
  timestamp: number;
  dismissed: boolean;
}

const CONFLICT_COOLDOWN_MS = 5 * 60 * 1000; // 5 分钟冷却

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** 生成简单的 userId 前缀用于显示 */
function getShortUserId(userId: string): string {
  return userId.length > 8 ? `${userId.slice(0, 4)}...${userId.slice(-4)}` : userId;
}

const ConflictBubbleItem = memo(function ConflictBubbleItem({
  conflict,
  onDismiss,
}: {
  conflict: ConflictBubbleItem;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={styles.bubble}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.bubbleHeader}>
        <span className={styles.bubbleIcon}>⚠️</span>
        <span className={styles.bubbleTitle}>编辑冲突</span>
      </div>
      <div className={styles.bubbleBody}>
        <p className={styles.bubbleText}>
          用户 <strong>{getShortUserId(conflict.userId)}</strong> 同时编辑了此节点
        </p>
        <p className={styles.bubbleTime}>{formatTime(conflict.timestamp)}</p>
      </div>
      <button
        className={styles.dismissButton}
        onClick={() => onDismiss(conflict.id)}
        aria-label="了解并关闭"
      >
        了解
      </button>
    </div>
  );
});

/**
 * ConflictBubble — 冲突提示气泡管理器
 *
 * 挂载在 Canvas Container 内，通过 React Context 接收冲突事件
 */
export function ConflictBubble() {
  const [conflicts, setConflicts] = useState<ConflictBubbleItem[]>([]);

  const dismissConflict = useCallback((id: string) => {
    setConflicts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, dismissed: true } : c))
    );
    // 3 秒后从列表中移除（等待动画完成）
    setTimeout(() => {
      setConflicts((prev) => prev.filter((c) => c.id !== id));
    }, 300);
  }, []);

  useEffect(() => {
    // 订阅冲突事件
    const unsubscribe = onConflict((event: ConflictEvent) => {
      const conflictId = `${event.nodeId}-${event.userId}-${event.timestamp}`;

      // 检查是否已在冷却中
      const existing = conflicts.find((c) => c.nodeId === event.nodeId && !c.dismissed);
      if (existing) return;

      // 检查是否在 5 分钟内有过相同的冲突
      const recent = conflicts.find(
        (c) =>
          c.nodeId === event.nodeId &&
          Date.now() - c.timestamp < CONFLICT_COOLDOWN_MS
      );
      if (recent) return;

      const newConflict: ConflictBubbleItem = {
        id: conflictId,
        userId: event.userId,
        treeType: event.treeType,
        nodeId: event.nodeId,
        timestamp: event.timestamp,
        dismissed: false,
      };

      setConflicts((prev) => [...prev, newConflict]);
    });

    return unsubscribe;
  }, [conflicts]);

  // 只显示未关闭的冲突
  const visibleConflicts = conflicts.filter((c) => !c.dismissed);

  if (visibleConflicts.length === 0) return null;

  return (
    <div className={styles.container} aria-label="协作冲突提示">
      {visibleConflicts.map((conflict) => (
        <ConflictBubbleItem
          key={conflict.id}
          conflict={conflict}
          onDismiss={dismissConflict}
        />
      ))}
    </div>
  );
}

export default ConflictBubble;
