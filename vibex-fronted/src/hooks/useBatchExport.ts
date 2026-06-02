/**
 * useBatchExport — Hook for managing batch PNG/SVG/PDF export state
 *
 * E2: PNG/SVG/PDF 批量导出
 *
 * Usage:
 * const { startExport, cancelExport, progress, status } = useBatchExport();
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { exportAndDownloadAsZip } from '@/lib/canvas/exportMultipleAsPNG';
import { exportAndDownloadAsSvgZip } from '@/lib/canvas/exportMultipleAsSVG';
import { exportAndDownloadAsPDF } from '@/lib/canvas/exportMultipleAsPDF';
import type { DDSCard } from '@/types/dds';

export type BatchExportFormat = 'png' | 'svg' | 'pdf' | 'zip';

export type BatchExportStatus =
  | 'idle'
  | 'collecting'
  | 'exporting'
  | 'done'
  | 'cancelled'
  | 'error';

export interface BatchExportProgress {
  current: number;
  total: number;
  nodeName: string;
}

export interface UseBatchExportResult {
  /** Current export status */
  status: BatchExportStatus;
  /** Progress info (current/total) */
  progress: BatchExportProgress | null;
  /** Error message if status === 'error' */
  error: string | null;
  /** Start a batch export for given cards */
  startExport: (cards: DDSCard[], scope?: string, format?: BatchExportFormat) => Promise<void>;
  /** Cancel the ongoing export */
  cancelExport: () => void;
}

export function useBatchExport(): UseBatchExportResult {
  const [status, setStatus] = useState<BatchExportStatus>('idle');
  const [progress, setProgress] = useState<BatchExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('cancelled');
    }
  }, []);

  const startExport = useCallback(
    async (cards: DDSCard[], _scope?: string, format: BatchExportFormat = 'png') => {
      // Cancel any ongoing export
      cancelExport();

      setStatus('collecting');
      setProgress(null);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setStatus('exporting');

        const scope = (_scope as 'all' | 'requirement' | 'context' | 'flow') ?? 'all';

        if (format === 'svg') {
          await exportAndDownloadAsSvgZip(cards, {
            scope,
            backgroundColor: '#0f0f1a',
            onProgress: (current, total, nodeName) => {
              setProgress({ current, total, nodeName });
            },
            signal: controller.signal,
          });
        } else if (format === 'pdf') {
          await exportAndDownloadAsPDF(cards, {
            scope,
            scale: 2,
            backgroundColor: '#0f0f1a',
            onProgress: (current, total, nodeName) => {
              setProgress({ current, total, nodeName });
            },
            signal: controller.signal,
          });
        } else {
          // Default: PNG
          await exportAndDownloadAsZip(cards, {
            scope,
            scale: 2,
            backgroundColor: '#0f0f1a',
            onProgress: (current, total, nodeName) => {
              setProgress({ current, total, nodeName });
            },
            signal: controller.signal,
          });
        }

        setStatus('done');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setStatus('cancelled');
        } else {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Export failed');
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [cancelExport]
  );

  return { status, progress, error, startExport, cancelExport };
}
