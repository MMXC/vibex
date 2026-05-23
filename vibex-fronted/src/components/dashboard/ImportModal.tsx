'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/auth-token';
import { queryKeys } from '@/hooks/queries';
import { useTranslations } from '@/hooks/useTranslations';
import styles from './ImportModal.module.css';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const t = useTranslations('dashboard')();
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMessage('');
      setIsDragging(false);
    }
  }, [isOpen]);

  const handleImport = useCallback(async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.vibex')) {
      setStatus('error');
      setErrorMessage(t('invalidFormat'));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setStatus('error');
      setErrorMessage(t('fileTooLarge', { size: '10MB' }));
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const token = getAuthToken();
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        setStatus('error');
        setErrorMessage(t('invalidJson'));
        return;
      }

      const res = await fetch('/api/projects/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(json),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.message || t('importFailed'));
        return;
      }

      setStatus('success');
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      onSuccess?.();

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : t('importFailed'));
    }
  }, [onClose, onSuccess, queryClient]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImport(file);
    }
  }, [handleImport]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  }, [handleImport]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClose = useCallback(() => {
    if (status !== 'loading') {
      onClose();
    }
  }, [onClose, status]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="import-modal-title" className={styles.title}>{t('importProject')}</h2>
          {status !== 'loading' && (
            <button className={styles.closeBtn} onClick={handleClose} aria-label={t('close')}>
              ✕
            </button>
          )}
        </div>

        <div className={styles.body}>
          {status === 'idle' && (
            <>
              <p className={styles.hint}>{t('uploadVibexHint')}</p>
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
                data-testid="import-dropzone"
              >
                <span className={styles.dropzoneIcon}>📁</span>
                <p className={styles.dropzoneText}>{t('dropzoneHint')}</p>
                <p className={styles.dropzoneSubtext}>{t('orClickToSelect', { size: '10MB' })}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".vibex"
                className={styles.fileInput}
                onChange={handleFileSelect}
                aria-label={t('importProject')}
              />
            </>
          )}

          {status === 'loading' && (
            <div className={styles.loadingState} data-testid="import-loading">
              <div className={styles.spinner} />
              <p className={styles.loadingText}>{t('importing')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.successState} data-testid="import-success">
              <span className={styles.successIcon}>✅</span>
              <p className={styles.successText}>{t('importSuccess')}</p>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.errorState} data-testid="import-error">
              <span className={styles.errorIcon}>❌</span>
              <p className={styles.errorText}>{errorMessage}</p>
              <button
                className={styles.retryBtn}
                onClick={() => setStatus('idle')}
              >
                {t('retry')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
