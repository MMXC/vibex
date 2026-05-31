/**
 * ShareButton — Canvas snapshot sharing button
 * S45-P005-E5: Canvas Snapshot Sharing
 *
 * Flow: Click → POST /api/snapshot { canvasJSON } → copy URL to clipboard → toast
 */
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { serializeThreeTrees } from '@/lib/canvas/serialize';
import styles from './ShareButton.module.css';

interface ShareButtonProps {
  projectName?: string;
  className?: string;
}

export function ShareButton({ projectName, className = '' }: ShareButtonProps) {
  const t = useTranslations('share');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (sharing) return;

    setSharing(true);
    setError(null);
    setCopied(false);

    try {
      // Serialize current canvas state
      const canvasJSON = serializeThreeTrees();

      // Create public snapshot
      const resp = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasJSON, projectName }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const errorMsg = data?.error || 'Failed to create shareable link';
        if (data?.code === 'SNAPSHOT_LIMIT_EXCEEDED') {
          setError(t('limitExceeded') || errorMsg);
        } else if (data?.code === 'INVALID_BODY') {
          setError(t('invalidRequest') || errorMsg);
        } else {
          setError(t('shareFailed') || errorMsg);
        }
        return;
      }

      const { url } = await resp.json();

      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('[ShareButton] Error:', err);
      setError(t('shareFailed') || 'Failed to create shareable link');
    } finally {
      setSharing(false);
    }
  }, [sharing, projectName, t]);

  if (error) {
    return (
      <div className={`${styles.shareButtonError} ${className}`} data-testid="share-button">
        <span className={styles.shareErrorText}>{error}</span>
        <button
          onClick={() => setError(null)}
          className={styles.shareDismissBtn}
          data-testid="share-error-dismiss"
        >
          ×
        </button>
      </div>
    );
  }

  if (copied) {
    return (
      <div className={`${styles.shareButtonSuccess} ${className}`} data-testid="share-button">
        <span className={styles.shareSuccessText}>✓ {t('copied') || 'Link copied!'}</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className={`${styles.shareButton} ${sharing ? styles.shareButtonLoading : ''} ${className}`}
      data-testid="share-button"
      aria-label={t('shareCanvas') || 'Share canvas snapshot'}
    >
      {sharing ? <span className={styles.shareSpinner}>⟳</span> : <span className={styles.shareIcon}>↗</span>}
      <span className={styles.shareLabel}>{t('share') || 'Share'}</span>
    </button>
  );
}
