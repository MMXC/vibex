/**
 * ShareDialog.tsx — Sprint82 E3: Canvas Share Dialog
 *
 * A modal dialog for sharing a canvas via link.
 * Supports: generate share link, copy URL, revoke link, change permission.
 * Uses shareService.ts for API operations.
 *
 * data-testid="share-dialog"
 */
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import {
  generateShareLink,
  revokeShareLink,
  listShareLinks,
  copyToClipboardShare,
  type GenerateShareLinkResult,
} from '@/services/shareService';
import type { ShareRole } from '@/lib/api/canvas-share';
import styles from './ShareDialog.module.css';

interface ShareLinkDisplay {
  token: string;
  role: ShareRole;
  createdAt: string;
  expiresAt: string | null;
  url: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  canvasId: string;
  canvasName?: string;
  onClose: () => void;
  onSave: (token: string | null, permission: ShareRole) => void;
  onTeamShareRequest?: () => void;
}

export function ShareDialog({
  isOpen,
  canvasId,
  canvasName,
  onClose,
  onSave,
  onTeamShareRequest,
}: ShareDialogProps) {
  const t = useTranslations('share');
  const tCommon = useTranslations('common');

  /** Current permission selection in the UI */
  const [permission, setPermission] = useState<ShareRole>('viewer');
  /** Generated token + URL for the current share link */
  const [currentLink, setCurrentLink] = useState<ShareLinkDisplay | null>(null);
  /** All share links for this canvas (from localStorage) */
  const [allLinks, setAllLinks] = useState<ShareLinkDisplay[]>([]);
  /** Whether the "复制链接" button was clicked and succeeded */
  const [copied, setCopied] = useState(false);
  /** Error message */
  const [error, setError] = useState<string | null>(null);
  /** Loading state */
  const [loading, setLoading] = useState(false);

  // Build display object from service result
  const toDisplay = useCallback(
    (result: GenerateShareLinkResult): ShareLinkDisplay => ({
      token: result.token,
      role: permission,
      createdAt: new Date().toISOString(),
      expiresAt: result.expiresAt,
      url: `${window.location.origin}/snapshot?canvas=${canvasId}&share=${result.token}`,
    }),
    [canvasId, permission]
  );

  // Load existing share links when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setCopied(false);
    setLoading(true);
    listShareLinks(canvasId)
      .then((links) => {
        const displays = links.map((l) => ({
          token: l.token,
          role: l.role,
          createdAt: l.createdAt,
          expiresAt: l.expiresAt,
          url: `${window.location.origin}/snapshot?canvas=${canvasId}&share=${l.token}`,
        }));
        setAllLinks(displays);
        // Set current link to the most recently created one
        if (displays.length > 0) {
          const latest = displays.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          setCurrentLink(latest);
          setPermission(latest.role);
        }
      })
      .catch(() => setError('加载分享链接失败'))
      .finally(() => setLoading(false));
  }, [isOpen, canvasId]);

  const handlePermissionChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPerm = e.target.value as ShareRole;
      setPermission(newPerm);
      if (currentLink && currentLink.role !== newPerm) {
        setLoading(true);
        setError(null);
        try {
          await revokeShareLink(currentLink.token);
          const result = await generateShareLink({
            canvasId,
            canvasName: canvasName ?? '',
            role: newPerm,
          });
          const display = toDisplay(result);
          setCurrentLink(display);
          setAllLinks((prev) => {
            const filtered = prev.filter((l) => l.token !== currentLink.token);
            return [...filtered, display];
          });
        } catch {
          setError(t('shareFailed') || '分享失败');
        } finally {
          setLoading(false);
        }
      }
    },
    [currentLink, canvasId, canvasName, t, toDisplay]
  );

  const handleGenerateLink = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateShareLink({
        canvasId,
        canvasName: canvasName ?? '',
        role: permission,
      });
      const display = toDisplay(result);
      setCurrentLink(display);
      setAllLinks((prev) => [...prev, display]);
    } catch {
      setError(t('shareFailed') || '分享失败');
    } finally {
      setLoading(false);
    }
  }, [canvasId, canvasName, permission, t, toDisplay]);

  const handleCopyUrl = useCallback(async () => {
    if (!currentLink) return;
    const ok = await copyToClipboardShare(currentLink.url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setError(t('shareFailed') || '复制到剪贴板失败');
    }
  }, [currentLink, t]);

  const handleRevoke = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);
      try {
        await revokeShareLink(token);
        const newAll = allLinks.filter((l) => l.token !== token);
        setAllLinks(newAll);
        if (currentLink?.token === token) {
          setCurrentLink(null);
        }
        onSave(null, 'none');
      } catch {
        setError(t('shareFailed') || '撤销失败');
      } finally {
        setLoading(false);
      }
    },
    [allLinks, currentLink, onSave, t]
  );

  const handleSave = useCallback(() => {
    if (currentLink) {
      onSave(currentLink.token, currentLink.role);
    }
    onClose();
  }, [currentLink, onSave, onClose]);

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
            aria-label={t('close') || '关闭'}
            data-testid="share-dialog-close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Permission selector */}
          <div className={styles.field}>
            <label htmlFor="share-permission" className={styles.label}>
              {t('permission') || '权限'}
            </label>
            <select
              id="share-permission"
              className={styles.select}
              value={permission}
              onChange={handlePermissionChange}
              disabled={loading}
            >
              <option value="viewer">{t('viewer') || '仅查看'}</option>
              <option value="editor">{t('editor') || '可编辑'}</option>
            </select>
          </div>

          {/* Link area */}
          {loading && !currentLink ? (
            <p className={styles.loading}>{tCommon('loading') || '加载中...'}</p>
          ) : currentLink ? (
            <div className={styles.linkArea}>
              <div className={styles.urlRow}>
                <input
                  type="text"
                  readOnly
                  value={currentLink.url}
                  className={styles.urlInput}
                  aria-label={t('shareLink') || '分享链接'}
                />
                <button
                  type="button"
                  className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                  onClick={handleCopyUrl}
                  disabled={loading}
                >
                  {copied ? t('copied') || '已复制' : t('copyLink') || '复制链接'}
                </button>
              </div>
              <p className={styles.hint}>
                {currentLink.expiresAt
                  ? `${t('expires') || '链接有效期至'}: ${new Date(currentLink.expiresAt).toLocaleDateString('zh-CN')}`
                  : t('noExpiry') || '永久有效'}
              </p>
              <button
                type="button"
                className={styles.revokeBtn}
                onClick={() => handleRevoke(currentLink.token)}
                disabled={loading}
              >
                {t('revokeLink') || '撤销链接'}
              </button>
            </div>
          ) : (
            <div className={styles.linkArea}>
              <p className={styles.noLink}>{t('noShareLink') || '暂无分享链接'}</p>
              <button
                type="button"
                className={styles.generateBtn}
                onClick={handleGenerateLink}
                disabled={loading}
              >
                {t('generateLink') || '生成链接'}
              </button>
            </div>
          )}

          {/* Other links list */}
          {allLinks.length > 1 && (
            <div className={styles.otherLinks}>
              <h3 className={styles.otherLinksTitle}>{t('otherLinks') || '其他链接'}</h3>
              {allLinks
                .filter((l) => l.token !== currentLink?.token)
                .map((l) => (
                  <div key={l.token} className={styles.otherLinkItem}>
                    <span className={styles.otherLinkRole}>
                      {l.role === 'viewer' ? t('viewer') || '仅查看' : t('editor') || '可编辑'}
                    </span>
                    <span className={styles.otherLinkDate}>
                      {new Date(l.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    <button
                      type="button"
                      className={styles.revokeSmallBtn}
                      onClick={() => handleRevoke(l.token)}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button type="button" onClick={handleDismissError} className={styles.dismissError}>
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {onTeamShareRequest && (
            <button type="button" className={styles.teamShareBtn} onClick={onTeamShareRequest}>
              {t('teamShare') || '团队分享'}
            </button>
          )}
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            {tCommon('cancel') || '取消'}
          </button>
          {currentLink && (
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={loading}
            >
              {tCommon('save') || '保存'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
