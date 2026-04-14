/**
 * CardPreview — AI Card Preview with Accept/Edit/Retry Actions
 * Epic 3: F15
 *
 * Renders AI-generated cards using CardRenderer and provides
 * action buttons to accept (add to canvas), edit, or retry generation.
 *
 * Props:
 * - cards: DDSCard[] — AI generated cards to preview
 * - onAccept: () => void — add cards to store
 * - onEdit: () => void — open card editor
 * - onRetry: () => void — regenerate cards
 * - isLoading: boolean
 */

'use client';

import React, { memo, useCallback } from 'react';
import type { DDSCard } from '@/types/dds';
import { CardRenderer } from '../cards/CardRenderer';
import styles from './CardPreview.module.css';

// ==================== Props ====================

export interface CardPreviewProps {
  cards: DDSCard[];
  onAccept: () => void;
  onEdit: () => void;
  onRetry: () => void;
  isLoading?: boolean;
}

// ==================== Component ====================

export const CardPreview = memo(function CardPreview({
  cards,
  onAccept,
  onEdit,
  onRetry,
  isLoading = false,
}: CardPreviewProps) {
  const handleAccept = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAccept();
    },
    [onAccept]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onEdit();
    },
    [onEdit]
  );

  const handleRetry = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onRetry();
    },
    [onRetry]
  );

  return (
    <div className={styles.preview} data-testid="card-preview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #f9fafb)',
            }}
          >
            预览 ({cards.length})
          </span>
          <span className={styles.badge}>{cards.length} 张卡片</span>
        </div>

        {/* Card List */}
        {cards.length === 0 ? (
          <div className={styles.empty} data-testid="card-preview-empty">
            暂无卡片
          </div>
        ) : (
          <div className={styles.cardList} data-testid="card-list">
            {cards.map((card) => (
              <div key={card.id} className={styles.cardItem}>
                <CardRenderer card={card} />
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {cards.length > 0 && (
          <div className={styles.actions} data-testid="card-preview-actions">
            <button
              type="button"
              className={`${styles.btn} ${styles.btnAccept}`}
              onClick={handleAccept}
              disabled={isLoading}
              data-testid="btn-accept"
              aria-label="接受卡片，添加到画布"
            >
              ✓ 接受
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnEdit}`}
              onClick={handleEdit}
              disabled={isLoading}
              data-testid="btn-edit"
              aria-label="编辑卡片"
            >
              ✎ 编辑
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnRetry}`}
              onClick={handleRetry}
              disabled={isLoading}
              data-testid="btn-retry"
              aria-label="重新生成卡片"
            >
              ↺ 重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default CardPreview;
