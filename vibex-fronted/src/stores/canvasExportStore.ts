/**
 * canvasExportStore — Zustand store for canvas export state management
 * S87-E4: Canvas Export Enhancement
 *
 * Manages export UI state: loading format, PNG scale, error messages.
 * Used by ExportMenu dropdown to track active export operations.
 */

import { create } from 'zustand';

export type ExportFormat = 'JSON' | 'Vibex' | 'PDF' | 'PNG' | 'SVG' | 'Figma' | 'MultiFormat';

interface CanvasExportState {
  /** Currently exporting format (null = idle) */
  isExporting: boolean;
  /** The format currently being exported */
  loadingFormat: ExportFormat | null;
  /** PNG export resolution scale (1x/2x/3x) */
  exportScale: 1 | 2 | 3;
  /** Last export error message */
  exportError: string | null;
}

interface CanvasExportActions {
  /** Start exporting with a given format */
  setExporting: (format: ExportFormat | null) => void;
  /** Set PNG export resolution scale */
  setExportScale: (scale: 1 | 2 | 3) => void;
  /** Set export error message */
  setExportError: (error: string | null) => void;
  /** Reset all export state to idle */
  resetExportState: () => void;
}

const initialState: CanvasExportState = {
  isExporting: false,
  loadingFormat: null,
  exportScale: 2,
  exportError: null,
};

export const useCanvasExportStore = create<CanvasExportState & CanvasExportActions>()(
  (set) => ({
    ...initialState,

    setExporting: (format) =>
      set({
        isExporting: format !== null,
        loadingFormat: format,
        exportError: null,
      }),

    setExportScale: (scale) =>
      set({ exportScale: scale }),

    setExportError: (error) =>
      set({
        exportError: error,
        isExporting: false,
        loadingFormat: null,
      }),

    resetExportState: () =>
      set({
        isExporting: false,
        loadingFormat: null,
        exportError: null,
        exportScale: 2,
      }),
  })
);
