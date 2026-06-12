/**
 * useBatchExport — Hook for managing batch PNG/SVG/PDF export state
 * S89-E5: Extended with JSON/PPT/Markdown support
 *
 * Usage:
 * const { startExport, cancelExport, progress, status } = useBatchExport();
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { exportAndDownloadAsZip } from '@/lib/canvas/exportMultipleAsPNG';
import { exportAndDownloadAsSvgZip } from '@/lib/canvas/exportMultipleAsSVG';
import { exportAndDownloadAsPDF } from '@/lib/canvas/exportMultipleAsPDF';
import { useCanvasExportStore } from '@/stores/canvasExportStore';
import type { DDSCard } from '@/types/dds';

export type BatchExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'ppt' | 'markdown';

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
  startExport: (cards: DDSCard[], scope?: string, format?: BatchExportFormat, canvasName?: string) => Promise<void>;
  /** Cancel the ongoing export */
  cancelExport: () => void;
}

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

function exportAsJSON(cards: DDSCard[]): void {
  const canvasJSON = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      cardCount: cards.length,
    },
    nodes: cards,
    edges: [],
  };
  const blob = new Blob([JSON.stringify(canvasJSON, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `canvas-export-${Date.now()}.json`);
}

async function exportAsMarkdown(cards: DDSCard[], canvasName: string): Promise<void> {
  // Fetch markdown export from backend API
  const response = await fetch('/api/canvas/export/markdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards, canvasName }),
  });
  if (!response.ok) {
    throw new Error(`Markdown export failed: ${response.statusText}`);
  }
  const blob = await response.blob();
  downloadBlob(blob, `canvas-export-${Date.now()}.md`);
}

async function exportAsPPT(cards: DDSCard[]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PptxGenJS = require('pptxgenjs');
  const pptx = new PptxGenJS();

  // Group cards by chapter
  const chapterMap = new Map<string, DDSCard[]>();
  for (const card of cards) {
    const chapterId = (card as Record<string, unknown>).chapterId as string || 'default';
    if (!chapterMap.has(chapterId)) chapterMap.set(chapterId, []);
    chapterMap.get(chapterId)!.push(card);
  }

  let slideIndex = 0;
  for (const [chapterName, chapterCards] of chapterMap.entries()) {
    const slide = pptx.addSlide();

    // Chapter title
    slide.addText(chapterName || `Slide ${slideIndex + 1}`, {
      x: 0.5,
      y: 0.3,
      w: '90%',
      fontSize: 20,
      bold: true,
      color: 'FFFFFF',
    });

    // Cards as bullet points
    const bulletItems = chapterCards.map((card) => {
      const title = (card as Record<string, unknown>).title as string || card.id;
      const description = (card as Record<string, unknown>).description as string || '';
      return `${title}${description ? `: ${description}` : ''}`;
    });

    if (bulletItems.length > 0) {
      slide.addText(bulletItems, {
        x: 0.5,
        y: 0.8,
        w: '90%',
        fontSize: 12,
        color: 'CCCCCC',
        bullet: { type: 'bullet' },
      });
    }

    slideIndex++;
  }

  const pptxBlob = await pptx.write({ type: 'blob' });
  downloadBlob(pptxBlob as Blob, `canvas-export-${Date.now()}.pptx`);
}

export function useBatchExport(): UseBatchExportResult {
  const [status, setStatus] = useState<BatchExportStatus>('idle');
  const [progress, setProgress] = useState<BatchExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addExportHistory = useCanvasExportStore((s) => s.addExportHistory);
  const exportScale = useCanvasExportStore((s) => s.exportScale);

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('cancelled');
    }
  }, []);

  const startExport = useCallback(
    async (
      cards: DDSCard[],
      _scope?: string,
      format: BatchExportFormat = 'png',
      canvasName: string = 'Untitled Canvas'
    ) => {
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
            scale: exportScale,
            backgroundColor: '#0f0f1a',
            onProgress: (current, total, nodeName) => {
              setProgress({ current, total, nodeName });
            },
            signal: controller.signal,
          });
        } else if (format === 'json') {
          exportAsJSON(cards);
          setProgress({ current: cards.length, total: cards.length, nodeName: 'JSON export' });
        } else if (format === 'markdown') {
          await exportAsMarkdown(cards, canvasName);
          setProgress({ current: cards.length, total: cards.length, nodeName: 'Markdown export' });
        } else if (format === 'ppt') {
          await exportAsPPT(cards);
          setProgress({ current: cards.length, total: cards.length, nodeName: 'PPT export' });
        } else {
          // Default: PNG
          await exportAndDownloadAsZip(cards, {
            scope,
            scale: exportScale,
            backgroundColor: '#0f0f1a',
            onProgress: (current, total, nodeName) => {
              setProgress({ current, total, nodeName });
            },
            signal: controller.signal,
          });
        }

        // Add to export history
        addExportHistory({
          format: format.toUpperCase() as 'PNG' | 'SVG' | 'PDF' | 'JSON' | 'PPT' | 'MARKDOWN',
          scale: exportScale,
          timestamp: Date.now(),
          canvasName,
        });

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
    [cancelExport, addExportHistory, exportScale]
  );

  return { status, progress, error, startExport, cancelExport };
}
