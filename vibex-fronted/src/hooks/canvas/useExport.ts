/**
 * useExport — Canvas Export as Code data fetching hook
 * Sprint94 E4: Canvas Export as Code
 *
 * Fetches canvas export data from the backend API and manages
 * loading/error states. Used by ExportPanel.
 *
 * Usage:
 * const { fetchPreview, preview, isLoading, error } = useExport(canvasId, format);
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useExportPanelStore } from '@/stores/exportStore';

export type ExportFormat = 'react' | 'svg' | 'md' | 'json';

interface UseExportOptions {
  /** Auto-fetch when canvasId or format changes */
  autoFetch?: boolean;
  /** API base URL override (defaults to /api) */
  baseUrl?: string;
}

interface UseExportReturn {
  /** Trigger a fetch for the current canvasId + format */
  fetchPreview: () => Promise<void>;
  /** Preview data from last successful fetch */
  preview: ReturnType<typeof useExportPanelStore>['preview'];
  /** Whether a fetch is in progress */
  isLoading: ReturnType<typeof useExportPanelStore>['isLoading'];
  /** Error message from last failed fetch */
  error: ReturnType<typeof useExportPanelStore>['error'];
  /** Copy preview text to clipboard */
  copyToClipboard: () => Promise<boolean>;
  /** Trigger file download */
  download: () => void;
}

/**
 * Hook to fetch and manage canvas export preview data.
 *
 * @param canvasId - The canvas ID to export
 * @param format - Export format (react|svg|md|json)
 * @param options - Optional configuration
 */
export function useExport(
  canvasId: string | null,
  format: ExportFormat,
  options: UseExportOptions = {}
): UseExportReturn {
  const { autoFetch = true, baseUrl = '' } = options;
  const abortControllerRef = useRef<AbortController | null>(null);

  const { setPreview, setLoading, setError, preview, isLoading, error, copyToClipboard: storeCopy, download: storeDownload } =
    useExportPanelStore();

  const fetchPreview = useCallback(async () => {
    if (!canvasId) return;

    // Abort any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      const url = `${baseUrl}/api/canvas/${canvasId}/export?format=${format}`;
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = `Export failed: ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody.error) errorMessage = errBody.error;
        } catch {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error ?? 'Export failed');
      }

      setPreview({
        data: result.data,
        filename: result.filename,
        mimeType: result.mimeType,
        cards: result.stats?.cards,
        edges: result.stats?.edges,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message ?? 'Unknown error');
    }
  }, [canvasId, format, baseUrl, setLoading, setPreview, setError]);

  // Auto-fetch when canvasId or format changes
  useEffect(() => {
    if (autoFetch && canvasId) {
      fetchPreview();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [autoFetch, canvasId, format, fetchPreview]);

  return {
    fetchPreview,
    preview,
    isLoading,
    error,
    copyToClipboard: storeCopy,
    download: storeDownload,
  };
}

/**
 * Hook to manage ExportPanel open/close state
 */
export function useExportPanel() {
  const { isOpen, canvasId, openPanel, closePanel } = useExportPanelStore();

  const openExportPanel = useCallback(
    (targetCanvasId: string) => {
      openPanel(targetCanvasId);
      // Dispatch event for toolbar/shortcuts
      window.dispatchEvent(new CustomEvent('open-export-panel', { detail: { canvasId: targetCanvasId } }));
    },
    [openPanel]
  );

  const closeExportPanel = useCallback(() => {
    closePanel();
    window.dispatchEvent(new CustomEvent('close-export-panel'));
  }, [closePanel]);

  return {
    isOpen,
    canvasId,
    openExportPanel,
    closeExportPanel,
  };
}
