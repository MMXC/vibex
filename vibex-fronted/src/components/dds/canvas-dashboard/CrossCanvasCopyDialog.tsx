'use client';

/**
 * CrossCanvasCopyDialog.tsx — S68-E4
 *
 * 画布跨复制对话框：
 * - 用户选择目标画布（从列表中选择，排除源画布）
 * - 显示即将复制的画布预览（名称 + 缩略图）
 * - 确认后调用 canvasListStore.copyNodesBetweenCanvases()
 */

import { useState, useCallback, useMemo } from 'react';
import { useCanvasListStore } from '@/stores/canvasListStore';
import { useTranslations } from '@/hooks/useTranslations';
import styles from './BatchOpsToolbar.module.css';

interface CrossCanvasCopyDialogProps {
  /** 当前打开的画布 ID（源画布，用于排除） */
  currentCanvasId: string | null;
  /** 要复制的画布 ID 列表 */
  sourceCanvasIds: string[];
  onConfirm: (destCanvasId: string) => void;
  onCancel: () => void;
}

export function CrossCanvasCopyDialog({
  currentCanvasId,
  sourceCanvasIds,
  onConfirm,
  onCancel,
}: CrossCanvasCopyDialogProps) {
  const t = useTranslations('batchOps')();
  const { canvases } = useCanvasListStore();

  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);

  // 可选目标画布列表（排除源画布）
  const availableCanvases = useMemo(
    () => canvases.filter((c) => !sourceCanvasIds.includes(c.id)),
    [canvases, sourceCanvasIds]
  );

  // 源画布预览
  const sourceCanvases = useMemo(
    () => sourceCanvasIds.map((id) => canvases.find((c) => c.id === id)).filter(Boolean),
    [sourceCanvasIds, canvases]
  );

  const handleConfirm = useCallback(() => {
    if (!selectedDestId) return;
    onConfirm(selectedDestId);
  }, [selectedDestId, onConfirm]);

  return (
    <div className={styles['dialog-overlay']} role="dialog" aria-modal="true" aria-labelledby="copy-dialog-title">
      <div className={styles['dialog']} style={{ width: '420px' }}>
        <h3 id="copy-dialog-title" className={styles['dialog__title']}>
          {t('copyToCanvas')}
        </h3>
        <p className={styles['dialog__body']}>
          {t('copyToCanvasDesc', { count: sourceCanvasIds.length })}
        </p>

        {/* 源画布预览 */}
        <div className={styles['dialog__field']}>
          <label className={styles['dialog__label']}>{t('selectedForCopy')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
            {sourceCanvases.map((canvas) => (
              <div
                key={canvas!.id}
                className={styles['canvas-item']}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', border: '1px solid var(--color-border, #e2e8f0)', borderRadius: '6px' }}
              >
                {canvas!.thumbnail && (
                  <img
                    src={canvas!.thumbnail}
                    alt=""
                    style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: '3px' }}
                  />
                )}
                <span style={{ fontSize: '13px', color: 'var(--color-text-primary, #1e293b)' }}>
                  {canvas!.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 目标画布选择 */}
        <div className={styles['dialog__field']}>
          <label className={styles['dialog__label']}>{t('selectTargetCanvas')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
            {availableCanvases.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #94a3b8)', padding: '8px 0' }}>
                {t('noAvailableCanvas')}
              </p>
            ) : (
              availableCanvases.map((canvas) => (
                <label
                  key={canvas.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: selectedDestId === canvas.id ? 'var(--color-surface-hover, #f1f5f9)' : 'transparent',
                    border: `1px solid ${selectedDestId === canvas.id ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e2e8f0)'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="dest-canvas"
                    value={canvas.id}
                    checked={selectedDestId === canvas.id}
                    onChange={() => setSelectedDestId(canvas.id)}
                    style={{ accentColor: 'var(--color-primary, #3b82f6)' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--color-text-primary, #1e293b)' }}>
                    {canvas.name}
                  </span>
                  {canvas.id === currentCanvasId && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #94a3b8)', marginLeft: 'auto' }}>
                      {t('current')}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={styles['dialog__actions']}>
          <button className={styles['dialog__cancel']} onClick={onCancel}>
            {t('cancel')}
          </button>
          <button
            className={styles['dialog__confirm']}
            onClick={handleConfirm}
            disabled={!selectedDestId}
          >
            {t('confirmCopy')}
          </button>
        </div>
      </div>
    </div>
  );
}
