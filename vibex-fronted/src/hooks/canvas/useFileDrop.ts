/**
 * useFileDrop — Hook for canvas-level file drag-and-drop import
 * S82-E4: 文件拖拽导入
 *
 * Responsibilities:
 * - Track global drag state (isDragging) during drag-enter/drag-leave/drag-over
 * - Detect canvas import files (.vibex, .json, .yaml, .yml, .flow.json, .flow.zip, etc.)
 * - Expose event handlers for the canvas container div
 * - Signal when a valid file is dropped so DDSCanvasPage can open CanvasImportPanel
 *
 * @module hooks/canvas/useFileDrop
 */

import { useState, useCallback, useRef } from 'react';

// ==================== Types ====================

export interface UseFileDropReturn {
  /** True when files are being dragged over the canvas */
  isDragging: boolean;
  /** True when a valid import file was just dropped — cleared on next drag-enter */
  isImportReady: boolean;
  /** Reset isImportReady so the same file can trigger again */
  clearImportReady: () => void;
  /** Attach to the canvas container div's onDragEnter */
  handleDragEnter: (e: React.DragEvent) => void;
  /** Attach to the canvas container div's onDragLeave */
  handleDragLeave: (e: React.DragEvent) => void;
  /** Attach to the canvas container div's onDragOver */
  handleDragOver: (e: React.DragEvent) => void;
  /** Attach to the canvas container div's onDrop */
  handleDrop: (e: React.DragEvent) => void;
}

export interface UseFileDropOptions {
  /**
   * Called when a valid canvas-import file is dropped.
   * DDSCanvasPage should open CanvasImportPanel in response.
   */
  onImportReady: () => void;
}

// ==================== Constants ====================

/**
 * File extensions that trigger the canvas import flow.
 * Mirrors CanvasImportPanel.ACCEPTED_EXTENSIONS.
 */
const ACCEPTED_EXTENSIONS = [
  '.vibex', '.json', '.yaml', '.yml',
  '.flow.json', '.flow.zip', '.flow.yaml', '.flow.yml',
] as const;

function isAcceptedFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function hasFileData(dataTransfer: DataTransfer): boolean {
  if (dataTransfer.items && dataTransfer.items.length > 0) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      if (dataTransfer.items[i].kind === 'file') return true;
    }
  }
  return dataTransfer.files.length > 0;
}

// ==================== Hook ====================

/**
 * useFileDrop — detects file drag-over/drop on the canvas page.
 *
 * Usage:
 * ```
 * const { isDragging, isImportReady, clearImportReady,
 *         handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileDrop({
 *   onImportReady: () => setImportPanelOpen(true),
 * });
 *
 * // Attach handlers to the canvas container div
 * <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
 *      onDragOver={handleDragOver} onDrop={handleDrop}>
 *
 * // Show import panel when isImportReady is true
 * {isImportReady && <CanvasImportPanel open={true} ... />}
 * ```
 */
export function useFileDrop(options: UseFileDropOptions): UseFileDropReturn {
  const { onImportReady } = options;

  const [isDragging, setIsDragging] = useState(false);
  /** True after a valid file is dropped; DDSCanvasPage watches this to open the panel */
  const [isImportReady, setIsImportReady] = useState(false);

  /** Counter-based drag enter/leave tracking (handles nested elements) */
  const dragCounterRef = useRef(0);

  const clearImportReady = useCallback(() => setIsImportReady(false), []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only activate for file drags from OS (not internal text/image drags)
      if (!hasFileData(e.dataTransfer)) return;

      dragCounterRef.current += 1;
      setIsDragging(true);
      // Clear any previous import-ready signal
      setIsImportReady(false);
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Set dropEffect to 'copy' to indicate files can be dropped
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      dragCounterRef.current = 0;

      if (!hasFileData(e.dataTransfer)) return;

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const hasAcceptedFile = Array.from(files).some((f) => isAcceptedFile(f.name));
      if (hasAcceptedFile) {
        setIsImportReady(true);
        onImportReady();
      }
    },
    [onImportReady]
  );

  return {
    isDragging,
    isImportReady,
    clearImportReady,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}

// ==================== Exports ====================

export { isAcceptedFile, ACCEPTED_EXTENSIONS };
