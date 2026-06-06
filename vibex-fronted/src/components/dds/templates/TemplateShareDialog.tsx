/**
 * TemplateShareDialog.tsx — S69-E3: 模板市场
 *
 * Generates a Base64 share URL for the selected canvas template and
 * copies it to clipboard on demand.
 */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { buildTemplateShareUrl, copyToClipboard } from '@/lib/canvas/templateShare';
import type { CanvasTemplateData } from '@/lib/canvas/templateStore';
import styles from './TemplateShareDialog.module.css';

interface TemplateShareDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** The template to share */
  template: CanvasTemplateData | null;
  /** Called when user closes the dialog */
  onClose: () => void;
}

export function TemplateShareDialog({ isOpen, template, onClose }: TemplateShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [urlTooLong, setUrlTooLong] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Regenerate URL when template changes
  useEffect(() => {
    if (isOpen && template) {
      const { url, urlTooLong } = buildTemplateShareUrl(template);
      setShareUrl(url);
      setUrlTooLong(urlTooLong);
      setCopied(false);
      setCopyError(null);
    }
  }, [isOpen, template]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setCopyError(null);
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError('复制失败，请手动复制链接');
    }
  }, [shareUrl]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!isOpen || !template) return null;

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="share-dialog-title" className={styles.title}>
            🔗 分享模板
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Template info */}
          <div className={styles.templateInfo}>
            <span className={styles.templateIcon}>{template.icon}</span>
            <div className={styles.templateMeta}>
              <div className={styles.templateName}>{template.name}</div>
              <div className={styles.templateDesc}>
                {template.description || '无描述'}
              </div>
            </div>
          </div>

          {/* Share URL */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>分享链接</label>
            <div className={styles.urlBox}>
              <textarea
                className={styles.urlInput}
                value={shareUrl}
                readOnly
                rows={3}
                aria-label="分享链接"
              />
              <button
                type="button"
                className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
                onClick={handleCopy}
                disabled={!shareUrl}
              >
                {copied ? '已复制 ✓' : '复制链接'}
              </button>
            </div>

            {/* URL too long warning */}
            {urlTooLong && (
              <div className={styles.sizeWarning} role="alert">
                <span className={styles.sizeWarningIcon}>⚠️</span>
                <span>
                  链接较长，可能在部分浏览器和聊天工具中被截断。建议通过文件导出方式分享大模板。
                </span>
              </div>
            )}

            {/* Copy error */}
            {copyError && (
              <div className={styles.sizeWarning} role="alert" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                <span>❌</span>
                <span>{copyError}</span>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>工作原理</label>
            <div className={styles.howItWorks}>
              <strong>Base64 URL 分享</strong> — 模板数据直接编码到链接中，接收者打开链接即可导入模板。
              无需后端 API，链接可复制到任何地方。
              <br />
              <strong>限制：</strong>模板数据过大会导致链接过长（建议 &lt; 8KB）。
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            关闭
          </button>
          <button
            type="button"
            className={`${styles.copyAndCloseBtn} ${copied ? styles.copyAndCloseBtnCopied : ''}`}
            onClick={async () => {
              await handleCopy();
              onClose();
            }}
            disabled={!shareUrl}
          >
            {copied ? '已复制 ✓' : '复制并关闭'}
          </button>
        </div>
      </div>
    </div>
  );
}
