/**
 * QRShareDialog.tsx — S92-E4: QR Code Sharing
 *
 * E4-F2: Generates a QR code for the canvas URL.
 * Uses the `qrcode` library to render a canvas QR code.
 * The QR code encodes a URL with the canvas ID for mobile scanning.
 */

'use client';

import React, { memo, useCallback, useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import styles from './QRShareDialog.module.css';

interface QRShareDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Canvas ID */
  canvasId: string;
  /** Canvas name for display */
  canvasName?: string;
  /** Called when dialog requests close */
  onClose: () => void;
}

type DialogState = 'generating' | 'ready' | 'error';

export const QRShareDialog = memo(function QRShareDialog({
  isOpen,
  canvasId,
  canvasName,
  onClose,
}: QRShareDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [state, setState] = useState<DialogState>('generating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Build canvas preview URL (mobile-friendly)
  const canvasUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/canvas/${canvasId}`
    : `/canvas/${canvasId}`;

  // Generate QR code
  useEffect(() => {
    if (!isOpen) return;

    setState('generating');
    setErrorMessage(null);

    const generate = async () => {
      try {
        // Generate a data URL for the QR code
        const dataUrl = await QRCode.toDataURL(canvasUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
        setState('ready');
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : '生成二维码失败');
        setState('error');
      }
    };

    void generate();
  }, [isOpen, canvasUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(canvasUrl);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = canvasUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [canvasUrl]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-dialog-title"
      data-testid="qr-share-dialog"
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title} id="qr-dialog-title">📱 扫码分享</div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="关闭"
            data-testid="qr-dialog-close"
          >
            ✕
          </button>
        </div>

        {/* QR Code display */}
        <div className={styles.qrContainer}>
          {state === 'generating' && (
            <div className={styles.loading} data-testid="qr-loading">
              <div className={styles.spinner} />
              <span>生成二维码...</span>
            </div>
          )}

          {state === 'error' && (
            <div className={styles.error} data-testid="qr-error">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {state === 'ready' && qrDataUrl && (
            <>
              <img
                src={qrDataUrl}
                alt={`${canvasName ?? canvasId} 二维码`}
                className={styles.qrImage}
                width={256}
                height={256}
                data-testid="qr-code-image"
              />
              <div className={styles.scanHint}>
                用手机扫描上方二维码<br />
                <span className={styles.url}>{canvasUrl}</span>
              </div>
            </>
          )}
        </div>

        {/* Canvas info */}
        <div className={styles.canvasInfo}>
          <div className={styles.canvasName}>{canvasName ?? '画布'}</div>
          <div className={styles.canvasId}>ID: {canvasId}</div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.copyBtn}
            onClick={handleCopyLink}
            data-testid="qr-copy-link"
          >
            复制链接
          </button>
          <button
            className={styles.doneBtn}
            onClick={onClose}
            data-testid="qr-done"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
});
