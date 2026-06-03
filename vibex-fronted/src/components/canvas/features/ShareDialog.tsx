/**
 * ShareDialog.tsx — Sprint58 E4: Canvas Share Dialog
 *
 * A modal dialog for sharing a canvas. Supports three sharing modes:
 * 1. "link" — create a token-based share link (/canvas/<id>?share=<token>)
 *    - Permission dropdown: 仅查看 / 可编辑 / 关闭分享
 * 2. "team" — share with a team (via ShareToTeamModal)
 *
 * data-testid="share-dialog"
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import {
  buildShareUrl,
  generateShareToken,
  copyToClipboard,
} from '@/lib/shareUtils';
import styles from './ShareDialog.module.css';

type ShareMode = 'link' | 'team';

/** E4 permission options */
export type SharePermission = 'viewer' | 'editor' | 'none';

interface ShareDialogProps {
  isOpen: boolean;
  canvasId: string;
  canvasName?: string;
  /** Current share token (null = not shared) */
  currentToken?: string | null;
  /** Current permission (null = not shared) */
  currentPermission?: SharePermission;
  onClose: () => void;
  onSave: (token: string | null, permission: SharePermission) => void;
  onTeamShareRequest?: () => void;
}

export function ShareDialog({
  isOpen,
  canvasId,
  canvasName,
  currentToken = null,
  currentPermission = 'none',
  onClose,
  onSave,
  onTeamShareRequest,
}: ShareDialogProps) {
  const t = useTranslations('share');
  const tCommon = useTranslations('common');

  const [mode, setMode] = useState<ShareMode>('link');
  /** Current permission selection in the UI */
  const [permission, setPermission] = useState<SharePermission>(currentPermission);
  /** Generated token (null = no share link yet) */
  const [token, setToken] = useState<string | null>(currentToken);
  /** Whether the "复制链接" button was clicked and succeeded */
  const [copied, setCopied] = useState(false);
  /** Error message */
  const [error, setError] = useState<string | null>(null);

  // Sync when dialog opens / external values change
  useEffect(() => {
    if (isOpen) {
      setPermission(currentPermission);
      setToken(currentToken);
      setCopied(false);
      setError(null);
    }
  }, [isOpen, currentPermission, currentToken]);

  // Derived share URL
  const shareUrl = token
    ? buildShareUrl(canvasId, token)
    : null;

  const handlePermissionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPerm = e.target.value as SharePermission;
      setPermission(newPerm);

      if (newPerm === 'none') {
        // Disable sharing
        setToken(null);
        setCopied(false);
      } else if (!token) {
        // Generate a new token for the first time
        setToken(generateShareToken());
        setCopied(false);
      }
      // If switching between viewer/editor with existing token, keep the same token
    },
    [token]
  );

  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl) return;
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setError(t('shareFailed') || 'Failed to copy to clipboard');
    }
  }, [shareUrl, t]);

  const handleSave = useCallback(() => {
    if (permission === 'none') {
      onSave(null, 'none');
    } else {
      onSave(token, permission);
    }
    onClose();
  }, [permission, token, onSave, onClose]);

  const handleDismissError = useCallback(() => {
    setError(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      data-testid="share-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="share-dialog-title" className={styles.title}>
            {t('share') || '分享'}
          </h2>
          {canvasName && <p className={styles.subtitle}>{canvasName}</p>}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={tCommon('close')}
            title={tCommon('close')}
            data-testid="share-dialog-close"
          >
            ×
          </button>
        </div>

        {/* Mode Tabs */}
        <div className={styles.modeTabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'link'}
            className={`${styles.modeTab} ${mode === 'link' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('link')}
            data-testid="share-mode-link"
          >
            {t('shareLink') || '分享链接'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'team'}
            className={`${styles.modeTab} ${mode === 'team' ? styles.modeTabActive : ''}`}
            onClick={() => setMode('team')}
            data-testid="share-mode-team"
          >
            {tCommon('shareToTeam') || '分享给团队'}
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* ── Link Mode ── */}
          {mode === 'link' && (
            <div className={styles.linkMode}>
              {error && (
                <div className={styles.errorBanner} role="alert">
                  <span>{error}</span>
                  <button
                    type="button"
                    className={styles.dismissBtn}
                    onClick={handleDismissError}
                    data-testid="share-error-dismiss"
                    aria-label="dismiss"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Permission dropdown */}
              <div className={styles.permissionRow}>
                <label className={styles.permissionLabel} htmlFor="share-permission-select">
                  {t('permission') || '分享权限'}
                </label>
                <select
                  id="share-permission-select"
                  className={styles.permissionSelect}
                  value={permission}
                  onChange={handlePermissionChange}
                  data-testid="share-permission-select"
                >
                  <option value="viewer">{t('viewerOnly') || '仅查看'}</option>
                  <option value="editor">{t('editorAccess') || '可编辑'}</option>
                  <option value="none">{t('disableShare') || '关闭分享'}</option>
                </select>
              </div>

              {/* Share URL display */}
              {permission !== 'none' && shareUrl && (
                <div className={styles.urlSection}>
                  {copied && (
                    <div className={styles.successBanner} role="status">
                      ✓ {t('copied') || '链接已复制！'}
                    </div>
                  )}
                  <label className={styles.urlLabel} htmlFor="share-url-input">
                    {t('shareUrl') || '分享链接'}
                  </label>
                  <div className={styles.urlRow}>
                    <input
                      id="share-url-input"
                      type="text"
                      readOnly
                      value={shareUrl}
                      className={styles.urlInput}
                      data-testid="share-url-input"
                    />
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={handleCopyUrl}
                      data-testid="share-copy-btn"
                    >
                      {t('copyLink') || '复制链接'}
                    </button>
                  </div>
                  <p className={styles.hint}>
                    {permission === 'viewer'
                      ? (t('viewerHint') || '接收者仅可查看画布内容')
                      : (t('editorHint') || '接收者可查看并编辑画布内容')}
                  </p>
                </div>
              )}

              {permission === 'none' && (
                <p className={styles.disabledHint}>
                  {t('shareDisabled') || '分享已关闭，收到的链接将无法访问此画布'}
                </p>
              )}
            </div>
          )}

          {/* ── Team Mode ── */}
          {mode === 'team' && (
            <div className={styles.teamMode}>
              <p className={styles.teamHint}>
                {t('shareToTeam') || '将画布分享给你的团队成员'}
              </p>
              <button
                type="button"
                className={styles.teamBtn}
                onClick={() => {
                  onClose();
                  onTeamShareRequest?.();
                }}
                data-testid="share-open-team-modal"
              >
                {t('shareToTeam') || '打开团队分享'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            data-testid="share-cancel-btn"
          >
            {tCommon('cancel') || '取消'}
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            data-testid="share-save-btn"
          >
            {tCommon('save') || '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
