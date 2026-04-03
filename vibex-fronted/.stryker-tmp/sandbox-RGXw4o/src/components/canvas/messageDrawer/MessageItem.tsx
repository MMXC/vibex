/**
 * MessageItem.tsx — 单条消息展示
 *
 * Epic 1 F1.3: 消息列表组件
 * 支持 4 种消息类型，带时间戳和图标
 */
// @ts-nocheck


'use client';

import React, { useCallback } from 'react';
import type { MessageItem as MessageItemType } from './messageDrawerStore';
import styles from './messageDrawer.module.css';

interface MessageItemProps {
  message: MessageItemType;
}

const TYPE_ICONS: Record<MessageItemType['type'], string> = {
  user_action: '✏️',
  ai_suggestion: '🤖',
  system: '⚙️',
  command_executed: '▶️',
};

const TYPE_LABELS: Record<MessageItemType['type'], string> = {
  user_action: '用户操作',
  ai_suggestion: 'AI 建议',
  system: '系统',
  command_executed: '命令',
};

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function MessageItem({ message }: MessageItemProps) {
  const { type, content, meta, timestamp } = message;

  return (
    <div
      className={`${styles.messageItem} ${styles[`messageItem--${type}`]}`}
      role="listitem"
      aria-label={`${TYPE_LABELS[type]}: ${content}`}
    >
      <span className={styles.messageIcon} aria-hidden="true">
        {TYPE_ICONS[type]}
      </span>
      <div className={styles.messageBody}>
        <span className={styles.messageContent}>{content}</span>
        {meta && (
          <span className={styles.messageMeta}>{meta}</span>
        )}
      </div>
      <time
        className={styles.messageTime}
        dateTime={new Date(timestamp).toISOString()}
        title={new Date(timestamp).toLocaleString('zh-CN')}
        role="timer"
      >
        {formatTime(timestamp)}
      </time>
    </div>
  );
}
