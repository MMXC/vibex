'use client';

/**
 * TemplateHistoryPanel — E5-Template-Library S5.2
 *
 * Shows version history for a template.
 * Each history item: data-testid=history-item
 */

import React from 'react';
import type { TemplateSnapshot } from '@/hooks/useTemplateManager';
import styles from './TemplateHistoryPanel.module.css';

interface TemplateHistoryPanelProps {
  templateId: string;
  history: TemplateSnapshot[];
  onRestore: (snapshot: TemplateSnapshot) => void;
  onDelete: (snapshotId: string) => void;
  onClose: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TemplateHistoryPanel({
  templateId,
  history,
  onRestore,
  onDelete,
  onClose,
}: TemplateHistoryPanelProps) {
  return (
    <div className={styles.panel} role="dialog" aria-modal="true" aria-label="模板历史">
      <div className={styles.header}>
        <h3 className={styles.title}>模板历史</h3>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="关闭"
          data-testid="history-close-btn"
        >
          ×
        </button>
      </div>

      <div className={styles.body}>
        {history.length === 0 ? (
          <div className={styles.empty}>
            暂无历史快照
          </div>
        ) : (
          <ul className={styles.list}>
            {history.map((snap) => (
              <li
                key={snap.id}
                className={styles.item}
                data-testid="history-item"
              >
                <div className={styles.itemHeader}>
                  <span className={styles.timestamp}>{formatDate(snap.timestamp)}</span>
                  {snap.label && (
                    <span className={styles.label}>{snap.label}</span>
                  )}
                </div>
                <div className={styles.itemName}>{snap.data.name}</div>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.restoreBtn}
                    onClick={() => onRestore(snap)}
                    data-testid="history-restore-btn"
                  >
                    恢复
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => onDelete(snap.id)}
                    data-testid="history-delete-btn"
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.count}>
          {history.length} / 10 个快照
        </span>
      </div>
    </div>
  );
}
