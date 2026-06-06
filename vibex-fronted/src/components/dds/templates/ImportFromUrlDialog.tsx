/**
 * ImportFromUrlDialog.tsx — S69-E3: 模板市场
 *
 * Parses a Base64 share URL, previews the template, and imports it
 * with user-selected conflict resolution strategy.
 */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { decodeShareUrl, extractShareUrlFromLocation } from '@/lib/canvas/templateShare';
import { createTemplate, getTemplate, listTemplates } from '@/lib/canvas/templateStore';
import type { CanvasTemplateData } from '@/lib/canvas/templateStore';
import styles from './ImportFromUrlDialog.module.css';

interface ImportFromUrlDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Called when user closes the dialog */
  onClose: () => void;
  /** Called after successful import */
  onImported?: (templateId: string) => void;
}

type ImportStrategy = 'skip' | 'overwrite' | 'rename';

export function ImportFromUrlDialog({ isOpen, onClose, onImported }: ImportFromUrlDialogProps) {
  const [urlInput, setUrlInput] = useState('');
  const [parsedPayload, setParsedPayload] = useState<ReturnType<typeof decodeShareUrl>>(
    { success: false, error: '' }
  );
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [strategy, setStrategy] = useState<ImportStrategy>('skip');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Pre-fill from URL param on mount
  useEffect(() => {
    if (isOpen) {
      const shareUrl = extractShareUrlFromLocation();
      if (shareUrl) {
        setUrlInput(shareUrl);
        const result = decodeShareUrl(shareUrl);
        setParsedPayload(result);
        if (result.success) {
          checkDuplicate(result.payload.id);
        }
      }
    }
  }, [isOpen]);

  const checkDuplicate = useCallback(async (id: string) => {
    try {
      const existing = await getTemplate(id);
      setIsDuplicate(!!existing);
    } catch {
      setIsDuplicate(false);
    }
  }, []);

  const handleParse = useCallback(async () => {
    if (!urlInput.trim()) return;
    const result = decodeShareUrl(urlInput.trim());
    setParsedPayload(result);
    if (result.success) {
      await checkDuplicate(result.payload.id);
    }
    setImportResult(null);
  }, [urlInput, checkDuplicate]);

  const handleImport = useCallback(async () => {
    if (!parsedPayload.success) return;
    const { payload } = parsedPayload;

    setImporting(true);
    try {
      // Check if still duplicate (might have changed)
      const existing = await getTemplate(payload.id);
      if (existing && strategy === 'skip') {
        setImportResult('skip');
        setImporting(false);
        return;
      }

      let finalId = payload.id;
      if (strategy === 'rename') {
        // Generate new ID for rename
        finalId = `${payload.id}-import-${Date.now()}`;
      }

      const newTemplate: CanvasTemplateData = {
        ...payload,
        id: finalId,
        // Force isPreset=false for imported user templates
        isPreset: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createTemplate(newTemplate);
      setImportResult(finalId);
      setImporting(false);
      onImported?.(finalId);
    } catch (err) {
      setImportResult('error');
      setImporting(false);
    }
  }, [parsedPayload, strategy, onImported]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Reset state on close
  const handleClose = useCallback(() => {
    setUrlInput('');
    setParsedPayload({ success: false, error: '' });
    setIsDuplicate(false);
    setStrategy('skip');
    setImporting(false);
    setImportResult(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const hasPayload = parsedPayload.success;
  const payload = hasPayload ? parsedPayload.payload : null;
  const hasError = !hasPayload && parsedPayload.success === false && 'error' in parsedPayload;

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="import-dialog-title" className={styles.title}>
            📥 从链接导入模板
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* URL Input */}
          <div className={styles.inputSection}>
            <label className={styles.sectionLabel} htmlFor="import-url-input">
              分享链接
            </label>
            <textarea
              id="import-url-input"
              className={styles.urlInput}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="粘贴模板分享链接，例如：https://vibex.app/canvas?template=eyJ2ZXJza..."
              rows={3}
              aria-label="分享链接"
            />
            <button
              type="button"
              className={styles.parseBtn}
              onClick={handleParse}
              disabled={!urlInput.trim() || importing}
            >
              解析链接
            </button>

            {/* Parse error */}
            {hasError && (
              <div className={styles.parseError} role="alert">
                <span className={styles.parseErrorIcon}>❌</span>
                <span>{(parsedPayload as { error: string }).error}</span>
              </div>
            )}
          </div>

          {/* Template preview */}
          {payload && (
            <div className={styles.previewSection}>
              <label className={styles.sectionLabel}>模板预览</label>
              <div className={styles.previewBox}>
                <div className={styles.previewHeader}>
                  <span className={styles.previewIcon}>{payload.icon}</span>
                  <div>
                    <div className={styles.previewName}>{payload.name}</div>
                    <div className={styles.previewDesc}>
                      {payload.description || '无描述'}
                    </div>
                  </div>
                </div>
                <div className={styles.previewMeta}>
                  {payload.category && (
                    <span className={styles.previewTag}>{payload.category}</span>
                  )}
                  {payload.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.previewTag}>
                      {tag}
                    </span>
                  ))}
                  <span className={styles.previewTag}>
                    v{payload.version}
                  </span>
                </div>

                {/* Conflict warning */}
                {isDuplicate && (
                  <div className={styles.conflictWarning} role="alert">
                    <span className={styles.conflictIcon}>⚠️</span>
                    <div>
                      本地已存在同名模板（ID: {payload.id}），请选择导入策略。
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strategy selector — only show when duplicate */}
          {payload && isDuplicate && (
            <div className={styles.strategySection}>
              <label className={styles.sectionLabel}>导入策略</label>
              <div className={styles.strategyGroup}>
                {(
                  [
                    {
                      key: 'skip' as ImportStrategy,
                      label: '跳过',
                      desc: '不导入，保留本地版本',
                    },
                    {
                      key: 'overwrite' as ImportStrategy,
                      label: '覆盖',
                      desc: '用导入版本替换本地版本',
                    },
                    {
                      key: 'rename' as ImportStrategy,
                      label: '重命名导入',
                      desc: '为导入的模板生成新 ID，保留两个版本',
                    },
                  ] as { key: ImportStrategy; label: string; desc: string }[]
                ).map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className={`${styles.strategyOption} ${strategy === key ? styles.strategyOptionSelected : ''}`}
                  >
                    <input
                      type="radio"
                      name="import-strategy"
                      value={key}
                      checked={strategy === key}
                      onChange={() => setStrategy(key)}
                    />
                    <div className={styles.strategyText}>
                      <div className={styles.strategyLabel}>{label}</div>
                      <div className={styles.strategyDesc}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Import result feedback */}
          {importResult && (
            <div
              className={`${styles.parseError} ${importResult !== 'error' && importResult !== 'skip' ? '' : importResult === 'skip' ? '' : ''}`}
              style={
                importResult === 'skip'
                  ? { borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
                  : importResult === 'error'
                    ? { borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                    : {}
              }
              role="alert"
            >
              {importResult === 'skip' && '⏭️ 已跳过，保留本地模板'}
              {importResult === 'error' && '❌ 导入失败，请重试'}
              {importResult && importResult !== 'skip' && importResult !== 'error' && (
                <>
                  ✅ 导入成功！模板 ID: <strong>{importResult}</strong>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={handleClose}>
            关闭
          </button>
          <button
            type="button"
            className={`${styles.importBtn} ${importResult && importResult !== 'error' && importResult !== 'skip' ? styles.importBtnSuccess : ''}`}
            onClick={handleImport}
            disabled={!hasPayload || importing || (isDuplicate && strategy === 'skip')}
          >
            {importing
              ? '导入中...'
              : importResult && importResult !== 'skip' && importResult !== 'error'
                ? '✓ 导入成功'
                : isDuplicate && strategy === 'skip'
                  ? '跳过（已存在）'
                  : '导入模板'}
          </button>
        </div>
      </div>
    </div>
  );
}
