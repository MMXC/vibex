'use client';

/**
 * TemplateForkButton — S93-E2: Template Versioning & Fork
 *
 * Button that forks a template, creating a personal copy.
 * Shows a dialog for naming the forked template.
 */

import React, { useState } from 'react';
import styles from './TemplateForkButton.module.css';

export interface TemplateForkButtonProps {
  /** The template ID to fork */
  templateId: string;
  /** Name of the template being forked (for display) */
  sourceName?: string;
  /** Called when fork is initiated — should perform the API call */
  onFork: (name: string) => Promise<void>;
  /** Whether the button is disabled (e.g. already forking) */
  disabled?: boolean;
  /** CSS class for the button */
  className?: string;
}

function ForkDialog({
  sourceName,
  onConfirm,
  onCancel,
  isForking,
  error,
}: {
  sourceName?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  isForking: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(sourceName ? `Copy of ${sourceName}` : 'My Fork');

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay (not the inner dialog) and not currently forking
    const overlayClass = styles.dialogOverlay ?? 'dialogOverlay';
    const clickedOverlay = (e.target as HTMLElement).classList.contains(overlayClass as string);
    if (clickedOverlay && !isForking) {
      onCancel();
    }
  };

  return (
    <div className={styles.dialogOverlay} data-testid="fork-dialog-overlay" role="dialog" aria-modal="true" aria-label="Fork 模板" onClick={handleOverlayClick}>
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <h3 className={styles.dialogTitle}>Fork 模板</h3>
          <button
            className={styles.dialogClose}
            onClick={onCancel}
            aria-label="关闭"
            disabled={isForking}
          >
            ×
          </button>
        </div>

        <div className={styles.dialogBody}>
          <p className={styles.dialogDesc}>
            为你的副本设置一个名称：
          </p>
          <label className={styles.label} htmlFor="fork-name">
            名称
          </label>
          <input
            id="fork-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="给你的模板起个名字"
            maxLength={200}
            disabled={isForking}
            autoFocus
          />
          {error && (
            <p className={styles.errorMsg} role="alert">
              {error}
            </p>
          )}
        </div>

        <div className={styles.dialogFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isForking}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={() => onConfirm(name.trim())}
            disabled={isForking || name.trim().length === 0}
          >
            {isForking ? 'Fork 中…' : 'Fork'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplateForkButton({
  templateId,
  sourceName,
  onFork,
  disabled = false,
  className = '',
}: TemplateForkButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setShowDialog(true);
    setError(null);
  };

  const handleConfirm = async (name: string) => {
    if (!name) {
      setError('名称不能为空');
      return;
    }
    setIsForking(true);
    setError(null);
    try {
      await onFork(name);
      setShowDialog(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fork 失败，请重试';
      setError(message);
    } finally {
      setIsForking(false);
    }
  };

  const handleCancel = () => {
    if (!isForking) {
      setShowDialog(false);
      setError(null);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.forkBtn} ${className}`}
        onClick={handleOpen}
        disabled={disabled}
        aria-label="Fork 此模板"
        data-testid="fork-template-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="12" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M18 9v1a2 2 0 01-2 2H8a2 2 0 01-2-2V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 12v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Fork
      </button>

      {showDialog && (
        <ForkDialog
          sourceName={sourceName}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isForking={isForking}
          error={error}
        />
      )}
    </>
  );
}
