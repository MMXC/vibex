/**
 * EdgeCreationModal — Modal for adding page-to-page flow edges
 * E1-QA: E1-U1
 *
 * Displays two <select> dropdowns (source page / target page).
 * Confirm calls onConfirm(sourceId, targetId).
 * Cancel calls onCancel().
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import type { ProtoPage } from '@/stores/prototypeStore';
import styles from './EdgeCreationModal.module.css';

// ==================== Props ====================

export interface EdgeCreationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** List of pages to show in dropdowns */
  pages: ProtoPage[];
  /** Called with (sourcePageId, targetPageId) when confirmed */
  onConfirm: (sourceId: string, targetId: string) => void;
  /** Called when cancel/close is clicked */
  onCancel: () => void;
}

// ==================== Component ====================

export const EdgeCreationModal = memo(function EdgeCreationModal({
  open,
  pages,
  onConfirm,
  onCancel,
}: EdgeCreationModalProps) {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');

  const isSame = sourceId !== '' && targetId !== '' && sourceId === targetId;
  const canConfirm = sourceId !== '' && targetId !== '' && !isSame;

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onConfirm(sourceId, targetId);
    setSourceId('');
    setTargetId('');
  }, [canConfirm, onConfirm, sourceId, targetId]);

  const handleCancel = useCallback(() => {
    onCancel();
    setSourceId('');
    setTargetId('');
  }, [onCancel]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) handleCancel();
    },
    [handleCancel]
  );

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edge-creation-title"
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="edge-creation-title" className={styles.title}>
            添加连线
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleCancel}
            aria-label="关闭"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {pages.length < 2 ? (
            <p className={styles.emptyState}>需要至少 2 个页面才能创建连线</p>
          ) : (
            <>
              <div className={styles.selectGroup}>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className={styles.edgeSelect}
                  aria-label="源页面"
                >
                  <option value="">选择源页面</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.route}
                    </option>
                  ))}
                </select>
                <span className={styles.arrow} aria-hidden="true">→</span>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className={styles.edgeSelect}
                  aria-label="目标页面"
                >
                  <option value="">选择目标页面</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.route}
                    </option>
                  ))}
                </select>
              </div>

              {isSame && (
                <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>
                  源页面和目标页面不能相同
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.btn} ${styles.cancelBtn}`}
            onClick={handleCancel}
          >
            取消
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.confirmBtn}`}
            onClick={handleConfirm}
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
});
