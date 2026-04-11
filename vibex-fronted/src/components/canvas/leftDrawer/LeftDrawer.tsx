/**
 * LeftDrawer.tsx — Canvas 左抽屉组件
 *
 * Epic 2: 左抽屉 — 自然语言持续输入
 * PRD S2.1-S2.5
 *
 * 行为：
 * - 展开时显示需求输入框（任意 phase 可见）
 * - 折叠时宽度为 0，画布占满全宽
 * - 发送按钮触发 generateContexts
 * - 底部显示最近 5 条历史（sessionStorage）
 */

'use client';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

import React, { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/lib/canvas/stores/uiStore';
import { useContextStore } from '@/lib/canvas/stores/contextStore';
import { useSessionStore } from '@/lib/canvas/stores/sessionStore';
import { getHistory, addHistory } from './requirementHistoryStore';
import type { RequirementHistoryItem } from './requirementHistoryStore';
import type { BoundedContextNode, BoundedContextDraft } from '@/lib/canvas/types';
import { canvasApi } from '@/lib/canvas/api/canvasApi';
import styles from './leftDrawer.module.css';

export function LeftDrawer() {
  // ── Drawer state from UI store ────────────────────────────────
  const isOpen = useUIStore((s) => s.leftDrawerOpen);
  const toggleLeftDrawer = useUIStore((s) => s.toggleLeftDrawer);

  // ── AI thinking state from session store ───────────────────────
  const aiThinking = useSessionStore((s) => s.aiThinking);
  const aiThinkingMessage = useSessionStore((s) => s.aiThinkingMessage);
  const setRequirementText = useSessionStore((s) => s.setRequirementText);
  const requirementText = useSessionStore((s) => s.requirementText);
  const setContextNodes = useContextStore((s) => s.setContextNodes);

  // ── Local state ────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState(requirementText);
  const [history, setHistory] = useState<RequirementHistoryItem[]>([]);

  // Sync with store's requirementText (e.g., cleared after submission)
  useEffect(() => {
    setInputValue(requirementText);
  }, [requirementText]);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // ── Send handler ───────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || aiThinking) return;

    // Save to history (dedup + prepend)
    const updatedHistory = addHistory(text);
    setHistory(updatedHistory);

    // Sync to store
    setRequirementText(text);

    // Trigger generation: call real canvasApi
    try {
      const result = await canvasApi.generateContexts({
        requirementText: text,
        projectId: localStorage.getItem('vibex_project_id') ?? '',
      });

      if (result.success && result.contexts) {
        const nodes: BoundedContextNode[] = result.contexts.map((ctx) => ({
          nodeId: ctx.id,
          name: ctx.name,
          description: ctx.description,
          type: ctx.type as 'core' | 'supporting' | 'generic' | 'external',
          status: 'pending' as const,
          children: [],
        }));
        setContextNodes(nodes);
      } else {
        // Fallback: set empty on failure
        setContextNodes([]);
      }
    } catch (err) {
      canvasLogger.LeftDrawer.error('Failed to generate contexts:', err);
      setContextNodes([]);
    }
  }, [inputValue, aiThinking, setRequirementText, setContextNodes]);

  // ── Keyboard shortcut: Ctrl/Cmd+Enter to send ──────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── History item click: restore text ────────────────────────────
  const handleHistoryClick = useCallback(
    (item: RequirementHistoryItem) => {
      setInputValue(item.text);
    },
    []
  );

  // ── Render ─────────────────────────────────────────────────────
  return (
    <aside
      className={`${styles.leftDrawer} ${isOpen ? styles.leftDrawerOpen : styles.leftDrawerClosed}`}
      aria-label="需求输入抽屉"
      aria-hidden={!isOpen}
      data-testid="left-drawer"
    >
      {/* Header */}
      <div className={styles.leftDrawerHeader}>
        <h2 className={styles.leftDrawerTitle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          需求输入
        </h2>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={toggleLeftDrawer}
          aria-label="关闭需求输入抽屉"
          title="关闭"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className={styles.leftDrawerBody}>
        {/* Requirement textarea */}
        <textarea
          className={styles.requirementTextarea}
          placeholder="描述你的需求..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={aiThinking}
          aria-label="需求描述"
          data-testid="left-drawer-textarea"
        />

        {/* Send button */}
        <button
          type="button"
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!inputValue.trim() || aiThinking}
          aria-label={aiThinking ? '分析中...' : '发送需求'}
          data-testid="left-drawer-send-btn"
        >
          {aiThinking ? (
            <>
              <span className={styles.aiSpinner} aria-hidden="true" />
              分析中...
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              发送
            </>
          )}
        </button>

        {/* AI Thinking indicator (shown when AI is processing) */}
        {aiThinking && aiThinkingMessage && (
          <div
            className={styles.aiThinkingRow}
            role="status"
            aria-live="polite"
            data-testid="ai-thinking"
          >
            <span className={styles.aiSpinner} aria-hidden="true" />
            <span className={styles.aiThinkingMessage}>{aiThinkingMessage}</span>
          </div>
        )}

        {/* History section */}
        <div className={styles.historySection}>
          <p className={styles.historyTitle}>最近输入</p>
          {history.length === 0 ? (
            <p className={styles.historyEmpty}>暂无历史记录</p>
          ) : (
            <ul className={styles.historyList} data-testid="left-drawer-history">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={styles.historyItem}
                    onClick={() => handleHistoryClick(item)}
                    title={item.text}
                    aria-label={`恢复输入: ${item.text}`}
                    data-testid={`history-item-${item.id}`}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
