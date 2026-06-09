/**
 * useBatchCanvasExport — Hook for batch canvas ZIP export
 *
 * S83-E5: 批量导出 ZIP
 *
 * Loads canvas chapter data from IndexedDB, serializes each canvas as
 * {canvasName}_{canvasId}.flow.json, bundles them into a ZIP,
 * and triggers browser download.
 *
 * Usage:
 * const {
 *   selectedCanvasIds, toggleSelect, selectAll, clearSelection,
 *   startExport, cancelExport, status, progress, error, downloadUrl,
 *   reset
 * } = useBatchCanvasExport();
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { useCanvasListStore } from '@/stores/canvasListStore';
import type { CanvasChapterData } from '@/lib/canvas/canvasStoreRegistry';

// ============================================
// Types
// ============================================

export type BatchCanvasExportStatus =
  | 'idle'
  | 'loading'
  | 'packing'
  | 'done'
  | 'cancelled'
  | 'error';

export interface BatchCanvasExportProgress {
  current: number;
  total: number;
  canvasName: string;
}

export interface BatchExportProgress {
  current: number;
  total: number;
  canvasName: string;
}

/** Result for an individual canvas in the batch */
export interface CanvasExportResult {
  canvasId: string;
  canvasName: string;
  status: 'pending' | 'exporting' | 'done' | 'failed' | 'skipped';
  error?: string;
  nodeProgress?: { current: number; total: number };
}

export interface UseBatchCanvasExportResult {
  /** Canvas IDs currently selected for export */
  selectedCanvasIds: Set<string>;
  /** Toggle a single canvas in/out of selection */
  toggleSelect: (canvasId: string) => void;
  /** Select all loaded canvases */
  selectAll: () => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Start the batch export */
  startExport: (canvasIds?: string[]) => Promise<void>;
  /** Cancel ongoing export */
  cancelExport: () => void;
  /** Reset hook to idle state */
  reset: () => void;
  /** Current export status */
  status: BatchCanvasExportStatus;
  /** Overall progress info */
  progress: BatchCanvasExportProgress | null;
  /** Error message if status === 'error' */
  error: string | null;
  /** Number of canvases available */
  totalCanvases: number;
}

// ============================================
// Helpers
// ============================================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// Hook
// ============================================

export function useBatchCanvasExport(): UseBatchCanvasExportResult {
  const [selectedCanvasIds, setSelectedCanvasIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<BatchCanvasExportStatus>('idle');
  const [progress, setProgress] = useState<BatchCanvasExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<boolean>(false);

  const canvases = useCanvasListStore((s) => s.canvases);

  const toggleSelect = useCallback((canvasId: string) => {
    setSelectedCanvasIds((prev) => {
      const next = new Set(prev);
      if (next.has(canvasId)) next.delete(canvasId);
      else next.add(canvasId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCanvasIds(new Set(canvases.map((c) => c.id)));
  }, [canvases]);

  const clearSelection = useCallback(() => {
    setSelectedCanvasIds(new Set());
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setError(null);
    abortRef.current = false;
  }, []);

  const cancelExport = useCallback(() => {
    abortRef.current = true;
    setStatus('cancelled');
  }, []);

  const startExport = useCallback(async (overrideIds?: string[]) => {
    const ids = overrideIds ?? Array.from(selectedCanvasIds);
    if (ids.length === 0) return;

    abortRef.current = false;
    setStatus('loading');
    setProgress(null);
    setError(null);

    const zip = new JSZip();
    const timestamp = new Date().toISOString().slice(0, 10);
    let current = 0;

    try {
      for (const canvasId of ids) {
        if (abortRef.current) {
          setStatus('cancelled');
          return;
        }

        current++;
        const meta = canvases.find((c) => c.id === canvasId);
        const canvasName = meta?.name ?? canvasId;

        setProgress({ current, total: ids.length, canvasName });
        setStatus('packing');

        // Load chapter data from IndexedDB
        const { quickLoad } = await import('@/services/dds/ddsPersistence');
        let chapterData: CanvasChapterData | null = null;
        try {
          chapterData = await quickLoad(canvasId);
        } catch {
          // canvas not found or corrupted — skip
          continue;
        }

        // Serialize canvas metadata + chapter data
        const flowData = {
          version: 1,
          canvasId,
          canvasName,
          exportedAt: new Date().toISOString(),
          source: 'vibex',
          metadata: {
            id: canvasId,
            name: canvasName,
            createdAt: meta?.createdAt ?? null,
            updatedAt: meta?.updatedAt ?? null,
            tags: meta?.tags ?? [],
            description: meta?.description ?? '',
          },
          chapters: chapterData?.chapters ?? {},
        };

        const safeName = canvasName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
        zip.file(`${safeName}_${canvasId}.flow.json`, JSON.stringify(flowData, null, 2));
      }

      if (abortRef.current) {
        setStatus('cancelled');
        return;
      }

      setStatus('packing');
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const filename = `vibex-canvas-export-${ids.length}-${timestamp}.zip`;
      downloadBlob(blob, filename);
      setStatus('done');
      setProgress({ current: ids.length, total: ids.length, canvasName: '完成' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导出失败';
      setError(msg);
      setStatus('error');
    }
  }, [selectedCanvasIds, canvases]);

  return {
    selectedCanvasIds,
    toggleSelect,
    selectAll,
    clearSelection,
    startExport,
    cancelExport,
    reset,
    status,
    progress,
    error,
    totalCanvases: canvases.length,
  };
}
