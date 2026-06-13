/**
 * exportStore — Zustand store for ExportPanel state management
 * Sprint94 E4: Canvas Export as Code
 *
 * Manages ExportPanel UI state: selected format, preview data,
 * loading/error states, copy-to-clipboard and download actions.
 */

import { create } from 'zustand';

export type ExportPanelFormat = 'react' | 'svg' | 'md' | 'json';

export interface ExportPreviewData {
  data: string;
  filename: string;
  mimeType: string;
  cards?: number;
  edges?: number;
}

export interface ExportPanelState {
  /** Whether the ExportPanel is visible */
  isOpen: boolean;
  /** Currently selected export format */
  format: ExportPanelFormat;
  /** Preview content rendered as string */
  preview: ExportPreviewData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if last fetch failed */
  error: string | null;
  /** Current canvas ID for export */
  canvasId: string | null;
  /** Zoom level for preview (percentage) */
  previewZoom: number;
  /** Copy-to-clipboard success feedback */
  copySuccess: boolean;
}

export interface ExportPanelActions {
  /** Open the panel with a given canvasId */
  openPanel: (canvasId: string) => void;
  /** Close the panel and reset state */
  closePanel: () => void;
  /** Set the export format */
  setFormat: (format: ExportPanelFormat) => void;
  /** Set the preview data after a successful fetch */
  setPreview: (preview: ExportPreviewData | null) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Set the canvas ID */
  setCanvasId: (canvasId: string | null) => void;
  /** Set preview zoom level (50–200) */
  setPreviewZoom: (zoom: number) => void;
  /** Trigger copy-to-clipboard for preview data */
  copyToClipboard: () => Promise<boolean>;
  /** Trigger file download for preview data */
  download: () => void;
  /** Show copy success feedback */
  showCopySuccess: () => void;
  /** Reset all state to initial */
  reset: () => void;
}

const initialState: ExportPanelState = {
  isOpen: false,
  format: 'react',
  preview: null,
  isLoading: false,
  error: null,
  canvasId: null,
  previewZoom: 100,
  copySuccess: false,
};

export const useExportPanelStore = create<ExportPanelState & ExportPanelActions>()(
  (set, get) => ({
    ...initialState,

    openPanel: (canvasId) =>
      set({
        isOpen: true,
        canvasId,
        preview: null,
        error: null,
        isLoading: false,
        format: 'react',
        previewZoom: 100,
        copySuccess: false,
      }),

    closePanel: () =>
      set({
        isOpen: false,
        preview: null,
        error: null,
        isLoading: false,
      }),

    setFormat: (format) =>
      set({ format, preview: null, error: null }),

    setPreview: (preview) =>
      set({ preview, isLoading: false, error: null }),

    setLoading: (isLoading) =>
      set({ isLoading, error: isLoading ? null : get().error }),

    setError: (error) =>
      set({ error, isLoading: false, preview: null }),

    setCanvasId: (canvasId) =>
      set({ canvasId }),

    setPreviewZoom: (previewZoom) =>
      set({ previewZoom: Math.min(200, Math.max(50, previewZoom)) }),

    copyToClipboard: async () => {
      const { preview } = get();
      if (!preview) return false;
      try {
        await navigator.clipboard.writeText(preview.data);
        return true;
      } catch {
        // Fallback for environments without clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = preview.data;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      }
    },

    download: () => {
      const { preview } = get();
      if (!preview) return;
      const blob = new Blob([preview.data], { type: preview.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = preview.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    },

    showCopySuccess: () => {
      set({ copySuccess: true });
      setTimeout(() => set({ copySuccess: false }), 2000);
    },

    reset: () => set({ ...initialState }),
  })
);
