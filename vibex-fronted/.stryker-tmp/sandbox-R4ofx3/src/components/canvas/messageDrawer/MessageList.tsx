/**
 * MessageList.tsx — 消息列表容器
 *
 * Epic 1 F1.3: 消息列表
 * 支持 4 种消息类型（user_action / ai_suggestion / system / command_executed）
 */
// @ts-nocheck


'use client';

import React, { useEffect, useRef } from 'react';
import { useMessageDrawerStore } from './messageDrawerStore';
import { MessageItem } from './MessageItem';
import styles from './messageDrawer.module.css';

export function MessageList() {
  const messages = useMessageDrawerStore((s) => s.messages);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className={styles.messageListEmpty} role="status" aria-live="polite">
        <span className={styles.emptyIcon}>💬</span>
        <p className={styles.emptyText}>暂无消息</p>
        <p className={styles.emptyHint}>
          节点操作和命令执行将显示在这里
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className={styles.messageList}
      role="list"
      aria-label="消息列表"
      aria-live="polite"
    >
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
}
