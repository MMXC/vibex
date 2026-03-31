/**
 * MessageDrawer.tsx — 消息抽屉容器
 *
 * Epic 1: F1.1 抽屉容器
 * PRD D1: Chat 模式（Slack 风格），独立于 AIChatPanel
 * PRD D3: PC 默认 200px，可调整
 *
 * 右侧固定 200px 宽度，动画展开/收起
 */

'use client';

import React from 'react';
import { useMessageDrawerStore } from './messageDrawerStore';
import { MessageList } from './MessageList';
import { CommandInput } from './CommandInput';
import styles from './messageDrawer.module.css';

export function MessageDrawer() {
  const isOpen = useMessageDrawerStore((s) => s.isOpen);

  return (
    <aside
      className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}
      aria-label="消息抽屉"
      aria-hidden={!isOpen}
      data-testid="message-drawer"
    >
      {/* Drawer header */}
      <div className={styles.drawerHeader}>
        <h2 className={styles.drawerTitle}>💬 消息</h2>
      </div>

      {/* Message list */}
      <MessageList />

      {/* Epic 2 F2.1: Command input — bottom fixed */}
      <CommandInput />
    </aside>
  );
}
