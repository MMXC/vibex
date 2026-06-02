/**
 * useBatchExportList — Batch export multiple canvases from canvasListStore
 *
 * S57-E1: CanvasList 批量导出
 *
 * Usage:
 * const { startExport, cancelExport, progress, status } = useBatchExportList();
 * await startExport(canvasIds, 'vibex');
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { loadCanvas } from '@/lib/canvas/persistence';
import { buildCanvasExportData } from '@/hooks/canvas/useCanvasExport';
import { useCanvasListStore } from '@/stores/canvasListStore';
import type { CanvasMeta } from '@/stores/canvasListStore';

export type BatchListExportFormat = 'vibex' | 'json';

export type BatchListExportStatus =
  | 'idle'
  | 'loading'
  | 'exporting'
  | 'done'
  | 'cancelled'
  | 'error';

export interface BatchListExportProgress {
  /** Current canvas index (1-based) */
  current: number;
  /** Total number of canvases */
  total: number;
  /** Current canvas name */
  canvasName: string;
}

/** Canvas data snapshot for export */
export interface CanvasExportData {
  canvasId: string;
  name: string;
  updatedAt: string;
  data: Record<string, unknown>;
}

export interface UseBatchExportListResult {
  /** Current export status */
  status: BatchListExportStatus;
  /** Progress info (current/total + canvasName) */
  progress: BatchListExportProgress | null;
  /** Error message if status === 'error' */
  error: string | null;
  /**
   * Start batch export for given canvas IDs
   * @param canvasIds Array of canvas IDs to export
   * @param format Export format: 'vibex' (ZIP with manifest) or 'json' (plain JSON array)
   */
  startExport: (canvasIds: string[], format?: BatchListExportFormat) => Promise<void>;
  /** Cancel the ongoing export */
  cancelExport: () => void;
}

/**
 * Sanitize filename to be safe for ZIP and file systems
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
}

/**
 * Download a Blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Load and serialize a single canvas's data
 * Returns CanvasExportData or null if loading failed
 */
async function loadCanvasExportData(
  canvasId: string,
  onProgress?: (canvasName: string) => void
): Promise<CanvasExportData | null> {
  // Look up canvas meta from canvasListStore
  const canvases = useCanvasListStore.getState().canvases;
  const meta: CanvasMeta | undefined = canvases.find((c) => c.id === canvasId);
  const canvasName = meta?.name ?? canvasId;

  onProgress?.(canvasName);

  // Load canvas data from IndexedDB into Zustand stores
  const loaded = await loadCanvas(canvasId);
  if (!loaded) {
    console.warn(`[useBatchExportList] Canvas not found in IndexedDB: ${canvasId}`);
    // Return empty data structure rather than null so export can continue
    return {
      canvasId,
      name: canvasName,
      updatedAt: meta?.updatedAt ?? new Date().toISOString(),
      data: { contextNodes: [], flowNodes: [], componentNodes: [] },
    };
  }

  // Serialize current store state
  const data = buildCanvasExportData('all');

  return {
    canvasId,
    name: canvasName,
    updatedAt: meta?.updatedAt ?? new Date().toISOString(),
    data,
  };
}

/**
 * Build manifest.json content for a batch export
 */
function buildManifest(
  canvases: CanvasExportData[],
  format: BatchListExportFormat
): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      format,
      canvasCount: canvases.length,
      canvases: canvases.map((c) => ({
        canvasId: c.canvasId,
        name: c.name,
        updatedAt: c.updatedAt,
        nodes:
          (Array.isArray(c.data.contextNodes) ? c.data.contextNodes.length : 0) +
          (Array.isArray(c.data.flowNodes) ? c.data.flowNodes.length : 0) +
          (Array.isArray(c.data.componentNodes) ? c.data.componentNodes.length : 0),
        edges: 0, // Edge count not directly available in snapshot data
      })),
    },
    null,
    2
  );
}

/**
 * Create a .vibex ZIP Blob from canvas export data
 */
async function createVibexBlob(
  canvases: CanvasExportData[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().slice(0, 10);
  const folder = zip.folder(`vibex-export-${timestamp}`);
  if (!folder) throw new Error('Failed to create ZIP folder');

  // Add manifest
  folder.file('manifest.json', buildManifest(canvases, 'vibex'));

  // Add each canvas's JSON file
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i]!;
    const filename = `${sanitizeFilename(canvas.name)}.json`;
    folder.file(filename, JSON.stringify(canvas.data, null, 2));
    onProgress?.(i + 1, canvases.length);
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Create a plain JSON Blob from canvas export data
 */
function createJsonBlob(canvases: CanvasExportData[]): Blob {
  const manifest = buildManifest(canvases, 'json');
  const manifestData = JSON.parse(manifest);
  return new Blob([JSON.stringify(manifestData, null, 2)], {
    type: 'application/json',
  });
}

export function useBatchExportList(): UseBatchExportListResult {
  const [status, setStatus] = useState<BatchListExportStatus>('idle');
  const [progress, setProgress] = useState<BatchListExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const cancelExport = useCallback(() => {
    cancelledRef.current = true;
    setStatus('cancelled');
  }, []);

  const startExport = useCallback(
    async (canvasIds: string[], format: BatchListExportFormat = 'vibex') => {
      // Cancel any ongoing export
      cancelExport();
      cancelledRef.current = false;

      setStatus('loading');
      setProgress(null);
      setError(null);

      try {
        if (canvasIds.length === 0) {
          setStatus('error');
          setError('没有选择要导出的画布');
          return;
        }

        setStatus('exporting');
        const canvases: CanvasExportData[] = [];

        // Load each canvas sequentially to avoid store conflicts
        for (let i = 0; i < canvasIds.length; i++) {
          if (cancelledRef.current) return;

          const canvasId = canvasIds[i]!;
          setProgress({
            current: i + 1,
            total: canvasIds.length,
            canvasName: '',
          });

          const data = await loadCanvasExportData(canvasId, (name) => {
            setProgress({
              current: i + 1,
              total: canvasIds.length,
              canvasName: name,
            });
          });

          if (data) {
            canvases.push(data);
          }

          if (cancelledRef.current) return;
        }

        if (cancelledRef.current) return;

        // Build ZIP/JSON
        setProgress({
          current: canvasIds.length,
          total: canvasIds.length,
          canvasName: '正在打包…',
        });

        let blob: Blob;
        let filename: string;
        const timestamp = new Date().toISOString().slice(0, 10);

        if (format === 'vibex') {
          blob = await createVibexBlob(canvases, (cur, total) => {
            setProgress({
              current: cur,
              total,
              canvasName: `正在打包 (${cur}/${total})…`,
            });
          });
          filename = `vibex-batch-${timestamp}.vibex`;
        } else {
          blob = createJsonBlob(canvases);
          filename = `vibex-batch-${timestamp}.json`;
        }

        downloadBlob(blob, filename);
        setStatus('done');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setStatus('cancelled');
        } else {
          setStatus('error');
          setError(err instanceof Error ? err.message : '批量导出失败');
        }
      }
    },
    [cancelExport]
  );

  return { status, progress, error, startExport, cancelExport };
}
