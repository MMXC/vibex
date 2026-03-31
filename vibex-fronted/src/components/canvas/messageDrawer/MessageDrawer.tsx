/**
 * MessageDrawer.tsx — 消息抽屉容器
 *
 * Epic 3: 右抽屉集成 — 使用 canvasStore.rightDrawerOpen 状态
 * PRD S3.1-S3.3
 *
 * 右侧固定 200px 宽度，动画展开/收起
 * 显示 SSE 状态和中止按钮
 */

'use client';

import React, { useCallback } from 'react';
import { useCanvasStore } from '@/lib/canvas/canvasStore';
import { MessageList } from './MessageList';
import { CommandInput } from './CommandInput';
import styles from './messageDrawer.module.css';

// ── SSE Status indicator colors ───────────────────────────────────────────────
const SSE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  idle:       { label: '待机',  color: '#6b7280', bg: '#f3f4f6' },
  connecting: { label: '连接中', color: '#d97706', bg: '#fef3c7' },
  connected:  { label: '已连接', color: '#059669', bg: '#d1fae5' },
  reconnecting:{ label: '重连中', color: '#d97706', bg: '#fef3c7' },
  error:      { label: '错误',   color: '#dc2626', bg: '#fee2e2' },
};

export function MessageDrawer() {
  // S3.1: Read from canvasStore instead of messageDrawerStore
  const isOpen = useCanvasStore((s) => s.rightDrawerOpen);
  const toggleRightDrawer = useCanvasStore((s) => s.toggleRightDrawer);

  // S3.2: SSE status
  const sseStatus = useCanvasStore((s) => s.sseStatus);
  const sseError = useCanvasStore((s) => s.sseError);
  const abortGeneration = useCanvasStore((s) => s.abortGeneration);
  const flowGenerating = useCanvasStore((s) => s.flowGenerating);
  const aiThinking = useCanvasStore((s) => s.aiThinking);

  const isGenerating = flowGenerating || aiThinking;
  const statusCfg = SSE_STATUS_CONFIG[sseStatus] ?? SSE_STATUS_CONFIG.idle;

  const handleAbort = useCallback(() => {
    abortGeneration();
  }, [abortGeneration]);

  return (
    <aside
      className={`${styles.drawer} ${isOpen ? styles.drawerOpen : styles.drawerClosed}`}
      aria-label="消息抽屉"
      aria-hidden={!isOpen}
      data-testid="message-drawer"
    >
      {/* S3.1: Header with SSE status + abort button */}
      <div className={styles.drawerHeader}>
        <h2 className={styles.drawerTitle}>💬 消息</h2>
        {/* S3.2: SSE status pill */}
        <span
          className={styles.sseStatusPill}
          style={{ color: statusCfg.color, background: statusCfg.bg }}
          title={sseError ?? statusCfg.label}
          data-testid="sse-status-pill"
        >
          {statusCfg.label}
        </span>
      </div>

      {/* S3.3: Abort button — shown when generating */}
      {isGenerating && (
        <div className={styles.abortBar} data-testid="abort-bar">
          <span className={styles.abortText}>生成中...</span>
          <button
            type="button"
            className={styles.abortButton}
            onClick={handleAbort}
            aria-label="中止生成"
            title="中止当前生成请求"
            data-testid="abort-button"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            中止
          </button>
        </div>
      )}

      {/* Message list */}
      <MessageList />

      {/* Command input — bottom fixed */}
      <CommandInput />
    </aside>
  );
}
