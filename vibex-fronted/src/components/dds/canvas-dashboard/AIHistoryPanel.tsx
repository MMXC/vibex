/**
 * AIHistoryPanel.tsx — Sprint64 E3: AI Session History Panel
 *
 * Drawer panel showing persisted AI session history (from IndexedDB).
 * Displays session list with timestamp, prompt summary, response summary,
 * and actions to delete or continue a session.
 *
 * D3.5: 新建 AIHistoryPanel.tsx
 * D3.6: AISessionDrawer.tsx 新增"历史"Tab → 渲染 AIHistoryPanel
 * D3.7: 页面刷新后 AI 历史对话列表完整保留
 */

'use client';

import React, { memo, useEffect, useCallback } from 'react';
import { useAgentStore } from '@/stores/dds/agentStore';
import styles from './AIHistoryPanel.module.css';

export const AIHistoryPanel = memo(function AIHistoryPanel() {
  const sessionHistory = useAgentStore((s) => s.sessionHistory);
  const sessionHistoryLoaded = useAgentStore((s) => s.sessionHistoryLoaded);
  const loadSessions = useAgentStore((s) => s.loadSessions);
  const clearSession = useAgentStore((s) => s.clearSession);
  const clearAllSessions = useAgentStore((s) => s.clearAllSessions);
  const setActiveSession = useAgentStore((s) => s.setActiveSession);

  // Load history on mount
  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleDelete = useCallback(
    (sessionId: string) => {
      void clearSession(sessionId);
    },
    [clearSession]
  );

  const handleClearAll = useCallback(() => {
    if (window.confirm('确定清空所有历史对话？')) {
      void clearAllSessions();
    }
  }, [clearAllSessions]);

  const handleContinue = useCallback(
    (sessionId: string) => {
      setActiveSession(sessionId);
    },
    [setActiveSession]
  );

  // Format timestamp to readable date string
  const formatDate = (isoString: string): string => {
    const d = new Date(isoString);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!sessionHistoryLoaded) {
    return (
      <div className={styles.empty}>
        <div className={styles.loading} aria-live="polite">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>加载历史...</span>
        </div>
      </div>
    );
  }

  if (sessionHistory.length === 0) {
    return (
      <div className={styles.empty}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={styles.emptyIcon}
        >
          <path
            d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className={styles.emptyText}>暂无历史对话</p>
        <p className={styles.emptyHint}>开始新对话后，历史将自动保存到这里</p>
      </div>
    );
  }

  return (
    <div className={styles.panel} role="region" aria-label="AI 历史对话">
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          {sessionHistory.length} 条历史对话
        </span>
        <button
          className={styles.clearAllBtn}
          onClick={handleClearAll}
          aria-label="清空所有历史"
          type="button"
        >
          清空全部
        </button>
      </div>

      {/* Session list */}
      <ul className={styles.list} role="list">
        {sessionHistory.map((session) => (
          <li key={session.id} className={styles.item} role="listitem">
            <div className={styles.itemHeader}>
              <span className={styles.sessionName}>{session.name}</span>
              <span className={styles.timestamp}>
                {formatDate(session.archivedAt)}
              </span>
            </div>

            {session.canvasContextSummary && (
              <div className={styles.canvasContext}>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{session.canvasContextSummary}</span>
              </div>
            )}

            <div className={styles.prompt}>
              <span className={styles.promptLabel}>Q:</span>
              <span className={styles.promptText}>
                {session.promptSummary || '(无提问)'}
              </span>
            </div>

            <div className={styles.response}>
              <span className={styles.responseLabel}>A:</span>
              <span className={styles.responseText}>
                {session.responseSummary || '(无响应)'}
              </span>
            </div>

            <div className={styles.itemActions}>
              <button
                className={styles.actionBtn}
                onClick={() => handleContinue(session.id)}
                aria-label={`继续对话: ${session.name}`}
                type="button"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                继续
              </button>
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={() => handleDelete(session.id)}
                aria-label={`删除历史: ${session.name}`}
                type="button"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
