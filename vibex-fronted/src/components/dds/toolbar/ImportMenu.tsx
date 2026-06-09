'use client';

/**
 * ImportMenu — Canvas import dropdown menu with file select, URL input, and drag zone
 * S81-E1: 画布导入格式支持
 *
 * Integrates with CanvasImporter for .flow.json / .flow.zip parsing
 * and handles ImportConflictDialog for name conflicts.
 */

import React, { useCallback, useRef, useState } from 'react';
import { CanvasImporter } from '@/services/canvas/CanvasImporter';
import { ImportConflictDialog } from '@/components/dds/canvas/ImportConflictDialog';
import type { ImportConflict } from '@/services/canvas/CanvasImporter';
import styles from './ImportMenu.module.css';

export interface ImportMenuProps {
  /** 按钮触发器的 children */
  children: React.ReactNode;
  /** 获取当前画布列表（用于冲突检测） */
  getExistingCanvases: () => Array<{ id: string; name: string }>;
  /** 导入成功后回调：chapters + 可选的覆盖目标 canvasId */
  onImportSuccess: (canvasId?: string, renamedName?: string) => void;
}

type DropState = 'idle' | 'dragover' | 'error';

/**
 * ImportMenu — dropdown trigger that opens a panel with:
 * - File picker button (.flow.json, .flow.zip)
 * - URL input field
 * - Drag-and-drop zone
 */
export function ImportMenu({ children, getExistingCanvases, onImportSuccess }: ImportMenuProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [dropState, setDropState] = useState<DropState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ImportConflict | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const importer = useRef(new CanvasImporter());

  // Close panel on outside click
  const handleToggle = useCallback(() => {
    setOpen((v) => !v);
    setError(null);
  }, []);

  // File picker
  const handleFileSelect = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.flow.json,.flow.zip,application/json';
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      const result = await importer.current.importFile(file);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const { data } = result;
      const existing = getExistingCanvases();
      const conflictInfo = importer.current.checkConflict(data.name, existing);

      if (conflictInfo) {
        setConflict(conflictInfo);
        return;
      }

      onImportSuccess();
      setOpen(false);
      setError(null);
    });

    input.click();
  }, [getExistingCanvases, onImportSuccess]);

  // URL import
  const handleUrlImport = useCallback(async () => {
    if (!url.trim()) return;
    setError(null);

    try {
      const resp = await fetch(url.trim());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();

      // Determine filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1] || 'canvas.flow.json';
      const file = new File([blob], fileName.endsWith('.flow.json') || fileName.endsWith('.flow.zip')
        ? fileName
        : 'canvas.flow.json',
        { type: 'application/json' }
      );

      const result = await importer.current.importFile(file);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const { data } = result;
      const existing = getExistingCanvases();
      const conflictInfo = importer.current.checkConflict(data.name, existing);

      if (conflictInfo) {
        setConflict(conflictInfo);
        return;
      }

      onImportSuccess();
      setOpen(false);
      setError(null);
      setUrl('');
    } catch (e) {
      setError(`URL 导入失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  }, [url, getExistingCanvases, onImportSuccess]);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDropState('dragover');
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropState('idle');
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDropState('idle');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const result = await importer.current.importFile(file);
    if (!result.ok) {
      setDropState('error');
      setError(result.error);
      setTimeout(() => setDropState('idle'), 2000);
      return;
    }

    const { data } = result;
    const existing = getExistingCanvases();
    const conflictInfo = importer.current.checkConflict(data.name, existing);

    if (conflictInfo) {
      setConflict(conflictInfo);
      return;
    }

    onImportSuccess();
    setOpen(false);
    setError(null);
  }, [getExistingCanvases, onImportSuccess]);

  // Conflict resolution
  const handleConflictAction = useCallback(
    (action: 'cover' | 'rename' | 'cancel', renamedName?: string) => {
      setConflict(null);
      if (action === 'cancel') return;
      if (action === 'rename' && renamedName) {
        onImportSuccess(undefined, renamedName);
      } else if (action === 'cover') {
        // Caller handles overwrite via canvasId
        onImportSuccess(conflict?.existingCanvasId);
      }
      setOpen(false);
      setError(null);
    },
    [conflict, onImportSuccess]
  );

  return (
    <>
      {/* Trigger */}
      <span onClick={handleToggle} aria-haspopup="true" aria-expanded={open}>
        {children}
      </span>

      {/* Dropdown panel */}
      {open && (
        <div className={styles.panel} ref={panelRef} role="menu" aria-label="导入画布">
          <div className={styles.section}>
            <button
              className={styles.fileBtn}
              onClick={handleFileSelect}
              aria-label="选择 .flow.json 或 .flow.zip 文件"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              选择文件
            </button>
            <span className={styles.formats}>.flow.json · .flow.zip</span>
          </div>

          <div className={styles.divider} />

          {/* URL import */}
          <div className={styles.section}>
            <div className={styles.urlRow}>
              <input
                className={styles.urlInput}
                type="url"
                placeholder="https://example.com/canvas.flow.json"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUrlImport(); }}
                aria-label="画布文件 URL"
              />
              <button
                className={styles.urlBtn}
                onClick={handleUrlImport}
                disabled={!url.trim()}
                aria-label="从 URL 导入"
              >
                导入
              </button>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Drag zone */}
          <div
            className={`${styles.dropZone} ${dropState === 'dragover' ? styles.dropActive : ''} ${dropState === 'error' ? styles.dropError : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="region"
            aria-label="拖拽文件到此处导入"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>拖拽 .flow.json 或 .flow.zip 到此处</span>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Conflict dialog */}
      {conflict && (
        <ImportConflictDialog
          incomingName={conflict.incomingName}
          existingName={conflict.existingName}
          onAction={handleConflictAction}
        />
      )}
    </>
  );
}
