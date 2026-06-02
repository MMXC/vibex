/**
 * FileImportDialog — Preview & confirm dialog for imported files
 * S54-E2: Canvas File Import Enhancement
 *
 * Shows parsed file content preview (chapter counts, card counts)
 * before confirming import into the canvas store.
 */

'use client';

import React, { useCallback, useState } from 'react';
import { parseFile, type ParsedImportResult, type ParseError } from '@/lib/canvas/parseImportFile';
import { ddsChapterActions } from '@/stores/dds/DDSCanvasStore';
import type { ChapterData } from '@/types/dds';
import styles from './FileImportDialog.module.css';

interface FileImportDialogProps {
  /** Open state */
  isOpen: boolean;
  /** File to preview and import */
  file: File | null;
  /** Called when user confirms import */
  onImport: () => void;
  /** Called when user cancels */
  onClose: () => void;
}

type DialogState = 'idle' | 'parsing' | 'preview' | 'importing' | 'success' | 'error';

const CHAPTER_LABELS: Record<string, string> = {
  requirement: '需求',
  context: '上下文',
  flow: '流程',
  api: 'API',
  'business-rules': '业务规则',
};

export function FileImportDialog({ isOpen, file, onImport, onClose }: FileImportDialogProps) {
  const [state, setState] = useState<DialogState>('idle');
  const [parsed, setParsed] = useState<ParsedImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Parse file when dialog opens with a new file
  React.useEffect(() => {
    if (!isOpen || !file || state !== 'idle') return;
    setState('parsing');
    setErrorMsg('');

    parseFile(file).then((result) => {
      if ('code' in result) {
        setState('error');
        setErrorMsg(result.message);
        setParsed(null);
      } else {
        setState('preview');
        setParsed(result);
      }
    });
  }, [isOpen, file]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = useCallback(async () => {
    if (!parsed) return;
    setState('importing');

    try {
      // Add cards to each chapter in the store
      for (const chapter of parsed.chapters) {
        if (chapter.cards.length === 0) continue;
        for (const card of chapter.cards) {
          ddsChapterActions.addCard(chapter.type, card);
        }
        // Add edges
        if (chapter.edges && chapter.edges.length > 0) {
          for (const edge of chapter.edges) {
            ddsChapterActions.addEdge(chapter.type, edge);
          }
        }
      }

      setState('success');
      setTimeout(() => {
        onImport();
        // Reset state for next open
        setState('idle');
        setParsed(null);
        setErrorMsg('');
      }, 800);
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Import failed');
    }
  }, [parsed, onImport]);

  const handleCancel = useCallback(() => {
    setState('idle');
    setParsed(null);
    setErrorMsg('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={handleCancel} aria-hidden="true" />
      <div
        className={styles.dialog}
        role="dialog"
        aria-label="文件导入预览"
        aria-modal="true"
      >
        <header className={styles.header}>
          <h2 className={styles.title}>
            {state === 'parsing' ? '解析文件中...' :
             state === 'preview' ? '导入预览' :
             state === 'importing' ? '导入中...' :
             state === 'success' ? '导入成功' :
             state === 'error' ? '导入失败' :
             '文件导入'}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={handleCancel}
            aria-label="关闭"
            disabled={state === 'importing'}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          {/* File info */}
          {file && (
            <div className={styles.fileInfo}>
              <span className={styles.fileIcon}>📄</span>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          {/* Parsing spinner */}
          {state === 'parsing' && (
            <div className={styles.parsingState}>
              <div className={styles.spinner} aria-label="解析中" />
              <p>正在解析文件...</p>
            </div>
          )}

          {/* Preview table */}
          {state === 'preview' && parsed && (
            <div className={styles.preview}>
              <p className={styles.previewSummary}>
                发现 <strong>{parsed.totalCards}</strong> 个卡片，分布在{' '}
                <strong>{parsed.chapters.length}</strong> 个章节：
              </p>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>章节</th>
                    <th>卡片数</th>
                    <th>边数</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.chapters.map((ch) => (
                    <tr key={ch.type}>
                      <td>{CHAPTER_LABELS[ch.type] ?? ch.type}</td>
                      <td>{ch.cards.length}</td>
                      <td>{ch.edges?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.totalCards === 0 && (
                <p className={styles.emptyWarning}>⚠️ 文件中未发现可导入的卡片数据</p>
              )}
            </div>
          )}

          {/* Importing spinner */}
          {state === 'importing' && (
            <div className={styles.parsingState}>
              <div className={styles.spinner} aria-label="导入中" />
              <p>正在导入到画布...</p>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div className={styles.successState}>
              <span className={styles.successIcon}>✅</span>
              <p>成功导入 {parsed?.totalCards ?? 0} 个卡片！</p>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className={styles.errorState} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              <p>{errorMsg || '解析失败'}</p>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={state === 'importing' || state === 'parsing'}
          >
            取消
          </button>
          {state === 'preview' && parsed && parsed.totalCards > 0 && (
            <button
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={state === 'importing'}
            >
              确认导入
            </button>
          )}
        </footer>
      </div>
    </>
  );
}
