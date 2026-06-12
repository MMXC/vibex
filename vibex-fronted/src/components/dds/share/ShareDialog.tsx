/**
 * ShareDialog.tsx — Sprint82 E3: Canvas Share Dialog
 * S88-E4: Extended with embed preview + comment-only permission
 *
 * A modal dialog for sharing a canvas via link.
 * Supports: generate share link, copy URL, revoke link, change permission.
 * E4-F1: Live embed preview with iframe
 * E4-F2: Embed code customization (width, height, theme, toolbar)
 * E4-F3: comment-only permission mode
 * Uses shareService.ts for API operations.
 *
 * data-testid="share-dialog"
 */
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import {
  generateShareLink,
  revokeShareLink,
  listShareLinks,
  copyToClipboardShare,
  type GenerateShareLinkResult,
} from '@/services/shareService';
import type { ShareRole } from '@/lib/api/canvas-share';
import { QRShareDialog } from './QRShareDialog';
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

// Embed parameter defaults
const DEFAULT_EMBED_WIDTH = 800;
const DEFAULT_EMBED_HEIGHT = 600;
const DEFAULT_EMBED_THEME = 'auto';
const EMBED_DEBOUNCE_MS = 500;

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
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

  // --- E4-F2: Embed parameters ---
  const [embedWidth, setEmbedWidth] = useState(DEFAULT_EMBED_WIDTH);
  const [embedHeight, setEmbedHeight] = useState(DEFAULT_EMBED_HEIGHT);
  const [embedTheme, setEmbedTheme] = useState<'light' | 'dark' | 'auto'>(DEFAULT_EMBED_THEME);
  const [embedShowToolbar, setEmbedShowToolbar] = useState(true);
  const [embedCodeCopied, setEmbedCodeCopied] = useState(false);

  // --- E4-F3: GitHub PR URL for embed (so embedded canvas can show PR badge) ---
  const [githubPrUrl, setGithubPrUrl] = useState<string | null>(null);

  // S92-E4: QR share dialog state
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Fetch stored GitHub PR URL when dialog opens
  useEffect(() => {
    if (!isOpen || !canvasId) return;
    let cancelled = false;
    fetch(`/api/canvas/${canvasId}/github`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.ok && data.githubPrUrl) {
          setGithubPrUrl(data.githubPrUrl);
        }
      })
      .catch(() => { /* silently ignore — github link not set */ });
    return () => { cancelled = true; };
  }, [isOpen, canvasId]);

  // Build display object from service result
  const toDisplay = useCallback(
    (result: GenerateShareLinkResult, role: ShareRole): ShareLinkDisplay => ({
      token: result.token,
      role,
      createdAt: new Date().toISOString(),
      expiresAt: result.expiresAt,
      url: `${window.location.origin}/snapshot?canvas=${canvasId}&share=${result.token}`,
    }),
    [canvasId]
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
          setPermission(latest.role as ShareRole);
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
          const display = toDisplay(result, newPerm);
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
      const display = toDisplay(result, permission);
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

  // --- E4-F2/F3: Build iframe src URL ---
  const iframeSrc = useMemo(() => {
    if (!currentLink) return '';
    const params = new URLSearchParams({
      canvas: canvasId,
      share: currentLink.token,
      embed: '1',
      mode: permission,
      theme: embedTheme,
      toolbar: embedShowToolbar ? '1' : '0',
      width: String(embedWidth),
      height: String(embedHeight),
    });
    if (githubPrUrl) {
      params.set('github_pr', githubPrUrl);
    }
    return `/snapshot?${params.toString()}`;
  }, [currentLink, canvasId, permission, embedTheme, embedShowToolbar, embedWidth, embedHeight, githubPrUrl]);

  // --- E4-F2: Build generated iframe code ---
  const embedCode = useMemo(() => {
    if (!iframeSrc) return '';
    const fullSrc = `${window.location.origin}${iframeSrc}`;
    return `<iframe src="${fullSrc}" width="${embedWidth}" height="${embedHeight}" frameborder="0" allow="clipboard-read; clipboard-write"></iframe>`;
  }, [iframeSrc, embedWidth, embedHeight]);

  const handleCopyEmbedCode = useCallback(async () => {
    if (!embedCode) return;
    const ok = await copyToClipboardShare(embedCode);
    if (ok) {
      setEmbedCodeCopied(true);
      setTimeout(() => setEmbedCodeCopied(false), 3000);
    }
  }, [embedCode]);

  // Role display helper
  const roleLabel = (role: ShareRole) => {
    switch (role) {
      case 'viewer': return t('viewer') || '仅查看';
      case 'editor': return t('editor') || '可编辑';
      case 'comment-only': return t('commentOnly') || '仅查看评论';
    }
  };

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
              data-testid="share-permission-select"
            >
              <option value="viewer">{t('viewer') || '仅查看'}</option>
              <option value="editor">{t('editor') || '可编辑'}</option>
              <option value="comment-only">{t('commentOnly') || '仅查看评论'}</option>
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
                  aria-label={t('copyLink') || '复制链接'}
                  data-testid="share-dialog-copy-url"
                >
                  {copied ? (t('copied') || '已复制') : (t('copyLink') || '复制链接')}
                </button>
                {/* S92-E4: QR code share button */}
                <button
                  type="button"
                  className={styles.qrBtn}
                  onClick={() => setShowQRDialog(true)}
                  aria-label="扫码分享"
                  data-testid="share-dialog-qr-btn"
                >
                  📱
                </button>
                <button
                  type="button"
                  className={styles.revokeBtn}
                  onClick={() => handleRevoke(currentLink.token)}
                  disabled={loading}
                >
                  {t('revokeLink') || '撤销链接'}
                </button>
              </div>
              <p className={styles.hint}>
                {currentLink.expiresAt
                  ? `${t('expires') || '链接有效期至'} ${new Date(currentLink.expiresAt).toLocaleDateString('zh-CN')}`
                  : t('noExpiry') || '永久有效'}
              </p>
            </div>
          ) : (
            <>
              <p className={styles.noLink}>{t('noShareLink') || '暂无分享链接'}</p>
              <button
                type="button"
                className={styles.generateBtn}
                onClick={handleGenerateLink}
                disabled={loading}
                data-testid="share-dialog-generate-link"
              >
                {t('generateLink') || '生成链接'}
              </button>
            </>
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

          {/* === E4-F1 + E4-F2: Embed Preview Section === */}
          {currentLink && (
            <div className={styles.embedSection}>
              <div className={styles.embedSectionTitle}>
                {t('embedPreview') || '嵌入预览'}
              </div>

              {/* Embed preview iframe */}
              <div className={styles.embedPreview} data-testid="embed-preview-container">
                <iframe
                  src={iframeSrc}
                  title={t('embedPreview') || '嵌入预览'}
                  className={styles.embedIframe}
                  data-testid="embed-preview-iframe"
                  allow="clipboard-read; clipboard-write"
                />
                {permission === 'comment-only' && (
                  <div className={styles.embedCommentOnlyWatermark}>
                    {t('commentOnlyWatermark') || '仅显示评论'}
                  </div>
                )}
              </div>

              {/* Embed parameter form */}
              <div className={styles.embedParams}>
                <div className={styles.embedParamsRow}>
                  <div className={styles.embedParamField}>
                    <label className={styles.embedParamLabel}>{t('embedWidth') || '宽度'}</label>
                    <input
                      type="number"
                      className={styles.embedParamInput}
                      value={embedWidth}
                      onChange={(e) => setEmbedWidth(isNaN(parseInt(e.target.value)) ? DEFAULT_EMBED_WIDTH : Math.max(200, parseInt(e.target.value)))}
                      min={200}
                      max={2000}
                      data-testid="embed-width-input"
                    />
                  </div>
                  <div className={styles.embedParamField}>
                    <label className={styles.embedParamLabel}>{t('embedHeight') || '高度'}</label>
                    <input
                      type="number"
                      className={styles.embedParamInput}
                      value={embedHeight}
                      onChange={(e) => setEmbedHeight(Math.max(150, parseInt(e.target.value) || DEFAULT_EMBED_HEIGHT))}
                      min={150}
                      max={2000}
                      data-testid="embed-height-input"
                    />
                  </div>
                </div>
                <div className={styles.embedParamsRow}>
                  <div className={styles.embedParamField}>
                    <label className={styles.embedParamLabel}>{t('embedTheme') || '主题'}</label>
                    <select
                      className={styles.embedParamSelect}
                      value={embedTheme}
                      onChange={(e) => setEmbedTheme(e.target.value as 'light' | 'dark' | 'auto')}
                      data-testid="embed-theme-select"
                    >
                      <option value="auto">{t('themeAuto') || '自动'}</option>
                      <option value="light">{t('themeLight') || '浅色'}</option>
                      <option value="dark">{t('themeDark') || '深色'}</option>
                    </select>
                  </div>
                  <div className={styles.embedParamToggle}>
                    <label className={styles.embedParamLabel}>{t('embedShowToolbar') || '显示工具栏'}</label>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={embedShowToolbar}
                        onChange={(e) => setEmbedShowToolbar(e.target.checked)}
                        data-testid="embed-toolbar-toggle"
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Generated iframe code */}
              {embedCode && (
                <div className={styles.embedCodeArea}>
                  <label className={styles.label}>{t('embedCode') || '嵌入代码'}</label>
                  <div className={styles.embedCodeRow}>
                    <textarea
                      readOnly
                      className={styles.embedCodeTextarea}
                      value={embedCode}
                      rows={3}
                      data-testid="embed-code-textarea"
                    />
                    <button
                      type="button"
                      className={`${styles.copyBtn} ${embedCodeCopied ? styles.copied : ''}`}
                      onClick={handleCopyEmbedCode}
                      data-testid="embed-copy-btn"
                    >
                      {embedCodeCopied ? (t('copied') || '已复制') : (t('copyCode') || '复制代码')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other links */}
          {allLinks.length > 1 && (
            <div className={styles.otherLinks}>
              <h3 className={styles.otherLinksTitle}>{t('otherLinks') || '其他链接'}</h3>
              {allLinks
                .filter((l) => l.token !== currentLink?.token)
                .map((l) => (
                  <div key={l.token} className={styles.otherLinkItem}>
                    <span className={styles.otherLinkRole}>{roleLabel(l.role)}</span>
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

      {/* S92-E4: QR Code Share Dialog */}
      <QRShareDialog
        isOpen={showQRDialog}
        canvasId={canvasId}
        canvasName={canvasName}
        onClose={() => setShowQRDialog(false)}
      />
    </div>
  );
}
