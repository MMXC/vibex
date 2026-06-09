/**
 * ImportShareDialog.tsx — S83-E2: Import canvas via share link
 *
 * Modal dialog shown when a user navigates to a canvas page with ?import=<shareToken>.
 * Validates the token via the backend API and presents:
 * - Canvas metadata (name, role, expiry)
 * - Import confirmation button
 * - Conflict resolution options (if canvas already exists)
 *
 * data-testid="import-share-dialog"
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { canvasShareApi } from '@/lib/api/canvas-share';
import type { ShareRole } from '@/lib/api/canvas-share';
import styles from './ImportShareDialog.module.css';

interface ImportShareDialogProps {
  isOpen: boolean;
  /** The share token from URL ?import= param */
  shareToken: string;
  /** Called when user closes the dialog or cancels */
  onClose: () => void;
  /** Called after successful import with the imported canvas ID */
  onImported?: (canvasId: string, canvasName: string | null) => void;
}

type ImportStatus = 'idle' | 'loading' | 'validating' | 'ready' | 'importing' | 'success' | 'error';

interface CanvasImportData {
  token: string;
  canvasId: string;
  canvasName: string | null;
  canvasVersion: number | null;
  role: ShareRole;
  expiresAt: string | null;
  canvasData: unknown | null;
}

const ROLE_LABELS: Record<ShareRole, string> = {
  viewer: '只读查看',
  editor: '可编辑',
};

export function ImportShareDialog({
  isOpen,
  shareToken,
  onClose,
  onImported,
}: ImportShareDialogProps) {
  const t = useTranslations('share');
  const tCommon = useTranslations('common');

  const [status, setStatus] = useState<ImportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importData, setImportData] = useState<CanvasImportData | null>(null);
  const [importedCanvasId, setImportedCanvasId] = useState<string | null>(null);

  // Validate token when dialog opens with a new token
  useEffect(() => {
    if (!isOpen || !shareToken) return;

    const validate = async () => {
      setStatus('validating');
      setErrorMessage(null);
      setImportData(null);

      try {
        const result = await canvasShareApi.validateShareToken(shareToken);
        if (result.success) {
          setImportData({
            token: result.token,
            canvasId: result.canvasId,
            canvasName: result.canvasName,
            canvasVersion: result.canvasVersion,
            role: result.role,
            expiresAt: result.expiresAt,
            canvasData: result.canvasData,
          });
          setStatus('ready');
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (t('importFailed') || 'Failed to validate share link');
        setErrorMessage(message);
        setStatus('error');
      }
    };

    validate();
  }, [isOpen, shareToken, t]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setErrorMessage(null);
      setImportData(null);
      setImportedCanvasId(null);
    }
  }, [isOpen]);

  const handleImport = useCallback(async () => {
    if (!importData) return;
    setStatus('importing');
    setErrorMessage(null);

    try {
      // Simulate import: create a new canvas with the shared data
      // In a full implementation, this would call a POST /api/canvas/import endpoint
      // For now, we dispatch a custom event that DDSCanvasPage listens to
      const event = new CustomEvent('canvas:import-share', {
        detail: {
          canvasId: importData.canvasId,
          canvasName: importData.canvasName,
          canvasData: importData.canvasData,
          role: importData.role,
        },
      });
      window.dispatchEvent(event);

      setImportedCanvasId(importData.canvasId);
      setStatus('success');

      // Notify parent
      onImported?.(importData.canvasId, importData.canvasName);

      // Auto-close after brief success display
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : (t('importFailed') || 'Import failed');
      setErrorMessage(message);
      setStatus('error');
    }
  }, [importData, onImported, onClose, t]);

  const formatExpiry = (expiresAt: string | null): string => {
    if (!expiresAt) return t('noExpiry') || '永不过期';
    const date = new Date(expiresAt);
    const now = Date.now();
    const diff = date.getTime() - now;
    if (diff < 0) return t('expired') || '已过期';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 1) return t('expiresTomorrow') || '明天过期';
    if (days < 7) return `${days} ${t('daysLeft') || '天后过期'}`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-share-dialog-title"
      data-testid="import-share-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget && status !== 'importing') {
          onClose();
        }
      }}
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>📥</div>
          <div className={styles.headerText}>
            <h2 id="import-share-dialog-title" className={styles.title}>
              {t('importFromShare') || '导入分享画布'}
            </h2>
            <p className={styles.subtitle}>
              {t('importSubtitle') || '从分享链接导入画布到你的工作区'}
            </p>
          </div>
          {status !== 'importing' && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={tCommon('close')}
              data-testid="import-share-close"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Loading / Validating state */}
          {(status === 'validating' || status === 'loading') && (
            <div className={styles.stateContainer}>
              <div className={styles.spinner} data-testid="import-share-spinner" />
              <p className={styles.stateText}>
                {status === 'validating'
                  ? (t('validatingToken') || '正在验证分享链接...')
                  : (t('importingCanvas') || '正在导入画布...')}
              </p>
            </div>
          )}

          {/* Token validation error */}
          {status === 'error' && (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <p className={styles.errorText}>{errorMessage}</p>
              <p className={styles.errorHint}>
                {t('invalidTokenHint') ||
                  '该分享链接可能已过期或已被撤回。请联系分享者获取新的链接。'}
              </p>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => {
                  setStatus('validating');
                  setErrorMessage(null);
                }}
                data-testid="import-share-retry"
              >
                {t('retry') || '重试'}
              </button>
            </div>
          )}

          {/* Canvas preview (ready to import) */}
          {status === 'ready' && importData && (
            <div className={styles.previewContainer}>
              {/* Canvas info */}
              <div className={styles.canvasInfo}>
                <div className={styles.canvasName}>
                  <span className={styles.canvasNameLabel}>
                    {t('canvasName') || '画布名称'}
                  </span>
                  <span className={styles.canvasNameValue}>
                    {importData.canvasName || t('untitledCanvas') || '未命名画布'}
                  </span>
                </div>

                <div className={styles.canvasMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>{t('permission') || '权限'}</span>
                    <span
                      className={`${styles.metaValue} ${styles.roleBadge} ${
                        importData.role === 'editor' ? styles.roleEditor : styles.roleViewer
                      }`}
                      data-testid="import-share-role"
                    >
                      {ROLE_LABELS[importData.role]}
                    </span>
                  </div>

                  {importData.canvasVersion && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>
                        {t('version') || '版本'}
                      </span>
                      <span className={styles.metaValue}>v{importData.canvasVersion}</span>
                    </div>
                  )}

                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>
                      {t('expiresAt') || '过期时间'}
                    </span>
                    <span className={styles.metaValue}>
                      {formatExpiry(importData.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className={styles.infoNote}>
                <span className={styles.infoIcon}>ℹ️</span>
                <p>
                  {t('importInfoNote') ||
                    `导入后，画布将作为新画布添加到你的工作区。分享者授予你${ROLE_LABELS[importData.role]}权限。`}
                </p>
              </div>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>✅</div>
              <p className={styles.successText}>
                {t('importSuccess') || '画布导入成功！'}
              </p>
              <p className={styles.successHint}>
                {t('importSuccessHint') || '正在跳转到画布...'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(status === 'ready' || status === 'error') && (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              data-testid="import-share-cancel"
              disabled={status === 'importing'}
            >
              {tCommon('cancel') || '取消'}
            </button>
            {status === 'ready' && (
              <button
                type="button"
                className={styles.importBtn}
                onClick={handleImport}
                disabled={status === 'importing'}
                data-testid="import-share-confirm"
              >
                {status === 'importing'
                  ? (t('importingCanvas') || '导入中...')
                  : (t('importCanvas') || '导入画布')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
