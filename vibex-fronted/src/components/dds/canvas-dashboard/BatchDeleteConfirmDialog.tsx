'use client';

/**
 * BatchDeleteConfirmDialog.tsx — S68-E4
 *
 * 批量删除确认对话框：
 * - 显示即将删除的画布数量和名称预览
 * - 用户确认后调用 canvasListStore.batchDeleteCanvas()
 * - 比 BatchOpsToolbar 中的内联确认更详细的独立对话框
 */

import { useMemo } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useTranslations } from '@/hooks/useTranslations';
import styles from './BatchOpsToolbar.module.css';

interface BatchDeleteConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function BatchDeleteConfirmDialog({ onConfirm, onCancel }: BatchDeleteConfirmDialogProps) {
  const t = useTranslations('batchOps')();
  const { selectedCanvasIds, canvases } = useCanvasListStore();

  const selectedCanvases = useMemo(
    () => Array.from(selectedCanvasIds).map((id) => canvases.find((c) => c.id === id)).filter(Boolean),
    [selectedCanvasIds, canvases]
  );

  const count = selectedCanvasIds.size;

  return (
    <div className={styles['dialog-overlay']} role="dialog" aria-modal="true" aria-labelledby="batch-delete-title">
      <div className={styles['dialog']}>
        <h3 id="batch-delete-title" className={styles['dialog__title']}>
          {t('confirmBatchDelete')}
        </h3>
        <p className={styles['dialog__body']}>
          {t('batchDeleteWarning', { count })}
        </p>

        {/* 画布预览列表 */}
        {selectedCanvases.length > 0 && (
          <div
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '8px',
              background: 'var(--color-surface-hover, #f1f5f9)',
              borderRadius: '8px',
            }}
          >
            {selectedCanvases.map((canvas) => (
              <div
                key={canvas!.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--color-text-primary, #1e293b)',
                }}
              >
                <span>🗑️</span>
                <span style={{ flex: 1 }}>{canvas!.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className={styles['dialog__actions']}>
          <button className={styles['dialog__cancel']} onClick={onCancel}>
            {t('cancel')}
          </button>
          <button
            className={`${styles['dialog__confirm']} ${styles['danger']}`}
            onClick={onConfirm}
          >
            {t('confirmBatchDeleteBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
